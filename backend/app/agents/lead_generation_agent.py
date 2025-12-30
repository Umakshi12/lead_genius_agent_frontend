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

class LeadGenerationAgent:
    """
    Agent responsible for discovering and enriching company leads from selected channels.
    Uses LLM-based research with simulated data collection (in production, would integrate
    with Apify, Apollo, Clay, etc.)
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
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
        In production, this would call Apollo, Clay, or other enrichment APIs.
        Uses LLM fallback for demonstration.
        """
        
        system_prompt = f"""You are a B2B Contact Enrichment Agent.
        Given a company, research and provide:
        
        1. Company contact information:
           - Email addresses (general company emails)
           - Phone numbers with WhatsApp availability indicator
           - Social media profiles (Twitter, Facebook, Instagram if applicable)
        
        2. Key contacts (2-4 people):
           - Decision makers (C-level, VPs)
           - Purchasing authorities
           - Department heads relevant to: {context[:200]}
        
        For each person provide:
           - Full name
           - Designation
           - Role category (Decision Maker, Purchasing Authority, Technical Lead, etc.)
           - Professional email (if publicly available)
           - LinkedIn URL
           - Confidence score (0.0-1.0)
        
        Return JSON format:
        {{
            "email_addresses": ["info@company.com", "sales@company.com"],
            "phone_numbers": [{{"number": "+1-xxx-xxx-xxxx", "has_whatsapp": true}}],
            "twitter_url": "https://twitter.com/company",
            "facebook_url": "https://facebook.com/company",
            "key_contacts": [
                {{
                    "full_name": "John Doe",
                    "designation": "CEO",
                    "role_category": "Decision Maker",
                    "email": "john.doe@company.com",
                    "linkedin_url": "https://linkedin.com/in/johndoe",
                    "confidence_score": 0.85
                }}
            ]
        }}
        
        Use realistic data. Mark confidence as lower (0.3-0.5) if data is inferred.
        """
        
        user_prompt = f"""
        Company: {lead.company_name}
        Website: {lead.website}
        Industry: {lead.industry}
        Location: {lead.location}
        
        Enrich this company with contact information and key personnel.
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
            
            # Update lead with enriched data
            lead.email_addresses = enrichment_data.get("email_addresses", [])
            lead.phone_numbers = enrichment_data.get("phone_numbers", [])
            lead.twitter_url = enrichment_data.get("twitter_url")
            lead.facebook_url = enrichment_data.get("facebook_url")
            lead.instagram_url = enrichment_data.get("instagram_url")
            
            # Add key contacts
            contacts_data = enrichment_data.get("key_contacts", [])
            for contact_info in contacts_data:
                contact = PersonContact(
                    full_name=contact_info.get("full_name", "Unknown"),
                    designation=contact_info.get("designation", "Unknown"),
                    role_category=contact_info.get("role_category", "Contact"),
                    email=contact_info.get("email"),
                    linkedin_url=contact_info.get("linkedin_url"),
                    confidence_score=contact_info.get("confidence_score", 0.5),
                    data_source="llm_enrichment"
                )
                lead.key_contacts.append(contact)
            
            lead.enrichment_status = "enriched"
            lead.confidence_score = 0.75
            lead.data_sources.append("llm_enrichment")
            
        except Exception as e:
            print(f"Error enriching {lead.company_name}: {e}")
            lead.enrichment_status = "failed"
            lead.confidence_score = 0.3
        
        return lead
