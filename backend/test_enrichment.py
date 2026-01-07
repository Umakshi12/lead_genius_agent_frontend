"""
Test script for enhanced lead generation agent.
Tests the Arizona Tile-style comprehensive data extraction workflow.
"""

import asyncio
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the agent
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.lead_generation_agent import LeadGenerationAgent
from app.models.schemas import CompanyLead

async def test_arizona_tile():
    """Test with Arizona Tile as reference"""
    print("=" * 80)
    print("TESTING: Arizona Tile Lead Enrichment")
    print("=" * 80)
    
    # Create test lead
    test_lead = CompanyLead(
        company_name="Arizona Tile",
        website="https://www.arizonatile.com",
        industry="Building Materials",
        channel_source="test",
        keywords_matched=["tile", "stone", "granite"],
        discovered_at="2026-01-07T00:00:00Z"
    )
    
    # Initialize agent
    agent = LeadGenerationAgent()
    
    # Enrich the lead
    enriched_lead = await agent._enrich_company_lead(test_lead, "Test context")
    
    # Display results
    print("\n" + "=" * 80)
    print("ENRICHMENT RESULTS")
    print("=" * 80)
    
    print(f"\n[*] Company: {enriched_lead.company_name}")
    print(f"[*] Website: {enriched_lead.website}")
    print(f"[*] Status: {enriched_lead.enrichment_status}")
    print(f"[*] Confidence: {enriched_lead.confidence_score}")
    
    print(f"\n[EMAIL] Contact Information:")
    print(f"  Address: {enriched_lead.main_address}")
    print(f"  Emails: {len(enriched_lead.email_addresses)}")
    for email in enriched_lead.email_addresses[:3]:
        print(f"    - {email}")
    
    print(f"  Phone Numbers: {len(enriched_lead.phone_numbers)}")
    for phone in enriched_lead.phone_numbers[:3]:
        whatsapp_icon = "[WhatsApp]" if phone.get('has_whatsapp') else "[Phone]"
        print(f"    {whatsapp_icon} {phone.get('number')}")
    
    print(f"\n[SOCIAL] Social Media:")
    socials = {
        "LinkedIn": enriched_lead.linkedin_url,
        "Twitter": enriched_lead.twitter_url,
        "Facebook": enriched_lead.facebook_url,
        "Instagram": enriched_lead.instagram_url,
        "YouTube": enriched_lead.youtube_url,
        "TikTok": enriched_lead.tiktok_url,
        "Pinterest": enriched_lead.pinterest_url,
        "WhatsApp": enriched_lead.whatsapp_url,
    }
    for platform, url in socials.items():
        if url:
            print(f"  [OK] {platform}: {url}")
        else:
            print(f"  [--] {platform}: Not found")
    
    print(f"\n[CONTACTS] Key Contacts: {len(enriched_lead.key_contacts)}")
    for contact in enriched_lead.key_contacts[:10]:
        print(f"  - {contact.full_name} - {contact.designation}")
        print(f"    Category: {contact.role_category}")
        if contact.email:
            print(f"    Email: {contact.email}")
        if contact.linkedin_url:
            print(f"    LinkedIn: {contact.linkedin_url}")
    
    print(f"\n[BRANCHES] Branches: {len(enriched_lead.branches)}")
    for branch in enriched_lead.branches[:5]:
        print(f"  - {branch.get('name', 'Unknown')}")
        print(f"    {branch.get('address', 'No address')}")
        if branch.get('phone'):
            print(f"    Phone: {branch.get('phone')}")
    
    # Export to JSON for detailed review
    try:
        output_data = enriched_lead.model_dump()
    except AttributeError:
        output_data = enriched_lead.dict()
    
    with open('test_output_arizona_tile.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n[FILE] Full results saved to: test_output_arizona_tile.json")
    
    # Validation checks
    print("\n" + "=" * 80)
    print("VALIDATION CHECKS")
    print("=" * 80)
    
    checks = {
        "[OK] Website enriched": enriched_lead.website is not None,
        "[OK] Has email addresses": len(enriched_lead.email_addresses) > 0,
        "[OK] Has phone numbers": len(enriched_lead.phone_numbers) > 0,
        "[OK] Has LinkedIn": enriched_lead.linkedin_url is not None,
        "[OK] Has key contacts": len(enriched_lead.key_contacts) > 0,
        "[OK] Has branches": len(enriched_lead.branches) > 0,
        "[OK] Has social media (3+)": sum(1 for v in socials.values() if v) >= 3,
        f"[OK] Found executives (5+)": len(enriched_lead.key_contacts) >= 5,
        f"[OK] WhatsApp detection": any(p.get('has_whatsapp') for p in enriched_lead.phone_numbers),
        "[OK] High confidence": enriched_lead.confidence_score >= 0.8,
    }
    
    passed = sum(1 for v in checks.values() if v)
    total = len(checks)
    
    for check, result in checks.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} {check}")
    
    print(f"\n[SCORE] Score: {passed}/{total} checks passed ({(passed/total)*100:.1f}%)")
    
    if passed >= total * 0.8:
        print("\n[SUCCESS] Lead enrichment is working well!")
    else:
        print("\n[WARNING] Some checks failed. Review the output for improvements.")

    
    return enriched_lead

async def test_custom_company(company_name: str, website: str):
    """Test with any company"""
    print("=" * 80)
    print(f"TESTING: {company_name} Lead Enrichment")
    print("=" * 80)
    
    test_lead = CompanyLead(
        company_name=company_name,
        website=website,
        channel_source="test",
        keywords_matched=["test"],
        discovered_at="2026-01-07T00:00:00Z"
    )
    
    agent = LeadGenerationAgent()
    enriched_lead = await agent._enrich_company_lead(test_lead, "Test context")
    
    print(f"\n[OK] Enriched: {enriched_lead.company_name}")
    print(f"   Contacts: {len(enriched_lead.key_contacts)}")
    print(f"   Branches: {len(enriched_lead.branches)}")
    print(f"   Confidence: {enriched_lead.confidence_score}")

    
    return enriched_lead

if __name__ == "__main__":
    print("\n>>> Starting Lead Generation Agent Tests\n")
    
    # Test 1: Arizona Tile (reference example)
    asyncio.run(test_arizona_tile())
    
    # Uncomment to test with other companies
    # asyncio.run(test_custom_company("Caesarstone", "https://www.caesarstone.com"))
    # asyncio.run(test_custom_company("Cosentino", "https://www.cosentino.com"))

