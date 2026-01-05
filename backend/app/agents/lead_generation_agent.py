import os
import json
import asyncio
from datetime import datetime
from typing import List, Dict
from openai import AsyncOpenAI
from app.models.schemas import (
    LeadGenerationRequest, 
    LeadGenerationResult, 
    CompanyLead, 
    PersonContact
)
from app.services.web_scraper import WebScraper

class LeadGenerationAgent:
    """
    Agent responsible for discovering and enriching company leads from selected channels.
    Uses actual website scraping combined with LLM analysis for data enrichment.
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.scraper = WebScraper()
    
    async def generate_leads(self, request: LeadGenerationRequest) -> LeadGenerationResult:
        """
        Main orchestration method for lead generation workflow
        """
        started_at = datetime.utcnow().isoformat()
        all_companies = []
        leads_by_channel = {}
        
        # Process each channel
        for channel in request.selected_channels:
            print(f"Processing channel: {channel}")
            channel_leads = await self._discover_from_channel(
                channel=channel,
                keywords=request.selected_keywords,
                industries=request.target_industries,
                max_leads=request.max_leads_per_channel
            )
            
            # Enrich each lead
            enriched_leads = []
            for lead in channel_leads:
                enriched = await self._enrich_company_lead(lead, request.company_summary)
                enriched_leads.append(enriched)
            
            all_companies.extend(enriched_leads)
            leads_by_channel[channel] = len(enriched_leads)
        
        completed_at = datetime.utcnow().isoformat()
        
        return LeadGenerationResult(
            total_leads=len(all_companies),
            leads_by_channel=leads_by_channel,
            companies=all_companies,
            generation_summary=f"Generated {len(all_companies)} leads across {len(request.selected_channels)} channels",
            started_at=started_at,
            completed_at=completed_at
        )
    
    async def _discover_from_channel(
        self, 
        channel: str, 
        keywords: List[str], 
        industries: List[str],
        max_leads: int
    ) -> List[CompanyLead]:
        """
        Discover companies from a specific channel using LLM-based research.
        In production, this would call Apify actors or channel-specific APIs.
        """
        
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
                model="gpt-4o",
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
    
    async def _enrich_company_lead(self, lead: CompanyLead, context: str) -> CompanyLead:
        """
        Enrich a company lead with contact information and key personnel.
        Uses actual website scraping for company data, combined with LLM for key contacts.
        """
        
        # STEP 1: Scrape actual company data from website
        if lead.website:
            print(f"🔍 Scraping {lead.website} for company information...")
            
            # Get social media links from website
            try:
                social_links = await self.scraper.extract_social_media_links(lead.website)
                lead.linkedin_url = social_links.get("linkedin_url") or lead.linkedin_url
                lead.twitter_url = social_links.get("twitter_url")
                lead.facebook_url = social_links.get("facebook_url")
                lead.instagram_url = social_links.get("instagram_url")
                lead.youtube_url = social_links.get("youtube_url")
                lead.whatsapp_url = social_links.get("whatsapp_url")
                lead.tiktok_url = social_links.get("tiktok_url")
            except Exception as e:
                print(f"  Social media extraction error: {e}")
            
            # Get contact info (address, phones, emails, branches) from website
            try:
                contact_info = await self.scraper.extract_contact_info(lead.website)
                lead.main_address = contact_info.get("main_address")
                lead.email_addresses = contact_info.get("email_addresses", [])
                lead.phone_numbers = [{"number": p, "has_whatsapp": False} for p in contact_info.get("phone_numbers", [])]
                lead.branches = contact_info.get("branches", [])
                
                # Set headquarters from location if not found
                if not lead.headquarters and lead.location:
                    lead.headquarters = lead.location
            except Exception as e:
                print(f"  Contact info extraction error: {e}")
        
        # STEP 2: Use LLM only for key contacts (personnel data not available via scraping)
        system_prompt = f"""You are a B2B Contact Research Agent.
        Given a company, identify key decision-makers and provide their contact information.
        
        Find 2-4 key contacts:
        - Decision makers (C-level, VPs, Directors)
        - Purchasing authorities
        - Department heads relevant to: {context[:200]}
        
        For each person provide ALL available contact info:
        - Full name
        - Designation/Title
        - Role category (Decision Maker, Purchasing Authority, Technical Lead, etc.)
        - Professional email
        - Phone number
        - LinkedIn URL
        - Twitter URL
        - Facebook URL
        - Instagram URL
        - WhatsApp number
        
        Return JSON format:
        {{
            "key_contacts": [
                {{
                    "full_name": "John Doe",
                    "designation": "CEO",
                    "role_category": "Decision Maker",
                    "email": "john.doe@company.com",
                    "phone": "+1-xxx-xxx-xxxx",
                    "linkedin_url": "https://linkedin.com/in/johndoe",
                    "twitter_url": "https://twitter.com/johndoe",
                    "facebook_url": null,
                    "instagram_url": null,
                    "whatsapp_number": "+1-xxx-xxx-xxxx"
                }}
            ]
        }}
        
        Be factual. Only include verifiable contact information found in public sources.
        """
        
        user_prompt = f"""
        Company: {lead.company_name}
        Website: {lead.website}
        Industry: {lead.industry}
        Location: {lead.location}
        
        Find key decision-makers and their contact information.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            enrichment_data = json.loads(response.choices[0].message.content)
            
            # Add key contacts (only thing from LLM now - company data comes from scraper)
            contacts_data = enrichment_data.get("key_contacts", [])
            for contact_info in contacts_data:
                contact = PersonContact(
                    full_name=contact_info.get("full_name", "Unknown"),
                    designation=contact_info.get("designation", "Unknown"),
                    role_category=contact_info.get("role_category", "Contact"),
                    email=contact_info.get("email"),
                    phone=contact_info.get("phone"),
                    linkedin_url=contact_info.get("linkedin_url"),
                    twitter_url=contact_info.get("twitter_url"),
                    facebook_url=contact_info.get("facebook_url"),
                    instagram_url=contact_info.get("instagram_url"),
                    whatsapp_number=contact_info.get("whatsapp_number"),
                    data_source="llm_research"
                )
                lead.key_contacts.append(contact)
            
            lead.enrichment_status = "enriched"
            lead.confidence_score = 0.8 if lead.website else 0.6
            lead.data_sources.append("website_scrape")
            lead.data_sources.append("llm_contacts")
            
            print(f"✓ Enriched {lead.company_name}: {len(lead.branches)} branches, {len(lead.key_contacts)} contacts")
            
        except Exception as e:
            print(f"Error enriching {lead.company_name}: {e}")
            lead.enrichment_status = "failed"
            lead.confidence_score = 0.3
        
        return lead
