
import asyncio
from app.services.web_scraper import WebScraper

async def test_scraper():
    scraper = WebScraper()
    print("Testing search...")
    results = scraper.search("Levantina", max_results=1)
    print(f"Search results: {len(results)}")
    
    if results:
        url = results[0]['href']
        print(f"Testing extraction for {url}...")
        info = await scraper.extract_contact_info(url)
        print("Extraction complete.")
        print(f"Content length: {len(info.get('website_content', ''))}")
        print("Content preview:")
        print(info.get('website_content', '')[:500])

if __name__ == "__main__":
    asyncio.run(test_scraper())
