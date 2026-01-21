import os
import sys
import json
import asyncio
import re
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urlparse

# CRITICAL: Python 3.13+ Windows fix for Playwright
if sys.platform == 'win32':
    if sys.version_info >= (3, 13):
        import nest_asyncio
        nest_asyncio.apply()
    else:
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        except AttributeError:
            pass

from openai import AsyncOpenAI
from app.models.schemas import (
    LeadGenerationRequest, 
    LeadGenerationResult, 
    CompanyLead, 
    PersonContact
)
from app.services.web_scraper import WebScraper


def normalize_domain(website: Optional[str]) -> Optional[str]:
    if not website:
        return None
    w = website.strip().lower()
    if not w.startswith(("http://", "https://")):
        w = "http://" + w
    domain = urlparse(w).netloc
    domain = re.sub(r"^www\.", "", domain)
    return domain or None


def normalize_email(email: Optional[str]) -> Optional[str]:
    return email.strip().lower() if email else None


def should_skip_lead_in_run(
    lead: "CompanyLead",
    seen_domains: set,
    seen_emails: set,
) -> bool:
    """
    In-memory dedupe for the current generation run.
    Returns True if this lead should be skipped as a duplicate.
    """
    domain = normalize_domain(lead.website)
    emails = [normalize_email(e) for e in (lead.email_addresses or [])]

    # Duplicate company by domain
    if domain and domain in seen_domains:
        return True

    # Duplicate by any email
    if any(e and e in seen_emails for e in emails):
        return True

    # First time seeing this lead → record it
    if domain:
        seen_domains.add(domain)
    for e in emails:
        if e:
            seen_emails.add(e)

    return False


def score_lead(lead: "CompanyLead", request: "LeadGenerationRequest") -> int:
    """
    Simple heuristic scoring from 0–100.
    You can tune this over time as you learn what "good" looks like.
    """
    score = 0

    # 1) Industry match
    if lead.industry and request.target_industries:
        if lead.industry in request.target_industries:
            score += 25
        else:
            if any(ind.lower() in (lead.industry or "").lower() for ind in request.target_industries):
                score += 15

    # 2) Location match
    if lead.location and request.location:
        if request.location.lower() in lead.location.lower():
            score += 20

    # 3) Keywords matched (you already set keywords_matched)
    kw_count = len(lead.keywords_matched or [])
    score += min(kw_count * 5, 20)

    # 4) Contact quality (decision-makers)
    has_senior_contact = any(
        c.role_category in ("Decision Maker", "Founder", "C-Level", "VP", "Director")
        for c in (lead.key_contacts or [])
    )
    if has_senior_contact:
        score += 25
    elif lead.key_contacts:
        score += 10  # some contacts, but not ideal

    # 5) Confidence score from your enrichment
    if lead.confidence_score >= 0.9:
        score += 10
    elif lead.confidence_score >= 0.7:
        score += 5

    return max(0, min(score, 100))

