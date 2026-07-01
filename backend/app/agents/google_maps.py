import re
import asyncio
from typing import AsyncIterator, Optional, List
from playwright.async_api import BrowserContext, Locator, Page
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# --- Internal Imports ---
import sys
import os
# Add 'app' directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

# --- Inline Dependencies (to avoid external imports) ---
from dataclasses import dataclass, field
import logging

@dataclass
class CompanyRecord:
    """Represents a scraped company record"""
    channel_name: str
    channel_url: str
    scraped_url: str
    company_name: str
    company_website: Optional[str] = None
    company_full_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    company_category: Optional[str] = None
    keyword: Optional[str] = None
    company_phone_number: Optional[str] = None
    company_email: Optional[str] = None
    social_media_handles: dict = field(default_factory=dict)
    raw_payload: dict = field(default_factory=dict)

class AddressParser:
    """Simple address parser"""
    @staticmethod
    def parse(address: str) -> dict:
        """Parse address string into components"""
        if not address:
            return {}
        
        # Basic parsing - split by comma
        parts = [p.strip() for p in address.split(',')]
        result = {}
        
        if len(parts) >= 2:
            # Last part usually has state and zip
            last_part = parts[-1].strip()
            # Try to extract state (2 letters) and zip (5 digits)
            import re
            state_zip = re.search(r'([A-Z]{2})\s*(\d{5})', last_part)
            if state_zip:
                result['state'] = state_zip.group(1)
                result['zip_code'] = state_zip.group(2)
            
            # Second to last is usually city
            if len(parts) >= 2:
                result['city'] = parts[-2].strip()
        
        return result

class BaseChannelScraper:
    """Base class for channel scrapers"""
    def __init__(self, channel_name: str):
        self.channel_name = channel_name
        self.logger = logging.getLogger(channel_name)
        self.logger.setLevel(logging.INFO)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter('%(message)s'))
            self.logger.addHandler(handler)
    
    async def setup_page(self, context):
        """Setup a new page with anti-detection"""
        page = await context.new_page()
        return page
    
    async def random_sleep(self, min_sec: float, max_sec: float):
        """Random sleep to mimic human behavior"""
        import random
        await asyncio.sleep(random.uniform(min_sec, max_sec))


