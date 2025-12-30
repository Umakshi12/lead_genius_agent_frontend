from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional

class CompanyInput(BaseModel):
    company_name: str
    website: str  # Kept as str to avoid strict validation errors early on
    industry: Optional[str] = None
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
    
    # Social Media Profiles (auto-fetched from website)
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    github_url: Optional[str] = None


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

# Lead Generation Schemas
class LeadGenerationRequest(BaseModel):
    selected_channels: List[str] = Field(description="List of channel names to scrape")
    selected_keywords: List[str] = Field(description="Keywords to search for")
    target_industries: List[str] = Field(description="Target industries")
    company_summary: str = Field(description="Company summary for context")
    max_leads_per_channel: int = Field(default=50, description="Maximum leads to generate per channel")

class PersonContact(BaseModel):
    full_name: str
    designation: str
    role_category: str = Field(description="e.g., Decision Maker, Purchasing Authority, Technical Lead")
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    confidence_score: float = Field(default=0.0, description="Confidence in data accuracy 0.0-1.0")
    data_source: str = Field(default="public_search", description="Source of the data")

class CompanyLead(BaseModel):
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    
    # Social Media
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    
    # Contact Info
    email_addresses: List[str] = []
    phone_numbers: List[dict] = []  # [{number: str, has_whatsapp: bool}]
    
    # Key Contacts
    key_contacts: List[PersonContact] = []
    
    # Metadata
    channel_source: str = Field(description="Which channel this lead came from")
    keywords_matched: List[str] = []
    confidence_score: float = Field(default=0.0)
    enrichment_status: str = Field(default="pending", description="pending, enriched, failed")
    data_sources: List[str] = []
    discovered_at: str = Field(description="ISO timestamp")

class LeadGenerationResult(BaseModel):
    total_leads: int
    leads_by_channel: dict  # {channel_name: count}
    companies: List[CompanyLead]
    generation_summary: str
    started_at: str
    completed_at: str

