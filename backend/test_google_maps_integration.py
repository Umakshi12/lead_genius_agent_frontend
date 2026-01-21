"""
Google Maps Integration Test Script
====================================
This script tests the enhanced Google Maps integration with the lead generation system.

Features tested:
1. Channel name variations (Maps, GMaps, Google Maps, etc.)
2. WhatsApp detection for international phone numbers
3. Error handling and recovery
4. Data structure validation

Usage:
    python test_google_maps_integration.py
"""

import asyncio
import json
import sys
import os

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.agents.lead_generation_agent import LeadGenerationAgent
from app.models.schemas import LeadGenerationRequest, CompanyLead

async def test_channel_variations():
    """Test that all Google Maps channel name variations work"""
    print("\n" + "="*60)
    print("TEST 1: Channel Name Variations")
    print("="*60)
    
    agent = LeadGenerationAgent()
    channel_names = ["Google Maps", "GoogleMaps", "Maps", "GMaps", "google map"]
    
    for channel_name in channel_names:
        print(f"\n>> Testing channel name: '{channel_name}'")
        request = LeadGenerationRequest(
            selected_channels=[channel_name],
            selected_keywords=["coffee shop"],
            target_industries=["Food & Beverage"],
            company_summary="Test company",
            location="Miami, FL",
            max_leads_per_channel=2  # Small number for quick test
        )
        
        lead_count = 0
        async for line in agent.generate_leads_stream(request):
            try:
                msg = json.loads(line)
                if msg["type"] == "lead":
                    lead_count += 1
                    lead_data = msg["data"]
                    print(f"   ✓ Found lead: {lead_data['company_name']}")
            except:
                pass
        
        if lead_count > 0:
            print(f"   [OK] SUCCESS: '{channel_name}' returned {lead_count} leads")
        else:
            print(f"   [WARN] WARNING: '{channel_name}' returned 0 leads (may be network issue)")

async def test_whatsapp_detection():
    """Test WhatsApp detection for international phone numbers"""
    print("\n" + "="*60)
    print("TEST 2: WhatsApp Detection")
    print("="*60)
    
    agent = LeadGenerationAgent()
    request = LeadGenerationRequest(
        selected_channels=["Google Maps"],
        selected_keywords=["restaurant"],
        target_industries=["Food"],
        company_summary="Test",
        location="Barcelona, Spain",  # International location more likely to have + numbers
        max_leads_per_channel=5
    )
    
    whatsapp_count = 0
    total_leads = 0
    
    async for line in agent.generate_leads_stream(request):
        try:
            msg = json.loads(line)
            if msg["type"] == "lead":
                total_leads += 1
                lead_data = msg["data"]
                
                # Check phone numbers for WhatsApp
                for phone in lead_data.get("phone_numbers", []):
                    if phone.get("has_whatsapp"):
                        whatsapp_count += 1
                        print(f"   ✓ WhatsApp detected: {phone['number']} ({lead_data['company_name']})")
        except:
            pass
    
    print(f"\n   Results: {whatsapp_count} WhatsApp numbers out of {total_leads} leads")
    if whatsapp_count > 0:
        print(f"   [OK] WhatsApp detection is working!")
    else:
        print(f"   [INFO] No WhatsApp numbers found (depends on location)")

async def test_data_structure():
    """Test that scraped data matches CompanyLead schema"""
    print("\n" + "="*60)
    print("TEST 3: Data Structure Validation")
    print("="*60)
    
    agent = LeadGenerationAgent()
    request = LeadGenerationRequest(
        selected_channels=["Google Maps"],
        selected_keywords=["hardware store"],
        target_industries=["Retail"],
        company_summary="Test",
        location="Austin, TX",
        max_leads_per_channel=3
    )
    
    valid_count = 0
    invalid_count = 0
    
    async for line in agent.generate_leads_stream(request):
        try:
            msg = json.loads(line)
            if msg["type"] == "lead":
                # Try to instantiate CompanyLead to validate schema
                lead = CompanyLead(**msg["data"])
                
                # Validate required fields
                assert lead.company_name, "company_name is required"
                assert lead.channel_source == "Google Maps", "channel_source should be 'Google Maps'"
                assert lead.confidence_score >= 0.0 and lead.confidence_score <= 1.0, "confidence_score out of range"
                
                print(f"   ✓ Valid: {lead.company_name}")
                print(f"      - Industry: {lead.industry}")
                print(f"      - Location: {lead.location}")
                print(f"      - Phone: {len(lead.phone_numbers)} number(s)")
                print(f"      - Website: {lead.website or 'N/A'}")
                
                valid_count += 1
        except AssertionError as ae:
            print(f"   ✗ Schema validation failed: {ae}")
            invalid_count += 1
        except Exception as e:
            print(f"   ✗ Error: {e}")
            invalid_count += 1
    
    print(f"\n   Results: {valid_count} valid, {invalid_count} invalid")
    if valid_count > 0 and invalid_count == 0:
        print(f"   [OK] All leads passed schema validation!")
    elif valid_count > 0:
        print(f"   [WARN] Some leads failed validation")
    else:
        print(f"   [ERROR] No valid leads found")

async def test_error_handling():
    """Test error handling with invalid inputs"""
    print("\n" + "="*60)
    print("TEST 4: Error Handling")
    print("="*60)
    
    agent = LeadGenerationAgent()
    
    # Test with invalid location (should not crash)
    print("\n>> Testing with potentially invalid location...")
    request = LeadGenerationRequest(
        selected_channels=["Google Maps"],
        selected_keywords=["test"],
        target_industries=["Test"],
        company_summary="Test",
        location="XYZ Invalid Location 12345",
        max_leads_per_channel=1
    )
    
    try:
        error_occurred = False
        async for line in agent.generate_leads_stream(request):
            msg = json.loads(line)
            if msg["type"] == "error":
                error_occurred = True
                print(f"   ✓ Error caught gracefully: {msg.get('message', 'Unknown error')}")
        
        if not error_occurred:
            print(f"   ✓ No crash with invalid location (returned empty results)")
        
        print(f"   [OK] Error handling working correctly!")
    except Exception as e:
        print(f"   [ERROR] Unhandled exception: {e}")

async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("GOOGLE MAPS INTEGRATION TEST SUITE")
    print("="*60)
    print("\nThis will test the enhanced Google Maps integration.")
    print("Note: Tests require internet connection and may take 1-2 minutes.\n")
    
    try:
        # Run tests sequentially
        await test_channel_variations()
        await test_whatsapp_detection()
        await test_data_structure()
        await test_error_handling()
        
        print("\n" + "="*60)
        print("ALL TESTS COMPLETED")
        print("="*60)
        print("\nIf you see errors, check:")
        print("1. Internet connection is stable")
        print("2. Playwright is installed: python -m playwright install chromium")
        print("3. Backend server is not blocking the tests")
        
    except KeyboardInterrupt:
        print("\n\n[WARN] Tests interrupted by user")
    except Exception as e:
        print(f"\n\n[ERROR] Test suite failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Set up event loop policy for Windows
    if sys.platform == 'win32':
        if sys.version_info >= (3, 13):
            import nest_asyncio
            nest_asyncio.apply()
        else:
            try:
                asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
            except AttributeError:
                pass
    
    asyncio.run(main())
