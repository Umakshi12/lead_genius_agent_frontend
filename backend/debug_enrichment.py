
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from app.agents.lead_generation_agent import LeadGenerationAgent
from app.models.schemas import CompanyLead

async def debug():
    try:
        agent = LeadGenerationAgent()
        
        # Test usage of search
        print("Testing scraper search...")
        try:
             results = agent.scraper.search("Levantina key executives", max_results=2)
             print(f"Search results: {len(results)}")
             for r in results:
                 print(f" - {r.get('title')}")
        except Exception as e:
            print(f"Scraper search failed: {e}")

        lead = CompanyLead(
            company_name="Levantina",
            website="https://www.levantina.com",
            industry="Building Materials",
            location="Petrer, Spain",
            channel_source="debug",
            discovered_at="2024-01-01T00:00:00"
        )
        
        print("\n--- Starting Debug Enrichment ---")
        enriched_lead = await agent._enrich_company_lead(lead, "Natural stone and building materials")
        
        print("\n--- Final Result ---")
        print(f"Company: {enriched_lead.company_name}")
        print(f"Website: {enriched_lead.website}")
        print(f"Socials: LinkedIn={enriched_lead.linkedin_url}")
        print(f"Contacts: {len(enriched_lead.key_contacts)}")
        for c in enriched_lead.key_contacts:
            print(f"  - {c.full_name}, {c.designation}, {c.email}")
            
    except Exception as e:
        print(f"Debug failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug())
