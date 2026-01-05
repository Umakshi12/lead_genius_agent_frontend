from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional

class CompanyInput(BaseModel):
    company_name: str
    website: str  # Kept as str to avoid strict validation errors early on
    industry: Optional[str] = None
    existing_customers: Optional[str] = None


class CompanyLookupRequest(BaseModel):
    """Request schema for company lookup"""
    company_name: str = Field(description="Name of the company to look up")


class CompanyLookupResponse(BaseModel):
    """Response schema for company lookup"""
    website: Optional[str] = Field(default=None, description="Official website URL of the company")
    industry: Optional[str] = Field(default=None, description="Industry/sector the company operates in")
    error: Optional[str] = Field(default=None, description="Error message if lookup failed")


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
    
    # Contact Information (auto-fetched from website)
    main_address: Optional[str] = Field(default=None, description="Company's main/headquarters address")
    phone_numbers: List[str] = Field(default=[], description="Company phone numbers")
    email_addresses: List[str] = Field(default=[], description="Company email addresses")
    branches: List[dict] = Field(default=[], description="Branch/office locations with contact info")
    
    # Social Media Profiles (auto-fetched from website footer)
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    github_url: Optional[str] = None
    whatsapp_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    pinterest_url: Optional[str] = None
    snapchat_url: Optional[str] = None
    threads_url: Optional[str] = None
    tripadvisor_url: Optional[str] = None


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
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    whatsapp_number: Optional[str] = None
    data_source: str = Field(default="website_scrape", description="Source of the data")


class CompanyLead(BaseModel):
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    
    # Address Information
    main_address: Optional[str] = None
    headquarters: Optional[str] = None
    branches: List[dict] = []  # [{name, address, phone, email}]
    
    # Social Media
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    whatsapp_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    
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

