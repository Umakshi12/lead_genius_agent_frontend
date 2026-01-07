from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    CompanyInput, ResearchResult, DiscoveryInput, DiscoveryResult, 
    KeywordProposal, StrategyInput, StrategyResult,
    LeadGenerationRequest, LeadGenerationResult,
    CompanyLookupRequest, CompanyLookupResponse
)
from app.agents.research_agent import ResearchAgent
from app.agents.discovery_agent import DiscoveryAgent
from app.agents.lead_generation_agent import LeadGenerationAgent
from app.services.company_lookup import company_lookup_service

router = APIRouter()

# Initialize agents
research_agent = ResearchAgent()
discovery_agent = DiscoveryAgent()
lead_gen_agent = LeadGenerationAgent()


@router.post("/lookup-company", response_model=CompanyLookupResponse)
async def lookup_company(input_data: CompanyLookupRequest):
    """
    Auto-fetch company URL and industry based on company name.
    Uses DuckDuckGo search + AI to find the official website and industry.
    """
    try:
        result = await company_lookup_service.lookup_company(input_data.company_name)
        return CompanyLookupResponse(
            website=result.get("website"),
            industry=result.get("industry"),
            error=result.get("error")
        )
    except Exception as e:
        return CompanyLookupResponse(
            website=None,
            industry=None,
            error=str(e)
        )


@router.post("/analyze", response_model=ResearchResult)
async def analyze_company(input_data: CompanyInput):
    try:
        result = await research_agent.analyze(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/keywords", response_model=KeywordProposal)
async def generate_keywords(input_data: DiscoveryInput):
    try:
        result = await discovery_agent.propose_keywords(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/strategy", response_model=StrategyResult)
async def generate_strategy(input_data: StrategyInput):
    try:
        result = await discovery_agent.generate_strategy(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-leads", response_model=LeadGenerationResult)
async def generate_leads(input_data: LeadGenerationRequest):
    """
    Generate and enrich leads from selected channels.
    This endpoint orchestrates the full lead generation workflow:
    1. Discover companies from each selected channel
    2. Enrich each company with contact information
    3. Identify key decision makers and contacts
    4. Return structured, tabular data
    """
    try:
        # Backward compatibility - wait for generator to finish if client calls this
        # Note: Ideally this would reuse the stream but collect it.
        # For now, we'll keep the old implementation if needed, but since we modified the class...
        # Wait - I removed the old implementation in the previous step (passed).
        # So I need to restore a wrapper or just direct traffic.
        
        # Actually my previous edit made generate_leads just `pass`. So this endpoint is broken now unless I fix it.
        # I should change this to use the stream and collect results.
        
        companies = []
        leads_by_channel = {}
        
        async for line in lead_gen_agent.generate_leads_stream(input_data):
            try:
                msg = json.loads(line)
                if msg["type"] == "lead":
                     company = CompanyLead(**msg["data"])
                     companies.append(company)
                     channel = company.channel_source
                     leads_by_channel[channel] = leads_by_channel.get(channel, 0) + 1
            except:
                 pass
                 
        return LeadGenerationResult(
            total_leads=len(companies),
            leads_by_channel=leads_by_channel,
            companies=companies,
            generation_summary=f"Generated {len(companies)} leads",
            started_at=datetime.utcnow().isoformat(),
            completed_at=datetime.utcnow().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import StreamingResponse
import json
from datetime import datetime

@router.post("/generate-leads-stream")
async def generate_leads_stream(input_data: LeadGenerationRequest):
    """
    Stream lead generation events as they happen.
    Returns JSON lines.
    """
    try:
        return StreamingResponse(
            lead_gen_agent.generate_leads_stream(input_data),
            media_type="application/x-ndjson"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