class LeadGenerationAgent:
    """
    Agent responsible for discovering and enriching company leads from selected channels.
    Uses actual website scraping combined with LLM analysis for data enrichment.
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.scraper = WebScraper()
    
    def _matches_customer_pattern(self, lead: CompanyLead, pattern) -> bool:
        """
        Binary match check (NO scoring).
        Returns True if lead matches at least 2 out of 4 pattern attributes.
        This filters leads BEFORE enrichment to save API costs.
        """
        if not pattern:
            return True  # No pattern = accept all leads
        
        matches = 0
        
        # 1. Industry match
        if pattern.common_industries and lead.industry:
            lead_industry_lower = lead.industry.lower()
            if any(ind.lower() in lead_industry_lower for ind in pattern.common_industries):
                matches += 1
                print(f"✓ Industry match: {lead.industry} matches {pattern.common_industries}")
        
        # 2. Geographic match
        if pattern.geographic_focus and lead.location:
            location_lower = lead.location.lower()
            focus_lower = pattern.geographic_focus.lower()
            # Check if any part of the focus appears in location
            if any(part in location_lower for part in focus_lower.split()):
                matches += 1
                print(f"✓ Geographic match: {lead.location} matches {pattern.geographic_focus}")
        
        # 3. Descriptor match (check company name and industry)
        if pattern.common_descriptors:
            lead_text = f"{lead.company_name} {lead.industry or ''}".lower()
            if any(desc.lower() in lead_text for desc in pattern.common_descriptors):
                matches += 1
                print(f"✓ Descriptor match: found pattern keywords in {lead.company_name}")
        
        # 4. Size match (if we can infer from company name)
        # This is a basic heuristic - if pattern specifies SMB/Enterprise
        if pattern.typical_size:
            size_indicators = {
                "enterprise": ["inc", "corporation", "corp", "holdings"],
                "smb": ["llc", "ltd", "limited"],
            }
            company_lower = lead.company_name.lower()
            pattern_size_lower = pattern.typical_size.lower()
            
            if "enterprise" in pattern_size_lower:
                if any(ind in company_lower for ind in size_indicators["enterprise"]):
                    matches += 1
                    print(f"✓ Size match: {lead.company_name} appears to be Enterprise")
            elif any(term in pattern_size_lower for term in ["smb", "small", "10-50"]):
                if any(ind in company_lower for ind in size_indicators["smb"]):
                    matches += 1
                    print(f"✓ Size match: {lead.company_name} appears to be SMB")
        
        # Require at least 1 match to pass filter (was 2, too strict)
        # If pattern has very specific criteria, requiring 2/4 filters out too many leads
        passed = matches >= 1  # Changed from >= 2
        if not passed:
            print(f"✗ Pattern filter: {lead.company_name} matched {matches}/4 criteria - FILTERED OUT")
        else:
            print(f"✓ Pattern filter: {lead.company_name} matched {matches}/4 criteria - ACCEPTED")
        
        return passed
    
    async def generate_leads(self, request: LeadGenerationRequest) -> LeadGenerationResult:
        """
        Main orchestration method for lead generation workflow.
        Executes channel discovery and lead enrichment in parallel for maximum speed.
        """
        started_at = datetime.utcnow().isoformat()
        
        # 1. Parallel Channel Discovery
        # Create tasks for all channels to run simultaneously
        discovery_tasks = [
            self._discover_and_enrich_channel(
                channel=channel,
                request=request
            )
            for channel in request.selected_channels
        ]
        
        # Wait for all channels to complete
        results = await asyncio.gather(*discovery_tasks)
        
        # Aggregate results
        all_companies = []
        leads_by_channel = {}
        
        for channel_leads, channel_name in results:
            all_companies.extend(channel_leads)
            leads_by_channel[channel_name] = len(channel_leads)
        
        completed_at = datetime.utcnow().isoformat()
        
        return LeadGenerationResult(
            total_leads=len(all_companies),
            leads_by_channel=leads_by_channel,
            companies=all_companies,
            generation_summary=f"Generated {len(all_companies)} leads across {len(request.selected_channels)} channels",
            started_at=started_at,
            completed_at=completed_at
        )

    async def generate_leads_stream(self, request: LeadGenerationRequest):
        """
        Stream lead generation process yielding JSON lines.
        Yields events: "status", "lead", "summary", "error"
        """
        yield json.dumps({"type": "status", "data": "Starting lead generation..."}) + "\n"
        
        # We'll use a queue to collect results from multiple tasks
        queue = asyncio.Queue()

        async def worker(channel):
            try:
                await queue.put({"type": "status", "data": f"Discovering leads from {channel}..."})
                
                # Discovery
                leads = await self._discover_from_channel(
                    channel=channel,
                    keywords=request.selected_keywords,
                    industries=request.target_industries,
                    max_leads=request.max_leads_per_channel,
                    location=request.location
                )
                
                if not leads:
                     await queue.put({"type": "status", "data": f"No leads found in {channel}."})
                     return

                await queue.put({"type": "status", "data": f"Found {len(leads)} leads in {channel}. Enriching..."})

                # PATTERN FILTERING: DISABLED - was filtering out too many valid leads
                # if request.customer_pattern:
                #     print(f"\n🔍 Applying customer pattern filter...")
                #     original_count = len(leads)
                #     leads = [l for l in leads if self._matches_customer_pattern(l, request.customer_pattern)]
                #     filtered_count = original_count - len(leads)
                #     print(f"📊 Pattern filter: {original_count} leads → {len(leads)} leads ({filtered_count} filtered out)")
                #     await queue.put({"type": "status", "data": f"Filtered to {len(leads)} pattern-matching leads"})
                
                # if not leads:
                #     await queue.put({"type": "status", "data": f"No leads passed pattern filter in {channel}"})
                #     return
                
                # Enrichment mechanism
                semaphore = asyncio.Semaphore(5) # Limit concurrency per channel
                
                async def enrich_one(lead):
                    async with semaphore:
                        enriched = await self._enrich_company_lead(lead, request.company_summary)
                        
                        # Yield the lead immediately
                        try:
                           # Try Pydantic v2
                           data = enriched.model_dump()
                        except AttributeError:
                           # Fallback to Pydantic v1
                           data = enriched.dict()
                           
                        await queue.put({"type": "lead", "data": data})

                await asyncio.gather(*[enrich_one(l) for l in leads])
                await queue.put({"type": "status", "data": f"Completed {channel}"})
                
            except Exception as e:
                print(f"Error in channel {channel}: {e}")
                await queue.put({"type": "error", "message": str(e), "channel": channel})

        # Launch workers
        tasks = []
        for channel in request.selected_channels:
            tasks.append(asyncio.create_task(worker(channel)))

        # Waiter task to signal end
        async def waiter():
            await asyncio.gather(*tasks)
            await queue.put(None) # Sentinel

        asyncio.create_task(waiter())

        # Yield from queue
        while True:
            item = await queue.get()
            if item is None:
                break
            yield json.dumps(item) + "\n"

    async def _discover_and_enrich_channel(
        self,
        channel: str,
        request: LeadGenerationRequest
    ) -> tuple[List[CompanyLead], str]:
        """
        Helper method to handle a single channel's full lifecycle (Discovery -> Enrichment)
        """
        print(f"[START] Processing channel: {channel}...")
        
        # Step 1: Discover (LLM/Search)
        channel_leads = await self._discover_from_channel(
            channel=channel,
            keywords=request.selected_keywords,
            industries=request.target_industries,
            max_leads=request.max_leads_per_channel,
            location=request.location
        )
        
        if not channel_leads:
            return [], channel

        # Step 2: Enrich (Parallel Scraping with Safety Limit)
        # Limit to 10 concurrent connections to be polite and avoid blocking
        semaphore = asyncio.Semaphore(10)
        print(f"[ENRICH] Enriching {len(channel_leads)} leads from {channel} in parallel (Max 10 concurrent)...")
        
        async def enrich_with_limit(lead):
            async with semaphore:
                return await self._enrich_company_lead(lead, request.company_summary)

        enrichment_tasks = [
            enrich_with_limit(lead)
            for lead in channel_leads
        ]
        
        enriched_leads = await asyncio.gather(*enrichment_tasks)
        return enriched_leads, channel
    
    async def _discover_from_channel(
        self, 
        channel: str, 
        keywords: List[str], 
        industries: List[str],
        max_leads: int,
        location: Optional[str] = None
    ) -> List[CompanyLead]:
        """
        Discover companies from a specific channel.
        - For Google Maps: Uses real Playwright scraping
        - For other channels: Uses LLM-based discovery
        """
        
        # GOOGLE MAPS: Use real scraping
        # Support multiple channel name variations for better UX
        google_maps_variations = ["google maps", "googlemaps", "maps", "gmaps", "google map"]
        if channel.lower() in google_maps_variations:
            return await self._discover_from_google_maps(keywords, location or "United States", max_leads)
        
        # OTHER CHANNELS: Use LLM discovery
        system_prompt = f"""You are a B2B Lead Discovery Agent.
        Your task is to identify real companies that match the given criteria from the specified channel.
        
        Channel: {channel}
        
        For each company, provide:
        - Company name (real, existing company)
        - Website URL
        - Industry
        - Estimated company size (e.g., "1-10", "11-50", "51-200", "201-500", "500+")
        - Location (City, Country)
        - LinkedIn URL (if applicable)
        
        Return a JSON array of companies. Limit to {max_leads} companies.
        Focus on companies that are likely to be found on {channel} and match the keywords/industries.
        
        Output format:
        {{
            "companies": [
                {{
                    "company_name": "Example Corp",
                    "website": "https://example.com",
                    "industry": "Technology",
                    "company_size": "51-200",
                    "location": "San Francisco, USA",
                    "linkedin_url": "https://linkedin.com/company/example"
                }}
            ]
        }}
        """
        
        user_prompt = f"""
        Keywords: {', '.join(keywords[:5])}
        Industries: {', '.join(industries)}
        
        Find companies on {channel} that match these criteria.
        Provide real, existing companies that would realistically be found on this platform.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            data = json.loads(response.choices[0].message.content)
            companies_data = data.get("companies", [])
            
            # Convert to CompanyLead objects
            leads = []
            for comp in companies_data[:max_leads]:
                lead = CompanyLead(
                    company_name=comp.get("company_name", "Unknown"),
                    website=comp.get("website"),
                    industry=comp.get("industry"),
                    company_size=comp.get("company_size"),
                    location=comp.get("location"),
                    linkedin_url=comp.get("linkedin_url"),
                    channel_source=channel,
                    keywords_matched=keywords[:3],
                    confidence_score=0.6,
                    enrichment_status="pending",
                    data_sources=[f"{channel}_discovery"],
                    discovered_at=datetime.utcnow().isoformat()
                )
                leads.append(lead)
            
            return leads
            
        except Exception as e:
            print(f"Error discovering from {channel}: {e}")
            return []
    
    async def _discover_from_google_maps(
        self,
        keywords: List[str],
        location: str,
        max_leads: int
    ) -> List[CompanyLead]:
        """
        Use GoogleMapsScraper to discover real leads.
        Runs Playwright in a separate thread with its own event loop to avoid
        Python 3.13 + Windows + Uvicorn compatibility issues.
        """
        print(f"[GOOGLE MAPS] Scraping for keywords: {keywords} in {location}")
        
        def _run_playwright_sync():
            """
            Run Playwright in a separate thread with its own ProactorEventLoop.
            This fixes the NotImplementedError on Windows + Python 3.13 + Uvicorn.
            """
            import asyncio
            from playwright.async_api import async_playwright
            from app.agents.google_maps import GoogleMapsScraper
            
            # Create a fresh ProactorEventLoop for this thread (required for subprocess on Windows)
            if sys.platform == 'win32':
                loop = asyncio.ProactorEventLoop()
            else:
                loop = asyncio.new_event_loop()
            
            asyncio.set_event_loop(loop)
            
            async def _scrape():
                scraper = GoogleMapsScraper()
                discovered_leads = []
                
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
                    
                    # Scrape for each keyword (limit to first 3 keywords to avoid overwhelming)
                    for keyword in keywords[:3]:
                        print(f"  -> Searching: '{keyword}' in {location}")
                        
                        record_count = 0
                        async for record in scraper.search(context, location, keyword=keyword, max_concurrency=10):
                            # Convert CompanyRecord to CompanyLead
                            # Enhanced WhatsApp detection: International numbers (+country code) likely support WhatsApp
                            phone_numbers = []
                            if record.company_phone_number:
                                phone_str = str(record.company_phone_number).strip()
                                has_whatsapp = phone_str.startswith('+') and len(phone_str) > 10
                                phone_numbers.append({
                                    "number": phone_str, 
                                    "has_whatsapp": has_whatsapp
                                })
                            
                            # Build location string with fallback logic
                            location_str = record.company_full_address
                            if not location_str and (record.city or record.state):
                                parts = [p for p in [record.city, record.state] if p]
                                location_str = ", ".join(parts)
                            
                            lead = CompanyLead(
                                company_name=record.company_name,
                                website=record.company_website,
                                industry=record.company_category or "Unknown",
                                location=location_str or "Unknown",
                                main_address=record.company_full_address,
                                phone_numbers=phone_numbers,
                                channel_source="Google Maps",
                                keywords_matched=[keyword],
                                confidence_score=0.9,  # High confidence from Google Maps
                                enrichment_status="pending",
                                data_sources=["google_maps_scraper"],
                                discovered_at=datetime.utcnow().isoformat()
                            )
                            discovered_leads.append(lead)
                            record_count += 1
                            
                            # Stop if we've reached max leads across all keywords
                            if len(discovered_leads) >= max_leads:
                                break
                        
                        print(f"  [OK] Found {record_count} companies for '{keyword}'")
                        
                        if len(discovered_leads) >= max_leads:
                            break
                    
                    await browser.close()
                
                return discovered_leads
            
            try:
                return loop.run_until_complete(_scrape())
            finally:
                loop.close()
        
        try:
            # Run Playwright in a separate thread to avoid event loop conflicts
            loop = asyncio.get_running_loop()
            discovered_leads = await loop.run_in_executor(None, _run_playwright_sync)
            
            print(f"[GOOGLE MAPS] Discovered {len(discovered_leads)} total leads")
            return discovered_leads[:max_leads]
            
        except Exception as e:
            error_msg = str(e).lower()
            
            # Categorize error for better debugging
            if "browser" in error_msg or "playwright" in error_msg:
                print(f"[ERROR] GOOGLE MAPS: Browser/Playwright issue - {e}")
                print("[TIP] Check if Playwright browsers are installed: python -m playwright install chromium")
            elif "timeout" in error_msg or "network" in error_msg:
                print(f"[ERROR] GOOGLE MAPS: Network/Timeout issue - {e}")
                print(f"[TIP] Location '{location}' may be too slow or inaccessible. Try a more specific location.")
            elif "consent" in error_msg or "cookie" in error_msg:
                print(f"[ERROR] GOOGLE MAPS: Cookie consent issue - {e}")
                print("[TIP] Google may have changed their consent dialog. Check google_maps.py _handle_consent method.")
            else:
                print(f"[ERROR] GOOGLE MAPS: Unexpected error - {e}")
            
            import traceback
            traceback.print_exc()
            
            # Return empty list instead of crashing
            return []
    
    async def _enrich_company_lead(self, lead: CompanyLead, context: str) -> CompanyLead:
        """
        Enrich a company lead using a rigorous ReAct (Reason + Act) Agentic Workflow.
        Follows the Arizona Tile approach: Discovery → Extraction → Enrichment → Validation
        """
        print(f"[AGENT] Starting Agentic Research for: {lead.company_name} ({lead.website})")
        
        # --- PHASE 1: DISCOVERY (Sitemap & Content Gathering) ---
        # Scrape Main Site + "About", "Contact", "Locations", "Team", "Leadership"
        website_content = ""
        scraped_data = {}
        
        if lead.website:
            try:
                print(f"  DISCOVERY: Crawling {lead.website} and key subpages...")
                scraped_data = await self.scraper.extract_contact_info(lead.website)
                website_content = scraped_data.get("website_content", "")
                
                # --- SELF-CORRECTION: CHECK FOR BAD URL ---
                is_weak_content = len(website_content) < 500 or "domain" in website_content.lower()[:100]
                if is_weak_content:
                    print(f"  [WARN] WEAK CONTENT ({len(website_content)} chars). Attempting URL recovery...")
                    
                    recovery_query = f"{lead.company_name} official website"
                    loop = asyncio.get_running_loop()
                    recovery_results = await loop.run_in_executor(None, lambda: self.scraper.search(recovery_query, max_results=1))
                    
                    if recovery_results:
                        new_url = recovery_results[0].get('href')
                        if new_url and new_url != lead.website and "linkedin" not in new_url and "facebook" not in new_url:
                            print(f"  [RECOVERY] Found new URL: {new_url}")
                            lead.website = new_url
                            scraped_data = await self.scraper.extract_contact_info(lead.website)
                            website_content = scraped_data.get("website_content", "")
                            print(f"  [RE-CRAWL] Got {len(website_content)} chars from new URL.")
            
                # Also extract social media links directly from website
                social_links = await self.scraper.extract_social_media_links(lead.website)
                
                found_phones = len(scraped_data.get("phone_numbers", []))
                found_emails = len(scraped_data.get("email_addresses", []))
                print(f"  [DISCOVERY] Found {found_phones} phones, {found_emails} emails on site.")
                
            except Exception as e:
                print(f"  [DISCOVERY FAILED] {e}")
                # Try to recover
                try:
                    print(f"  [WARN] URL FAILED. Attempting recovery for {lead.company_name}...")
                    recovery_query = f"{lead.company_name} official website home"
                    loop = asyncio.get_running_loop()
                    recovery_results = await loop.run_in_executor(None, lambda: self.scraper.search(recovery_query, max_results=1))
                    
                    if recovery_results:
                        new_url = recovery_results[0].get('href')
                        if new_url and "linkedin" not in new_url:
                            print(f"  [RECOVERY] Found new URL: {new_url}")
                            lead.website = new_url
                            scraped_data = await self.scraper.extract_contact_info(lead.website)
                            website_content = scraped_data.get("website_content", "")
                            social_links = await self.scraper.extract_social_media_links(lead.website)
                            print(f"  [RE-CRAWL] Got {len(website_content)} chars.")
                except Exception as ex:
                    print(f"  [ERROR] RECOVERY FAILED: {ex}")
                    social_links = {}

        # --- PHASE 2: ENRICHMENT (External Verification) ---
        # Multi-source verification to reduce hallucination
        
        search_context = ""
        verification_queries = [
            f"{lead.company_name} official headquarters address location",
            f"{lead.company_name} CEO founder president executive team",
            f"{lead.company_name} leadership management board directors",
            f"{lead.company_name} official social media linkedin facebook instagram twitter",
            f"{lead.company_name} branch locations offices stores",
            f"{lead.company_name} contact phone email customer service",
            f"{lead.company_name} LinkedIn company profile site:linkedin.com",
        ]
        
        print(f"  ENRICHMENT: Executing {len(verification_queries)} targeted verification queries...")
        
        # Run searches in parallel
        loop = asyncio.get_running_loop()
        search_tasks = [
            loop.run_in_executor(None, lambda q=q: self.scraper.search(q, max_results=4)) 
            for q in verification_queries
        ]
        
        search_results_list = await asyncio.gather(*search_tasks)
        
        # Compile search context
        for i, results in enumerate(search_results_list):
            query = verification_queries[i]
            search_context += f"\n--- Search Query: {query} ---\n"
            search_context += "\n".join([f"- Title: {r.get('title')}\n  Snippet: {r.get('body')}\n  Link: {r.get('href')}" for r in results])
        
        # --- PHASE 3: EXTRACTION & VALIDATION (The Logic Framework) ---
        # Use the Agentic System Prompt with Zero Hallucination Policy
        
        system_prompt = """
**Role:** You are a Senior Business Intelligence Agent specializing in high-fidelity lead generation and corporate data extraction.

**Objective:** Extract and verify the following fields for the target company: Company Name, URL, Phone, Emails, Social Media (all platforms), Full Address, Branch Details, and **ESPECIALLY Key Decision Makers/Executives**.

**CRITICAL: FINDING KEY CONTACTS IS THE #1 PRIORITY**
- You MUST extract names and titles of key executives (CEO, Founder, President, VP, Director, CFO, CTO, CMO, COO, etc.)
- Check BOTH the Website Content AND the Search Results for executive names
- Search Results often contain LinkedIn directory links - extract ALL executive names from those snippets
- Even if you only find a name and title (no email/phone), you MUST INCLUDE THEM in key_decision_makers
- Look for: Leadership team, Management team, Board members, Founders, C-suite executives, Owners
- **PRIORITY RULE:** If you find ANY executive names mentioned ANYWHERE in the data, add them to the output
- Better to have 10 executives with minimal info than 0 executives

**Operational Constraints (ZERO HALLUCINATION POLICY):**
1. **Strict Verification:** If a data point is not explicitly visible in the text provided, return "Not Publicly Disclosed". Do NOT generate placeholder emails (e.g., info@company.com, contact@company.com) unless they actually appear in the text.
2. **Recursive Logic:** Use the Search Results to fill gaps left by the Website Content.
3. **Executive Names:** Extract ALL executive names you see, even with incomplete contact info. Name+Title is sufficient.
4. **LinkedIn Profiles:** If you see LinkedIn profile links for executives in search results, extract them.
5. **WhatsApp Detection:** Mark international numbers (+country code) as potentially WhatsApp-enabled.
6. **Deduplication:** Ensure phone numbers and locations are distinct.
7. **Date Validity:** Prioritize recent data. If you see "Former CEO" or very old copyright years, flag it.
8. **Role Categories:** Classify executives as "Decision Maker", "Technical Lead", "Purchasing Authority", or "Other"

**Verification Loop - Ask yourself before finalizing:**
* Did I extract ALL executive names from the LinkedIn company search results?
* Did I check BOTH "CEO founder" AND "leadership management" search queries?
* Did I find all social media links? (LinkedIn, Twitter, Facebook, Instagram, YouTube, TikTok, Pinterest, WhatsApp)
* Are the branch phone numbers distinct from HQ?
* Did I avoid generating fake email addresses?

**Output Schema:**
Return a single valid JSON object with this exact structure:
{
    "company_details": {
        "official_name": "...",
        "headquarters_address": "...",
        "main_phone": "...",
        "general_emails": ["..."]
    },
    "social_media": {
        "linkedin": "...",
        "twitter": "...",
        "facebook": "...",
        "instagram": "...",
        "youtube": "...",
        "tiktok": "...",
        "pinterest": "...",
        "whatsapp": "..."
    },
    "key_decision_makers": [
        {
            "name": "...",
            "title": "...",
            "role_category": "Decision Maker|Technical Lead|Purchasing Authority|Other",
            "email": "Not Publicly Disclosed" (if not found),
            "phone": "Not Publicly Disclosed" (if not found),
            "linkedin": "Not Publicly Disclosed" (if not found),
            "twitter": "Not Publicly Disclosed" (if not found),
            "source": "Website|LinkedIn|Search"
        }
    ],
    "branches": [
        {
            "name": "...",
            "address": "...",
            "phone": "...",
            "email": "..."
        }
    ]
}

**REMEMBER: Finding executive names is THE TOP PRIORITY. Include ALL executives you find, even with minimal contact info. Empty key_decision_makers array is a FAILURE.**
"""

        user_prompt = f"""
**Target Company:** {lead.company_name}
**Official Website:** {lead.website}

**SOURCE DATA 1: WEBSITE CONTENT (Home/About/Contact/Locations/Team)**
(Contains raw text scraped from the official site)
----------------------------------------------------------------
{website_content[:20000]} 
----------------------------------------------------------------

**SOURCE DATA 2: EXTERNAL VERIFICATION (Search Results)**
(Use this to cross-reference and fill gaps - ESPECIALLY for finding executives)
----------------------------------------------------------------
{search_context}
----------------------------------------------------------------

**INSTRUCTIONS:**
1. Analyze BOTH sources above to complete the JSON profile for {lead.company_name}
2. **TOP PRIORITY**: Extract ALL executive names and titles from search results (especially LinkedIn results)
3. The search results likely contain executive directory links - extract names from those snippets
4. For missing contact details, use "Not Publicly Disclosed"
5. **NO GUESSWORK** - Only include what you actually see
6. Check for WhatsApp business links or international phone formats
7. Map executives to appropriate role categories (Decision Maker for C-suite, etc.)

**Return the complete JSON now:**
"""

        try:
            print("  [LLM] AGENT: Analyzing data with ReAct Logic...")
            response = await self.client.chat.completions.create(
                model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
            )
            
            final_data = json.loads(response.choices[0].message.content)
            
            # --- PHASE 4: MAPPING & COMPLETION ---
            
            # 1. Company Details
            details = final_data.get("company_details", {})
            lead.main_address = details.get("headquarters_address")
            lead.headquarters = details.get("headquarters_address")
            
            # Map emails (filter out "Not Publicly Disclosed")
            if details.get("general_emails"):
                lead.email_addresses = [
                    e for e in details.get("general_emails") 
                    if "@" in e and "not publicly disclosed" not in e.lower()
                ]
            
            # Map phones with WhatsApp detection
            main_phone = details.get("main_phone")
            if main_phone and "not publicly disclosed" not in main_phone.lower():
                # Check if it's an international number (starts with +)
                has_whatsapp = main_phone.strip().startswith('+')
                lead.phone_numbers.append({"number": main_phone, "has_whatsapp": has_whatsapp})

            # 2. Social Media (prioritize direct scraper results, fallback to LLM)
            socials = final_data.get("social_media", {})
            
            # Use scraped social links if available, otherwise use LLM results
            lead.linkedin_url = social_links.get('linkedin_url') or socials.get("linkedin")
            lead.twitter_url = social_links.get('twitter_url') or socials.get("twitter")
            lead.facebook_url = social_links.get('facebook_url') or socials.get("facebook")
            lead.instagram_url = social_links.get('instagram_url') or socials.get("instagram")
            lead.youtube_url = social_links.get('youtube_url') or socials.get("youtube")
            lead.tiktok_url = social_links.get('tiktok_url') or socials.get("tiktok")
            lead.pinterest_url = social_links.get('pinterest_url') or socials.get("pinterest")
            lead.whatsapp_url = social_links.get('whatsapp_url') or socials.get("whatsapp")
            
            # Filter out "Not Publicly Disclosed" from URLs
            for field in ['linkedin_url', 'twitter_url', 'facebook_url', 'instagram_url', 
                         'youtube_url', 'tiktok_url', 'pinterest_url', 'whatsapp_url']:
                value = getattr(lead, field)
                if value and ("not publicly disclosed" in value.lower() or not value.startswith('http')):
                    setattr(lead, field, None)
            
            # 3. Key Contacts - THE MOST IMPORTANT SECTION
            lead.key_contacts = []
            for contact in final_data.get("key_decision_makers", []):
                email = contact.get("email")
                phone = contact.get("phone")
                linkedin = contact.get("linkedin")
                twitter = contact.get("twitter")
                
                # Filter out "Not Publicly Disclosed" values
                if email and "not publicly disclosed" in email.lower():
                    email = None
                if phone and "not publicly disclosed" in phone.lower():
                    phone = None
                if linkedin and "not publicly disclosed" in linkedin.lower():
                    linkedin = None
                if twitter and "not publicly disclosed" in twitter.lower():
                    twitter = None
                
                lead.key_contacts.append(PersonContact(
                    full_name=contact.get("name", "Unknown"),
                    designation=contact.get("title", "Unknown"),
                    role_category=contact.get("role_category", "Other"),
                    email=email,
                    phone=phone,
                    linkedin_url=linkedin,
                    twitter_url=twitter,
                    data_source=contact.get("source", "Agentic Research")
                ))

            # 4. Branches
            lead.branches = []
            for branch in final_data.get("branches", []):
                lead.branches.append({
                    "name": branch.get("name"),
                    "address": branch.get("address"),
                    "phone": branch.get("phone"),
                    "email": branch.get("email")
                })
                
            lead.enrichment_status = "enriched"
            lead.confidence_score = 0.95 if len(lead.key_contacts) > 0 else 0.7
            lead.data_sources.extend([
                "sitemap_crawl", 
                "multi_source_search", 
                "linkedin_verification",
                "agentic_verification"
            ])
            
            print(f"  [SUCCESS] COMPLETED: Enriched {lead.company_name}")
            print(f"    - {len(lead.branches)} branches")
            print(f"    - {len(lead.key_contacts)} executives/contacts")
            print(f"    - {len(lead.email_addresses)} emails")
            print(f"    - {len(lead.phone_numbers)} phones")
            
            # Log executive names for verification
            if lead.key_contacts:
                exec_names = [f"{c.full_name} ({c.designation})" for c in lead.key_contacts[:5]]
                print(f"    - Executives: {', '.join(exec_names)}")

        except Exception as e:
            print(f"  [ERROR] AGENT ERROR: {e}")
            lead.enrichment_status = "failed"
            lead.confidence_score = 0.2
            
        return lead




