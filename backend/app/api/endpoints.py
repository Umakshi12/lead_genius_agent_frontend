from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
import json
from datetime import datetime
import uuid

from app.database import get_db
from app.models.lead import Lead
from app.models.schemas import (
    CompanyInput, ResearchResult, DiscoveryInput, DiscoveryResult, 
    KeywordProposal, StrategyInput, StrategyResult,
    LeadGenerationRequest, LeadGenerationResult,
    CompanyLookupRequest, CompanyLookupResponse,
    CompanyLead
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

@router.post("/generate-leads")
async def generate_leads(
    input_data: LeadGenerationRequest, 
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    """
    Generate, enrich, and stream leads from selected channels.
    Saves results to database for persistence in real-time.
    Uses UPSERT logic to avoid duplicates.
    """
    tenant_id = getattr(request.state, "rls_tenant", "00000000-0000-0000-0000-000000000001")
    
    async def generate_and_save():
        from sqlalchemy import select
        
        print(f"[API] Starting streamlined generation for {len(input_data.selected_keywords)} keywords...")
        
        async for line in lead_gen_agent.generate_leads_stream(input_data):
            try:
                msg = json.loads(line)
                
                if msg["type"] == "lead":
                    company_data = msg["data"]
                    company = CompanyLead(**company_data)
                    
                    # --- UPSERT LOGIC ---
                    # 1. Check if lead exists for this tenant (by website domain)
                    existing_lead = None
                    if company.website:
                        from app.agents.lead_generation_agent import normalize_domain
                        domain = normalize_domain(company.website)
                        if domain:
                            stmt = select(Lead).where(
                                Lead.tenant_id == tenant_id,
                                Lead.website.ilike(f"%{domain}%")
                            )
                            result = await db.execute(stmt)
                            existing_lead = result.scalars().first()
                    
                    if existing_lead:
                        print(f"[DB] Updating existing lead: {company.company_name}")
                        existing_lead.data = company_data
                        existing_lead.location = company.location
                        existing_lead.industry = company.industry
                        existing_lead.campaign_id = input_data.campaign_id
                        existing_lead.updated_at = datetime.utcnow()
                    else:
                        print(f"[DB] Saving new lead: {company.company_name}")
                        new_lead = Lead(
                            id=uuid.uuid4(),
                            tenant_id=tenant_id,
                            campaign_id=input_data.campaign_id,
                            company_name=company.company_name,
                            website=company.website,
                            industry=company.industry,
                            location=company.location,
                            status="new",
                            data=company_data
                        )
                        db.add(new_lead)
                    
                    # Commit every lead to ensure persistence even if stream breaks
                    await db.commit()
                
                # Yield the original line to the frontend stream
                yield line
                
            except Exception as e:
                print(f"[STREAM ERROR] Failed to process lead: {e}")
                import traceback
                traceback.print_exc()
                # Still yield the error if possible or skip
                pass

    return StreamingResponse(
        generate_and_save(),
        media_type="application/x-ndjson"
    )



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

