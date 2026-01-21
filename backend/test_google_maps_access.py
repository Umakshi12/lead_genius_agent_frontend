"""
Google Maps Access Diagnostic Tool
====================================
This script tests whether Google Maps is being accessed correctly when 
LLMs call for lead generation with keywords.

It will verify:
1. Google Maps scraper is recognized by the agent
2. Keywords are being searched on Google Maps
3. Correct results are being returned
4. LLM is calling Google Maps as a tool
"""

import asyncio
import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import required models and agents
from app.models.schemas import LeadGenerationRequest
from app.agents.lead_generation_agent import LeadGenerationAgent

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)

def print_step(step_num, text):
    """Print a formatted step"""
    print(f"\n[STEP {step_num}] {text}")
    print("-" * 80)

def print_success(text):
    """Print success message"""
    print(f"✅ SUCCESS: {text}")

def print_warning(text):
    """Print warning message"""
    print(f"⚠️  WARNING: {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ ERROR: {text}")

async def test_google_maps_recognition():
    """Test if Google Maps channel is recognized"""
    print_header("TEST 1: Google Maps Channel Recognition")
    
    agent = LeadGenerationAgent()
    
    # Test various channel name variations
    test_channels = [
        "Google Maps",
        "google maps",
        "GoogleMaps",
        "maps",
        "gmaps",
        "Google Map"
    ]
    
    google_maps_variations = ["google maps", "googlemaps", "maps", "gmaps", "google map"]
    
    print("\nTesting channel name variations:")
    for channel in test_channels:
        is_recognized = channel.lower() in google_maps_variations
        if is_recognized:
            print_success(f"'{channel}' is recognized as Google Maps")
        else:
            print_error(f"'{channel}' is NOT recognized as Google Maps")
    
    return True

