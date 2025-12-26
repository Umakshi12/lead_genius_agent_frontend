from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional

class CompanyInput(BaseModel):
    company_name: str
    website: str  # Kept as str to avoid strict validation errors early on
    industry: Optional[str] = None
    social_urls: List[str] = []
    existing_customers: Optional[str] = None

class ResearchResult(BaseModel):
    company_name: str
    company_summary: str = Field(description="Structured summary of the company")
    icp_profile: List[str] = Field(description="List of Ideal Customer Profiles")
    target_industries: List[str] = Field(description="List of industries they target")
    target_companies: List[str] = Field(description="List of specific example companies they could target")
    usp: str = Field(description="Unique Selling Proposition")
    pain_points: List[str] = Field(description="Customer pain points they solve")
    sources: List[str] = Field(description="List of sources used for verification")
    confidence_score: float = Field(description="Confidence score 0.0 to 1.0")

class DiscoveryInput(BaseModel):
    icp_profile: List[str]
    target_industries: List[str]
    company_summary: str

class KeywordCategory(BaseModel):
    category_name: str
    keywords: List[str]

class KeywordProposal(BaseModel):
    grouped_keywords: List[KeywordCategory]

class StrategyInput(BaseModel):
    selected_keywords: List[str]
    company_summary: str
    target_industries: List[str]

class StrategyResult(BaseModel):
    channels: List[dict] # name, relevance_score
    strategy_summary: str

class KeywordData(BaseModel):
    keyword: str
    intent_score: int
    volume: Optional[str] = "N/A"

class ChannelData(BaseModel):
    name: str
    description: str
    relevance_score: int

class DiscoveryResult(BaseModel):
    keywords: List[KeywordData]
    channels: List[ChannelData]