class GoogleMapsScraper(BaseChannelScraper):
    """
    Production-ready Google Maps Scraper.
    Strategies:
    1. Infinite Scroll on Sidebar (No 'Next' buttons).
    2. List-View Extraction (100x faster than clicking details).
    3. Resilience against DOM changes via ARIA labels.
    """
    BASE_URL = "https://www.google.com/maps"
    
    def __init__(self):
        super().__init__(channel_name="Google Maps")

    @retry(
        stop=stop_after_attempt(3), 
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception)
    )
    async def search(
        self,
        context: BrowserContext,
        location: str,
        keyword: Optional[str] = None,
        last_cursor: Optional[str] = None,
        max_concurrency: int = 20,
    ) -> AsyncIterator[CompanyRecord]:
        
        if not keyword:
            self.logger.warning("Google Maps requires a keyword. Skipping.")
            return

        search_query = f"{keyword} in {location}"
        page = await self.setup_page(context)
        
        unique_urls = set()
        
        try:
            self.logger.info(f"Navigating to GMaps: {search_query}")
            await page.goto(self.BASE_URL, timeout=180000, wait_until="domcontentloaded")  # Increased to 180s for proxy
            
            # Input Search
            await self._handle_consent(page)
            
            search_box = page.locator("input#searchboxinput, input[name='q'], input[aria-label='Search Google Maps']").first
            if await search_box.count() == 0:
                 self.logger.error("Could not find search box.")
                 return

            await search_box.fill(search_query)
            await page.keyboard.press("Enter")
            
            # Wait for Feed (with retry) - Increased timeout for local execution
            feed_selector = 'div[role="feed"]'
            feed_found = False
            for attempt in range(5):  # Increased from 3 to 5 attempts
                try:
                    await page.wait_for_selector(feed_selector, timeout=60000)  # Increased from 30s to 60s
                    feed_found = True
                    break
                except Exception as e:
                    if attempt < 2:
                        self.logger.warning(f"Attempt {attempt+1}: Feed not found, retrying...")
                        await self.random_sleep(1, 3)  # Longer sleep between retries
                    else:
                        self.logger.error(f"No results found for {search_query} after 5 attempts")
            
            if not feed_found:
                return

            # --- Phase 1: Harvest URLs ---
            self.logger.info("Phase 1: Harvesting URLs (Infinite scroll until exhausted)...")
            
            # Infinite scroll with smart exit
            scroll_attempts = 0
            same_count_streak = 0  # Track how many times we got the same count
            last_url_count = 0
            max_same_count = 3  # BALANCED: Wait for 3 same counts (captures more results)
            
            while True:
                # Collect URLs from current view
                articles = page.locator('div[role="article"]')
                count = await articles.count()
                
                for i in range(count):
                    try:
                        link = articles.nth(i).locator("a").first
                        href = await link.get_attribute("href")
                        if href and "/maps/place/" in href:
                            unique_urls.add(href)
                    except Exception:
                        continue
                
                current_url_count = len(unique_urls)
                self.logger.info(f"Scroll {scroll_attempts + 1}: {current_url_count} unique URLs (same count streak: {same_count_streak})")
                
                # Scroll down FIRST, then wait for new content to load
                try:
                    await page.evaluate(
                        f"""
                        const feed = document.querySelector('{feed_selector}');
                        if (feed) {{
                            feed.scrollTop = feed.scrollHeight;
                        }}
                        """
                    )
                    # BALANCED: 1.5-2s wait (matches manual scrolling, captures all results)
                    await self.random_sleep(1.5, 2)
                    
                    # Check if we reached bottom (end of list text)
                    if await page.locator("text=You've reached the end of the list").is_visible():
                        self.logger.info("Reached end of list marker.")
                        break
                        
                except Exception as e:
                    self.logger.warning(f"Scroll error: {e}")
                
                scroll_attempts += 1
                
                # Safety limit to prevent truly infinite loops (e.g., 200 scrolls max)
                if scroll_attempts >= 200:
                    self.logger.warning("Reached safety limit of 200 scrolls. Stopping.")
                    break
                
                # NOW check if count hasn't changed (after scroll + wait)
                new_url_count = len(unique_urls)
                if new_url_count == last_url_count:
                    same_count_streak += 1
                    if same_count_streak >= max_same_count:
                        self.logger.info(f"No new results after {max_same_count} consecutive scrolls. Stopping.")
                        break
                else:
                    same_count_streak = 0  # Reset streak if we got new results
                    last_url_count = new_url_count
                
            self.logger.info(f"Finished Harvesting after {scroll_attempts} scrolls. Total Unique URLs: {len(unique_urls)}")
            
            # Check if we got any URLs
            if len(unique_urls) == 0:
                self.logger.warning(f"!!! [ALERT] No businesses found for '{search_query}'.")
                self.logger.info("TIP: Check if Google Maps is blocking the IP or if the location is too specific/broad.")
                await page.close()
                return  # Exit early instead of processing empty list
            
            await page.close() # Close search page to save resources
            
            # --- Phase 2: Visit & Scrape (Queue-Based Workers) ---
            self.logger.info(f"Phase 2: Visiting and Scraping {len(unique_urls)} URLs concurrently...")
            
            # Optimization: Queue-based workers (no chunking bottleneck)
            self.logger.info(f"Using concurrency limit: {max_concurrency}")
            
            successful_scrapes = 0
            failed_scrapes = 0
            total_yielded = 0
            
            # Create queue and populate with URLs
            url_queue = asyncio.Queue()
            for url in unique_urls:
                await url_queue.put(url)
            
            # Shared flag to signal workers to stop
            stop_workers = False
            
            async def worker(worker_id: int):
                """Worker that continuously processes URLs from queue until empty."""
                nonlocal successful_scrapes, failed_scrapes, total_yielded, stop_workers
                
                while not stop_workers:
                    try:
                        # Get next URL (non-blocking, exits if queue empty)
                        url = url_queue.get_nowait()
                    except asyncio.QueueEmpty:
                        # No more URLs to process
                        return
                    
                    scrape_page = None
                    try:
                        # Process this URL - wrap in try/catch for browser closure
                        scrape_page = await context.new_page()
                        
                        # Block heavier resources on these detail pages to speed up
                        await scrape_page.route("**/*", lambda route: route.abort() 
                            if route.request.resource_type in ["image", "media", "font", "stylesheet"] 
                            else route.continue_())
                            
                        await scrape_page.goto(url, timeout=30000, wait_until="domcontentloaded")
                        
                        try:
                            # H1 is usually the company name
                            await scrape_page.wait_for_selector("h1", timeout=10000)
                        except Exception:
                            self.logger.warning(f"Timeout loading details for {url}")
                            failed_scrapes += 1
                            url_queue.task_done()
                            continue
                            
                        result = await self._scrape_detail_view(scrape_page, location, keyword)
                        if result:
                            successful_scrapes += 1
                            total_yielded += 1
                            yield result
                        else:
                            failed_scrapes += 1
                            
                    except Exception as e:
                        error_msg = str(e).lower()
                        # Check for browser/context closed errors - exit gracefully
                        if "target" in error_msg and ("closed" in error_msg or "not supported" in error_msg):
                            self.logger.debug(f"Worker {worker_id}: Browser context closed, stopping.")
                            stop_workers = True
                            try:
                                url_queue.task_done()
                            except ValueError:
                                pass  # Already done
                            return
                        else:
                            self.logger.debug(f"Error scraping {url}: {e}")
                            failed_scrapes += 1
                    finally:
                        if scrape_page:
                            try:
                                await scrape_page.close()
                            except Exception:
                                pass  # Page might already be closed
                        try:
                            url_queue.task_done()
                        except ValueError:
                            pass  # Already marked as done
            
            # Launch workers and collect results
            workers = []
            for i in range(max_concurrency):
                workers.append(worker(i))
            
            # Process all workers and yield results as they come
            async for result in self._merge_async_generators(*workers):
                yield result
            
            self.logger.info(f"Phase 2 Complete: {total_yielded} records yielded ({successful_scrapes} successful, {failed_scrapes} failed out of {len(unique_urls)} URLs)")

        except Exception as e:
            self.logger.error(f"Critical Error in search: {e}")
            raise e
    
    async def _merge_async_generators(self, *generators):
        """Merge multiple async generators into one stream."""
        queue = asyncio.Queue()
        sentinel = object()  # Unique sentinel to signal completion
        active_count = len(generators)
        
        async def consume(gen):
            nonlocal active_count
            try:
                async for item in gen:
                    await queue.put(item)
            except Exception as e:
                # Log but don't crash on generator errors (e.g., browser closed)
                error_msg = str(e).lower()
                if "target" not in error_msg or "closed" not in error_msg:
                    logging.debug(f"Generator error: {e}")
            finally:
                active_count -= 1
                if active_count == 0:
                    await queue.put(sentinel)
        
        # Start all generators
        tasks = [asyncio.create_task(consume(gen)) for gen in generators]
        
        # Yield items as they arrive
        try:
            while True:
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=2.0)
                    if item is sentinel:
                        break
                    yield item
                except asyncio.TimeoutError:
                    # Check if all tasks completed
                    if all(t.done() for t in tasks):
                        break
                    continue
        finally:
            # Cancel any remaining tasks
            for task in tasks:
                if not task.done():
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
        
        # Drain remaining items in queue
        while not queue.empty():
            item = queue.get_nowait()
            if item is not sentinel:
                yield item

    async def _scrape_detail_view(self, page: Page, location: str, keyword: str) -> Optional[CompanyRecord]:
        """
        Extracts data from the detail view.
        """
        try:
            # 1. Company Name (H1)
            company_name = await page.locator("h1").first.inner_text()
            if not company_name:
                return None

            # 2. Address
            address = None
            addr_btn = page.locator("button[data-item-id='address']")
            if await addr_btn.count() > 0:
                address = await addr_btn.get_attribute("aria-label")
                if address:
                    address = address.replace("Address: ", "").strip()
            
            # 3. Phone
            phone = None
            phone_btn = page.locator("button[data-item-id^='phone']")
            if await phone_btn.count() > 0:
                phone = await phone_btn.get_attribute("aria-label")
                if phone:
                    phone = phone.replace("Phone: ", "").strip()

            # 4. Website
            website = None
            web_btn = page.locator("a[data-item-id='authority']")
            if await web_btn.count() > 0:
                website = await web_btn.get_attribute("href")

            # 5. Parse Address
            parsed_addr = {}
            if address:
                parsed_addr = AddressParser.parse(address)
            
            # Normalization
            final_city = parsed_addr.get('city') 
            if not final_city and "," in location:
                final_city = location.split(",")[0].strip()

            final_state = parsed_addr.get('state')
            if not final_state and "," in location:
                 final_state = location.split(",")[1].strip()

            return CompanyRecord(
                channel_name=self.channel_name,
                channel_url=self.BASE_URL,
                scraped_url=page.url,
                company_name=company_name,
                company_website=website,
                company_full_address=address,
                city=final_city,
                state=final_state,
                zip_code=parsed_addr.get('zip_code'),
                company_category=keyword,
                keyword=keyword,
                company_phone_number=phone,
                company_email=None, 
                social_media_handles={},
                raw_payload={"source": "detail_view_direct"}
            )
        except Exception as e:
            self.logger.debug(f"Detail view parse error: {e}")
            return None



    async def _handle_consent(self, page: Page):
        """
        Handle Google's Before you continue to Google Maps consent modal.
        """
        try:
            # Common selectors for "Accept all" or "Agree"
            # It's usually a form with a button
            consent_buttons = page.locator("form[action*='consent'] button, button[aria-label='Accept all'], button:has-text('Accept all'), button:has-text('I agree')")
            
            if await consent_buttons.count() > 0:
                first_btn = consent_buttons.first
                if await first_btn.is_visible():
                    self.logger.info("Found consent/cookie banner. Clicking Accept...")
                    await first_btn.click()
                    await self.random_sleep(1.0, 2.0)
                    # Check if it's gone
                    if await consent_buttons.count() == 0:
                        self.logger.info("Consent banner dismissed.")
                    else:
                        # Sometimes there's a second page or it didn't register
                        pass
        except Exception as e:
            self.logger.debug(f"Consent handler warning: {e}")

# --- MAIN EXECUTION BLOCK ---
async def main():
    from playwright.async_api import async_playwright
    import csv
    from dataclasses import asdict

    scraper = GoogleMapsScraper()
    
    # Input configuration
    location = "Miami, FL"
    keywords = ["General Contractors", "Fabricators", "Retailers"]
    
    all_records = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ]
        )
        
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York",
            permissions=["geolocation"],
            java_script_enabled=True
        )
        
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        for keyword in keywords:
            print(f"\n--- Processing Keyword: {keyword} in {location} ---")
            async for record in scraper.search(context, location, keyword=keyword):
                print(f"Found: {record.company_name} | {record.company_phone_number}")
                all_records.append(record)
                
        await browser.close()
    
    if all_records:
        filename = "google_maps_results.csv"
        print(f"\nSaving {len(all_records)} records to {filename}...")
        
        # Get fieldnames from the first record
        fieldnames = [field for field in all_records[0].__dict__.keys()]
        
        with open(filename, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            for record in all_records:
                writer.writerow(asdict(record))
        print("Done.")
    else:
        print("\nNo records found to save.")

if __name__ == "__main__":
    import os
    if os.name == 'nt':
        # Use SelectorEventLoop for Playwright compatibility on Windows
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