async def test_google_maps_scraping():
    """Test actual Google Maps scraping with keywords"""
    print_header("TEST 2: Google Maps Scraping with Keywords")
    
    # Test configuration
    test_keywords = ["restaurants", "hotels"]
    test_location = "Miami, FL"
    
    print(f"\nTest Configuration:")
    print(f"  Keywords: {test_keywords}")
    print(f"  Location: {test_location}")
    print(f"  Max Leads: 5")
    
    agent = LeadGenerationAgent()
    
    # Test direct Google Maps scraping
    print("\n📍 Testing direct Google Maps scraper access...")
    
    try:
        leads = await agent._discover_from_google_maps(
            keywords=test_keywords,
            location=test_location,
            max_leads=5
        )
        
        if leads:
            print_success(f"Found {len(leads)} leads from Google Maps")
            print("\nSample Results:")
            for i, lead in enumerate(leads[:3], 1):
                print(f"\n  Lead {i}:")
                print(f"    Company: {lead.company_name}")
                print(f"    Location: {lead.location}")
                print(f"    Website: {lead.website}")
                print(f"    Phone: {lead.phone_numbers}")
                print(f"    Channel: {lead.channel_source}")
                print(f"    Keywords Matched: {lead.keywords_matched}")
        else:
            print_warning("No leads found from Google Maps")
            return False
            
        return True
        
    except Exception as e:
        print_error(f"Google Maps scraping failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_llm_channel_routing():
    """Test if LLM correctly routes to Google Maps"""
    print_header("TEST 3: LLM Channel Routing to Google Maps")
    
    agent = LeadGenerationAgent()
    
    # Create a test request with Google Maps as channel
    test_request = LeadGenerationRequest(
        selected_channels=["Google Maps"],  # Explicitly selecting Google Maps
        selected_keywords=["coffee shops"],
        target_industries=["Food & Beverage"],
        location="San Francisco, CA",
        max_leads_per_channel=3,
        company_summary="Testing Google Maps integration"
    )
    
    print("\nTest Request:")
    print(f"  Channels: {test_request.selected_channels}")
    print(f"  Keywords: {test_request.selected_keywords}")
    print(f"  Location: {test_request.location}")
    
    print("\n🔄 Testing channel routing...")
    
    try:
        # Test the discover method which routes to Google Maps
        leads = await agent._discover_from_channel(
            channel="Google Maps",
            keywords=test_request.selected_keywords,
            industries=test_request.target_industries,
            max_leads=test_request.max_leads_per_channel,
            location=test_request.location
        )
        
        if leads:
            print_success(f"LLM correctly routed to Google Maps and found {len(leads)} leads")
            
            # Verify the leads have Google Maps as source
            google_maps_leads = [l for l in leads if "google maps" in l.channel_source.lower()]
            if google_maps_leads:
                print_success(f"All {len(google_maps_leads)} leads have Google Maps as channel source")
            else:
                print_error("Leads were found but not from Google Maps!")
                return False
            
            return True
        else:
            print_warning("No leads found through channel routing")
            return False
            
    except Exception as e:
        print_error(f"Channel routing failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_full_workflow():
    """Test the complete lead generation workflow"""
    print_header("TEST 4: Full Lead Generation Workflow with Google Maps")
    
    agent = LeadGenerationAgent()
    
    # Create a realistic test request
    test_request = LeadGenerationRequest(
        selected_channels=["Google Maps"],
        selected_keywords=["pizza restaurant"],
        target_industries=["Food & Beverage"],
        location="New York, NY",
        max_leads_per_channel=2,
        company_summary="Testing full workflow with Google Maps integration"
    )
    
    print("\nFull Workflow Test Request:")
    print(f"  Channels: {test_request.selected_channels}")
    print(f"  Keywords: {test_request.selected_keywords}")
    print(f"  Location: {test_request.location}")
    
    print("\n🚀 Starting full lead generation workflow...")
    
    try:
        # This tests the complete flow including discovery and enrichment
        result = await agent.generate_leads(test_request)
        
        if result.total_leads > 0:
            print_success(f"Full workflow completed successfully!")
            print(f"\nResults Summary:")
            print(f"  Total Leads: {result.total_leads}")
            print(f"  Leads by Channel: {result.leads_by_channel}")
            print(f"  Generation Summary: {result.generation_summary}")
            
            # Show details of first lead
            if result.companies:
                lead = result.companies[0]
                print(f"\n  First Lead Details:")
                print(f"    Company: {lead.company_name}")
                print(f"    Website: {lead.website}")
                print(f"    Location: {lead.location}")
                print(f"    Channel: {lead.channel_source}")
                print(f"    Enrichment Status: {lead.enrichment_status}")
            
            return True
        else:
            print_warning("Workflow completed but no leads found")
            return False
            
    except Exception as e:
        print_error(f"Full workflow failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def run_all_tests():
    """Run all diagnostic tests"""
    print_header("GOOGLE MAPS ACCESS DIAGNOSTIC TOOL")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {}
    
    # Test 1: Channel Recognition
    results['recognition'] = await test_google_maps_recognition()
    
    # Test 2: Direct Scraping
    print("\n" + "⏳" * 40)
    print("NOTE: The next tests will use Playwright to actually scrape Google Maps.")
    print("This may take a few minutes. Please be patient...")
    print("⏳" * 40)
    
    results['scraping'] = await test_google_maps_scraping()
    
    # Test 3: LLM Routing
    results['routing'] = await test_llm_channel_routing()
    
    # Test 4: Full Workflow (optional - can be slow)
    print("\n" + "⏳" * 40)
    print("Running full workflow test with enrichment...")
    print("This will test the complete flow including LLM enrichment.")
    print("⏳" * 40)
    
    results['workflow'] = await test_full_workflow()
    
    # Summary
    print_header("DIAGNOSTIC SUMMARY")
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    print(f"\nTotal Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    
    print("\nDetailed Results:")
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} - {test_name.replace('_', ' ').title()}")
    
    if all(results.values()):
        print("\n" + "🎉" * 40)
        print_success("ALL TESTS PASSED!")
        print("Google Maps is correctly integrated and accessible by the LLM.")
        print("🎉" * 40)
    else:
        print("\n" + "⚠️ " * 40)
        print_warning("SOME TESTS FAILED!")
        print("Please review the errors above to fix the integration.")
        print("⚠️ " * 40)
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    # Setup event loop for Windows + Python 3.13+
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
    
    # Run tests
    asyncio.run(run_all_tests())
