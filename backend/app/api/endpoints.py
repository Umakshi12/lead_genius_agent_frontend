from fastapi import APIRouter, HTTPException
from app.models.schemas import CompanyInput, ResearchResult, DiscoveryInput, DiscoveryResult, KeywordProposal, StrategyInput, StrategyResult
from app.agents.research_agent import ResearchAgent
from app.agents.discovery_agent import DiscoveryAgent

router = APIRouter()

# Initialize agents
# Note: we might want to do this on startup or use dependency injection
# For now, global instance is fine for prototype
research_agent = ResearchAgent()
discovery_agent = DiscoveryAgent()

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
