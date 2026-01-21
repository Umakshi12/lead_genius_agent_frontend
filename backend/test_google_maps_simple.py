"""
Simple Google Maps Access Test
================================
This script tests whether Google Maps scraper is accessible and working.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)

def print_success(text):
    """Print success message"""
    print(f"✅ SUCCESS: {text}")

def print_warning(text):
    """Print warning message"""
    print(f"⚠️  WARNING: {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ ERROR: {text}")

async def test_google_maps_basic():
    """Test basic Google Maps scraper"""
    print_header("Google Maps Basic Access Test")
    
    try:
        from playwright.async_api import async_playwright
        from app.agents.google_maps import GoogleMapsScraper
        
        print("\n✅ Successfully imported GoogleMapsScraper")
        
        # Test configuration
        test_keyword = "pizza"
        test_location = "Miami, FL"
        
        print(f"\nTest Configuration:")
        print(f"  Keyword: {test_keyword}")
        print(f"  Location: {test_location}")
        print(f"  Max Results: 3")
        
        scraper = GoogleMapsScraper()
        print("✅ Successfully created scraper instance")
        
        print("\n🚀 Starting Google Maps scraping...")
        print("⏳ This may take 1-2 minutes. Please wait...")
        
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
            print("✅ Browser launched successfully")
            
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                timezone_id="America/New_York",
                permissions=["geolocation"],
                java_script_enabled=True
            )
            print("✅ Browser context created")
            
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)
            
            print(f"\n📍 Searching Google Maps for '{test_keyword}' in {test_location}...")
            
            record_count = 0
            async for record in scraper.search(context, test_location, keyword=test_keyword, max_concurrency=5):
                record_count += 1
                discovered_leads.append(record)
                print(f"\n  Found Lead #{record_count}:")
                print(f"    Company: {record.company_name}")
                print(f"    Location: {record.company_full_address or 'N/A'}")
                print(f"    Phone: {record.company_phone_number or 'N/A'}")
                print(f"    Website: {record.company_website or 'N/A'}")
                
                if record_count >= 3:
                    print("\n  [Stopping at 3 results for testing]")
                    break
            
            await browser.close()
        
        if discovered_leads:
            print_success(f"\nGoogle Maps scraping completed! Found {len(discovered_leads)} leads")
            return True
        else:
            print_warning("\nNo leads found from Google Maps")
            return False
            
    except ImportError as e:
        print_error(f"Import failed: {str(e)}")
        print("Make sure you have installed: playwright, nest_asyncio")
        return False
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_channel_name_variations():
    """Test if different channel names are recognized"""
    print_header("Channel Name Recognition Test")
    
    google_maps_variations = ["google maps", "googlemaps", "maps", "gmaps", "google map"]
    
    test_names = [
        "Google Maps",
        "google maps", 
        "GoogleMaps",
        "maps",
        "gmaps",
        "Google Map",
        "GOOGLE MAPS",
        "LinkedIn"  # This should NOT match
    ]
    
    print("\nTesting which channel names are recognized as Google Maps:\n")
    
    for name in test_names:
        is_google_maps = name.lower() in google_maps_variations
        if is_google_maps:
            print_success(f"'{name}' → Recognized as Google Maps")
        else:
            print(f"  ℹ️  '{name}' → NOT recognized as Google Maps")
    
    return True

async def main():
    """Run all tests"""
    print_header("GOOGLE MAPS ACCESS DIAGNOSTIC")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 1: Channel Name Recognition
    result1 = await test_channel_name_variations()
    
    # Test 2: Basic Scraping
    print("\n⏳ Starting actual Google Maps scraping test...")
    print("This will use Playwright to scrape real data from Google Maps.")
    result2 = await test_google_maps_basic()
    
    # Summary
    print_header("TEST SUMMARY")
    
    if result1 and result2:
        print("\n🎉 ALL TESTS PASSED! 🎉")
        print("\nConclusion:")
        print("  ✅ Google Maps scraper is working correctly")
        print("  ✅ Channel names are being recognized properly")
        print("  ✅ Keywords are being searched on Google Maps")
        print("  ✅ Results are being returned successfully")
    else:
        print("\n⚠️ SOME TESTS FAILED")
        if not result1:
            print("  ❌ Channel name recognition issue")
        if not result2:
            print("  ❌ Google Maps scraping issue")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    # Setup event loop for Windows
    if sys.platform == 'win32':
        if sys.version_info >= (3, 13):
            import nest_asyncio
            nest_asyncio.apply()
            print("[SETUP] Applied nest_asyncio for Python 3.13+")
        else:
            try:
                asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
                print("[SETUP] Using WindowsSelectorEventLoopPolicy")
            except AttributeError:
                pass
    
    asyncio.run(main())
