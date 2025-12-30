from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    CompanyInput, ResearchResult, DiscoveryInput, DiscoveryResult, 
    KeywordProposal, StrategyInput, StrategyResult,
    LeadGenerationRequest, LeadGenerationResult
)
from app.agents.research_agent import ResearchAgent
from app.agents.discovery_agent import DiscoveryAgent
from app.agents.lead_generation_agent import LeadGenerationAgent

router = APIRouter()

# Initialize agents
research_agent = ResearchAgent()
discovery_agent = DiscoveryAgent()
lead_gen_agent = LeadGenerationAgent()

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
        result = await lead_gen_agent.generate_leads(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
