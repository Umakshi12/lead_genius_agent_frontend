# 🚀 Lead Genius AI - Complete Backend System Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Flow](#architecture--flow)
3. [AI Models Used](#ai-models-used)
4. [Agents & Their Working](#agents--their-working)
5. [API Endpoints](#api-endpoints)
6. [Data Flow](#data-flow)
7. [Integration Components](#integration-components)
8. [Complete Workflow Examples](#complete-workflow-examples)

---

# 1. System Overview

## What is Lead Genius AI?

**Lead Genius AI** is an intelligent B2B lead generation system that uses **LLM-powered agents** to automatically discover, enrich, and qualify business leads from multiple channels including **Google Maps**, **LinkedIn**, and other platforms.

### Core Capabilities:
- 🔍 **Company Research** - Analyzes a company to understand their ICP, target market, and USP
- 🎯 **Keyword Discovery** - Generates targeted keywords based on company profile
- 📊 **Multi-Channel Strategy** - Recommends optimal channels for lead generation
- 🌐 **Automated Scraping** - Scrapes Google Maps and other sources using Playwright
- 🤖 **LLM Enrichment** - Uses GPT-4o-mini to enrich leads with executive contacts and verified data
- ✅ **Lead Qualification** - Scores and filters leads based on ICP match

### Tech Stack:
- **Backend Framework**: FastAPI (Python)
- **AI/LLM**: OpenAI GPT-4o-mini (via AsyncOpenAI)
- **Web Scraping**: Playwright (headless browser automation)
- **Search**: DuckDuckGo Search API
- **Data Validation**: Pydantic models
- **Event Loop**: nest_asyncio (for Python 3.13+ Windows compatibility)

---

# 2. Architecture & Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                │
│                     User Interface Layer                                 │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTP/REST API
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    API ENDPOINTS (endpoints.py)                   │  │
│  │  • /api/analyze        • /api/keywords                            │  │
│  │  • /api/strategy       • /api/generate-leads                      │  │
│  │  • /api/lookup-company • /api/generate-leads-stream              │  │
│  └──────────────────────────┬───────────────────────────────────────┘  │
│                             │                                            │
│  ┌──────────────────────────┼───────────────────────────────────────┐  │
│  │              AGENT LAYER (AI-Powered Agents)                      │  │
│  │                          │                                         │  │
│  │  ┌────────────────┐  ┌──┴──────────────┐  ┌──────────────────┐  │  │
│  │  │ ResearchAgent  │  │ DiscoveryAgent  │  │ LeadGenAgent     │  │  │
│  │  │ (GPT-4o-mini)  │  │ (GPT-4o-mini)   │  │ (GPT-4o-mini)    │  │  │
│  │  └────────┬───────┘  └──┬──────────────┘  └──┬───────────────┘  │  │
│  │           │              │                     │                   │  │
│  └───────────┼──────────────┼─────────────────────┼──────────────────┘  │
│              │              │                     │                      │
│  ┌───────────┼──────────────┼─────────────────────┼──────────────────┐  │
│  │                    SERVICE LAYER                                   │  │
│  │           │              │                     │                   │  │
│  │  ┌────────▼──────┐      │           ┌─────────▼────────────┐     │  │
│  │  │ WebScraper    │      │           │ GoogleMapsScraper    │     │  │
│  │  │ (Playwright)  │      │           │ (Playwright)         │     │  │
│  │  └────────┬──────┘      │           └─────────┬────────────┘     │  │
│  │           │              │                     │                   │  │
│  │  ┌────────▼──────────────▼─────────────────────▼──────────────┐  │  │
│  │  │           CompanyLookupService (DuckDuckGo)                 │  │  │
│  │  └──────────────────────────────────────────────────────────┐  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                   │
│  • OpenAI API (GPT-4o-mini)                                             │
│  • Google Maps (via Playwright)                                         │
│  • DuckDuckGo Search API                                                │
│  • Company Websites (scraped via Playwright)                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Complete System Flow

```
USER REQUEST
    ↓
┌─── Step 1: Company Research ───────────────────────────────────────────┐
│ Endpoint: POST /api/analyze                                             │
│ Agent: ResearchAgent                                                    │
│ Model: GPT-4o-mini                                                      │
│                                                                          │
│ Input: {company_name, website, industry, existing_customers}            │
│                                                                          │
│ Process:                                                                 │
│ 1. Scrapes company website using WebScraper (Playwright)                │
│ 2. Extracts: About page, products, services, contact info               │
│ 3. If existing_customers provided: Analyzes customer patterns           │
│ 4. Sends to GPT-4o-mini with research prompt                           │
│ 5. LLM analyzes and extracts:                                           │
│    - Company summary                                                     │
│    - ICP (Ideal Customer Profile)                                       │
│    - Target industries                                                   │
│    - Target companies (examples)                                         │
│    - USP (Unique Selling Proposition)                                   │
│    - Pain points they solve                                             │
│    - Customer patterns (if applicable)                                   │
│                                                                          │
│ Output: ResearchResult (structured company analysis)                    │
└──────────────────────────────────────────────────────────────────────────┘
    ↓
┌─── Step 2: Keyword Discovery ──────────────────────────────────────────┐
│ Endpoint: POST /api/keywords                                            │
│ Agent: DiscoveryAgent                                                   │
│ Model: GPT-4o-mini                                                      │
│                                                                          │
│ Input: {icp_profile, target_industries, company_summary}                │
│                                                                          │
│ Process:                                                                 │
│ 1. Sends ICP + industries to GPT-4o-mini                                │
│ 2. LLM generates buyer-intent keywords grouped by:                      │
│    - Transactional (ready to buy)                                       │
│    - Commercial (comparing options)                                     │
│    - Informational (researching)                                        │
│ 3. Returns keywords with intent scores                                  │
│                                                                          │
│ Output: KeywordProposal (grouped keywords with categories)              │
└──────────────────────────────────────────────────────────────────────────┘
    ↓
┌─── Step 3: Channel Strategy ───────────────────────────────────────────┐
│ Endpoint: POST /api/strategy                                            │
│ Agent: DiscoveryAgent                                                   │
│ Model: GPT-4o-mini                                                      │
│                                                                          │
│ Input: {selected_keywords, company_summary, target_industries}          │
│                                                                          │
│ Process:                                                                 │
│ 1. Analyzes keywords and company profile                                │
│ 2. LLM recommends optimal channels:                                     │
│    - Google Maps (for local/physical businesses)                        │
│    - LinkedIn (for B2B, executives)                                     │
│    - Industry Directories                                               │
│    - Trade Associations                                                 │
│ 3. Assigns relevance scores (0-100) to each channel                     │
│                                                                          │
│ Output: StrategyResult (ranked channels with scores)                    │
└──────────────────────────────────────────────────────────────────────────┘
    ↓
┌─── Step 4: Lead Generation (THE CORE WORKFLOW) ─────────────────────────┐
│ Endpoint: POST /api/generate-leads                                      │
│ Agent: LeadGenerationAgent                                              │
│ Models: GPT-4o-mini + GoogleMapsScraper (Playwright)                    │
│                                                                          │
│ Input: {                                                                 │
│   selected_channels: ["Google Maps", "LinkedIn"],                       │
│   selected_keywords: ["restaurants", "hotels"],                         │
│   target_industries: ["Hospitality"],                                   │
│   location: "Miami, FL",                                                │
│   max_leads_per_channel: 50                                             │
│ }                                                                        │
│                                                                          │
│ Process:                                                                 │
│                                                                          │
│ ┌─ Phase 1: Discovery (Per Channel) ────────────────────────────────┐  │
│ │                                                                     │  │
│ │ FOR EACH CHANNEL:                                                  │  │
│ │                                                                     │  │
│ │ IF channel == "Google Maps" (or variants):                         │  │
│ │   ├─ Launches Playwright browser (headless)                        │  │
│ │   ├─ For each keyword:                                             │  │
│ │   │   ├─ Navigates to google.com/maps                              │  │
│ │   │   ├─ Searches "{keyword} in {location}"                        │  │
│ │   │   ├─ Infinite scroll to harvest all business URLs              │  │
│ │   │   ├─ Parallel visits (5-20 concurrent pages)                   │  │
│ │   │   ├─ Extracts from each business page:                         │  │
│ │   │   │   • Company name (H1 tag)                                  │  │
│ │   │   │   • Address (data-item-id='address')                       │  │
│ │   │   │   • Phone (data-item-id='phone')                           │  │
│ │   │   │   • Website (data-item-id='authority')                     │  │
│ │   │   │   • Category (keyword)                                     │  │
│ │   │   └─ Creates CompanyLead with channel_source="Google Maps"    │  │
│ │   └─ Returns discovered leads                                      │  │
│ │                                                                     │  │
│ │ ELSE (other channels):                                             │  │
│ │   └─ Uses LLM to generate example companies (for prototyping)     │  │
│ │                                                                     │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│     ↓                                                                    │
│ ┌─ Phase 2: Enrichment (Agentic Workflow with GPT-4o-mini) ─────────┐  │
│ │                                                                     │  │
│ │ FOR EACH DISCOVERED LEAD (parallel, max 10 concurrent):            │  │
│ │                                                                     │  │
│ │ ┌─ Substep 2.1: Deep Website Crawling ──────────────────────────┐ │  │
│ │ │ • Scrapes: Homepage, About, Contact, Team, Locations           │ │  │
│ │ │ • Extracts social media links from footer                      │ │  │
│ │ │ • Gets ~20,000 characters of content                           │ │  │
│ │ │ • Auto-corrects bad URLs using DuckDuckGo search               │ │  │
│ │ └────────────────────────────────────────────────────────────────┘ │  │
│ │     ↓                                                               │  │
│ │ ┌─ Substep 2.2: Multi-Source Verification ──────────────────────┐ │  │
│ │ │ Executes 7 targeted DuckDuckGo searches (parallel):            │ │  │
│ │ │ 1. "{company} official headquarters address location"          │ │  │
│ │ │ 2. "{company} CEO founder president executive team"            │ │  │
│ │ │ 3. "{company} leadership management board directors"           │ │  │
│ │ │ 4. "{company} official social media LinkedIn Facebook..."      │ │  │
│ │ │ 5. "{company} branch locations offices stores"                 │ │  │
│ │ │ 6. "{company} contact phone email customer service"            │ │  │
│ │ │ 7. "{company} LinkedIn company profile site:linkedin.com"      │ │  │
│ │ │                                                                 │ │  │
│ │ │ Collects: titles, snippets, links from top 4 results each      │ │  │
│ │ └────────────────────────────────────────────────────────────────┘ │  │
│ │     ↓                                                               │  │
│ │ ┌─ Substep 2.3: LLM Agentic Analysis (GPT-4o-mini) ─────────────┐ │  │
│ │ │                                                                 │ │  │
│ │ │ System Prompt Role:                                            │ │  │
│ │ │ "You are a Senior Business Intelligence Agent specializing    │ │  │
│ │ │  in high-fidelity lead generation and corporate data          │ │  │
│ │ │  extraction."                                                  │ │  │
│ │ │                                                                 │ │  │
│ │ │ Constraints:                                                    │ │  │
│ │ │ • ZERO HALLUCINATION POLICY - Only verified data               │ │  │
│ │ │ • Return "Not Publicly Disclosed" for missing data             │ │  │
│ │ │ • NO placeholder emails (info@, contact@)                      │ │  │
│ │ │ • TOP PRIORITY: Find executive names from LinkedIn snippets    │ │  │
│ │ │                                                                 │ │  │
│ │ │ Input to LLM:                                                   │ │  │
│ │ │ ┌──────────────────────────────────────────────────────────┐  │ │  │
│ │ │ │ **SOURCE DATA 1: WEBSITE CONTENT**                        │  │ │  │
│ │ │ │ [20,000 chars of scraped website text]                    │  │ │  │
│ │ │ │                                                            │  │ │  │
│ │ │ │ **SOURCE DATA 2: EXTERNAL VERIFICATION**                  │  │ │  │
│ │ │ │ [Search results from 7 queries above]                     │  │ │  │
│ │ │ └──────────────────────────────────────────────────────────┘  │ │  │
│ │ │                                                                 │ │  │
│ │ │ LLM Extraction (JSON output):                                  │ │  │
│ │ │ {                                                               │ │  │
│ │ │   "company_details": {                                          │ │  │
│ │ │     "official_name": "...",                                     │ │  │
│ │ │     "headquarters_address": "...",                              │ │  │
│ │ │     "main_phone": "...",                                        │ │  │
│ │ │     "general_emails": ["..."]                                   │ │  │
│ │ │   },                                                            │ │  │
│ │ │   "social_media": {                                             │ │  │
│ │ │     "linkedin": "...", "twitter": "...", ...                    │ │  │
│ │ │   },                                                            │ │  │
│ │ │   "key_decision_makers": [  ← 🎯 TOP PRIORITY                  │ │  │
│ │ │     {                                                           │ │  │
│ │ │       "name": "John Doe",                                       │ │  │
│ │ │       "title": "CEO",                                           │ │  │
│ │ │       "role_category": "Decision Maker",                        │ │  │
│ │ │       "email": "john@company.com",                              │ │  │
│ │ │       "linkedin": "linkedin.com/in/johndoe",                    │ │  │
│ │ │       "source": "LinkedIn"                                      │ │  │
│ │ │     }                                                           │ │  │
│ │ │   ],                                                            │ │  │
│ │ │   "branches": [...]                                             │ │  │
│ │ │ }                                                               │ │  │
│ │ │                                                                 │ │  │
│ │ └────────────────────────────────────────────────────────────────┘ │  │
│ │     ↓                                                               │  │
│ │ ┌─ Substep 2.4: Data Mapping & Validation ──────────────────────┐ │  │
│ │ │ • Maps LLM output to CompanyLead schema                        │ │  │
│ │ │ • Filters out "Not Publicly Disclosed" values                  │ │  │
│ │ │ • Detects WhatsApp numbers (international format)              │ │  │
│ │ │ • Converts executives to PersonContact objects                 │ │  │
│ │ │ • Sets enrichment_status = "enriched"                          │ │  │
│ │ │ • Calculates confidence_score (0.95 if contacts found)         │ │  │
│ │ └────────────────────────────────────────────────────────────────┘ │  │
│ │                                                                     │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│     ↓                                                                    │
│ Output: LeadGenerationResult {                                          │
│   total_leads: 150,                                                     │
│   leads_by_channel: {"Google Maps": 100, "LinkedIn": 50},              │
│   companies: [CompanyLead, CompanyLead, ...]                            │
│ }                                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# 3. AI Models Used

## Primary Model: **OpenAI GPT-4o-mini**

### Configuration
```python
# File: .env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# File: All agent files
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
```

### Usage Breakdown

| Agent | Model | Usage Purpose | Response Format |
|-------|-------|---------------|-----------------|
| **ResearchAgent** | GPT-4o-mini | Company analysis, ICP extraction, USP identification | JSON (structured) |
| **DiscoveryAgent** | GPT-4o-mini | Keyword generation, channel recommendation | JSON (structured) |
| **LeadGenerationAgent** | GPT-4o-mini | Lead enrichment, executive extraction, data validation | JSON (structured) |

### Model Characteristics
- **Speed**: Fast (optimized for quick responses)
- **Cost**: Low-cost (0.150/1M input tokens, 0.600/1M output tokens)
- **Context Window**: 128K tokens
- **Response Format**: Structured JSON (using `response_format={"type": "json_object"}`)
- **Temperature**: Default (typically 0.7 for balance between creativity and consistency)

### Why GPT-4o-mini?
1. ✅ **Cost-effective** for high-volume lead enrichment
2. ✅ **Fast** enough for real-time streaming responses
3. ✅ **Reliable** JSON output with structured schema
4. ✅ **Smart** enough for complex data extraction and reasoning
5. ✅ **Async-ready** via AsyncOpenAI for parallel processing

---

# 4. Agents & Their Working

## 4.1 ResearchAgent 🔍

### **File**: `app/agents/research_agent.py`

### **Purpose**: 
Analyzes a company to understand their business model, target customers, and value proposition.

### **Model Used**: GPT-4o-mini

### **Key Methods**:

#### `analyze(input_data: CompanyInput) -> ResearchResult`

**Input Schema**:
```python
{
    "company_name": "Arizona Tile",
    "website": "https://arizonatile.com",
    "industry": "Building Materials",
    "existing_customers": "General contractors, architects, retailers",
    "sub_product": "Porcelain tiles, natural stone"
}
```

**Process Flow**:
1. **Website Scraping** (WebScraper):
   ```python
   scraped_data = await self.scraper.extract_contact_info(input_data.website)
   website_content = scraped_data.get("website_content", "")
   ```

2. **Customer Pattern Analysis** (if existing_customers provided):
   ```python
   if input_data.existing_customers:
       customer_pattern = await self._analyze_customer_patterns(
           input_data.existing_customers
       )
   ```

3. **LLM Analysis** (GPT-4o-mini):
   ```python
   system_prompt = """You are a B2B market research analyst.
   Analyze this company and identify:
   - Their ICP (Ideal Customer Profile)
   - Target industries
   - Target companies (specific examples)
   - Unique Selling Proposition
   - Pain points they solve
   """
   
   response = await self.client.chat.completions.create(
       model="gpt-4o-mini",
       messages=[
           {"role": "system", "content": system_prompt},
           {"role": "user", "content": f"Company: {company_name}\n{website_content}"}
       ],
       response_format={"type": "json_object"}
   )
   ```

4. **Contact Info Extraction**:
   - Parses scraped data for emails, phones, addresses
   - Extracts social media links from footer

**Output Schema**:
```python
{
    "company_name": "Arizona Tile",
    "company_summary": "Leading supplier of...",
    "icp_profile": [
        "General contractors working on $500K+ projects",
        "Architects specifying materials for commercial buildings"
    ],
    "target_industries": [
        "Construction (General Contractors)",
        "Architecture & Design",
        "Interior Design",
        "Retail (Home Improvement)"
    ],
    "target_companies": [
        "Turner Construction",
        "Skanska USA",
        "Gensler Architecture"
    ],
    "usp": "Premium natural stone with industry expertise",
    "pain_points": [
        "Finding reliable high-quality tile suppliers",
        "Matching materials to project specifications"
    ],
    "customer_pattern": {
        "common_industries": ["Construction", "Architecture"],
        "typical_size": "50-200 employees",
        "geographic_focus": "Southwest US"
    },
    "confidence_score": 0.85,
    "main_address": "...",
    "email_addresses": ["..."],
    "linkedin_url": "..."
}
```

---

## 4.2 DiscoveryAgent 🎯

### **File**: `app/agents/discovery_agent.py`

### **Purpose**: 
Generates buyer-intent keywords and recommends optimal lead generation channels.

### **Model Used**: GPT-4o-mini

### **Key Methods**:

#### `propose_keywords(input_data: DiscoveryInput) -> KeywordProposal`

**Input**:
```python
{
    "icp_profile": ["General contractors", "Architects"],
    "target_industries": ["Construction", "Architecture"],
    "company_summary": "Premium tile supplier"
}
```

**LLM Prompt**:
```python
system_prompt = """You are a keyword research specialist.
Generate buyer-intent keywords in 3 categories:

1. TRANSACTIONAL (ready to buy):
   - "buy [product]", "hire [service]", "order [product]"

2. COMMERCIAL (comparing options):
   - "best [product]", "[product] suppliers", "top [service] companies"

3. INFORMATIONAL (researching):
   - "how to [problem]", "what is [concept]"

Return as JSON with grouped keywords.
"""
```

**Output**:
```python
{
    "grouped_keywords": [
        {
            "category_name": "Transactional",
            "keywords": [
                "buy porcelain tiles wholesale",
                "order natural stone slabs",
                "tile suppliers near me"
            ]
        },
        {
            "category_name": "Commercial",
            "keywords": [
                "best tile distributors",
                "commercial tile suppliers",
                "architect tile specifications"
            ]
        }
    ]
}
```

#### `generate_strategy(input_data: StrategyInput) -> StrategyResult`

**Input**:
```python
{
    "selected_keywords": ["tile suppliers", "stone distributors"],
    "company_summary": "Premium tile supplier",
    "target_industries": ["Construction"]
}
```

**LLM Reasoning**:
```python
system_prompt = """You are a lead generation strategist.
Recommend the top 5 channels for finding leads, ranked by:
- Relevance (0-100)
- Likelihood of finding decision-makers
- Match with keywords and industries

Consider:
- Google Maps (for local businesses)
- LinkedIn (for B2B professionals)
- Industry directories
- Trade associations
- Review sites
"""
```

**Output**:
```python
{
    "channels": [
        {"name": "Google Maps", "relevance_score": 95},
        {"name": "LinkedIn", "relevance_score": 85},
        {"name": "Yellow Pages", "relevance_score": 70}
    ],
    "strategy_summary": "Google Maps is optimal for finding local contractors..."
}
```

---

## 4.3 LeadGenerationAgent 🚀 (MOST COMPLEX)

### **File**: `app/agents/lead_generation_agent.py`

### **Purpose**: 
Orchestrates the complete lead generation workflow - discovery + enrichment.

### **Models/Tools Used**:
- **GPT-4o-mini**: For lead enrichment and data extraction
- **GoogleMapsScraper** (Playwright): For scraping Google Maps
- **WebScraper** (Playwright): For scraping company websites
- **DuckDuckGo Search**: For multi-source verification

### **Key Methods**:

#### `generate_leads(request: LeadGenerationRequest) -> LeadGenerationResult`

**Orchestration Flow**:
```python
async def generate_leads(self, request):
    # Parallel channel processing
    discovery_tasks = [
        self._discover_and_enrich_channel(channel, request)
        for channel in request.selected_channels
    ]
    
    results = await asyncio.gather(*discovery_tasks)
    # Each task returns (leads, channel_name)
    
    return LeadGenerationResult(
        total_leads=sum(len(leads) for leads, _ in results),
        companies=[lead for leads, _ in results for lead in leads]
    )
```

#### `_discover_from_channel(channel, keywords, industries, location) -> List[CompanyLead]`

**Channel Routing Logic**:
```python
# Google Maps detection
google_maps_variations = ["google maps", "googlemaps", "maps", "gmaps", "google map"]
if channel.lower() in google_maps_variations:
    return await self._discover_from_google_maps(keywords, location, max_leads)

# Other channels use LLM-based discovery
else:
    # LLM generates example companies
    response = await self.client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[...],
        response_format={"type": "json_object"}
    )
```

#### `_discover_from_google_maps(keywords, location, max_leads) -> List[CompanyLead]`

**Google Maps Scraping** (Playwright):
```python
from playwright.async_api import async_playwright
from app.agents.google_maps import GoogleMapsScraper

scraper = GoogleMapsScraper()

async with async_playwright() as p:
    browser = await p.chromium.launch(headless=True)
    context = await browser.new_context()
    
    for keyword in keywords[:3]:
        async for record in scraper.search(context, location, keyword=keyword):
            # record contains: company_name, address, phone, website
            
            lead = CompanyLead(
                company_name=record.company_name,
                website=record.company_website,
                location=record.company_full_address,
                phone_numbers=[{"number": record.company_phone_number}],
                channel_source="Google Maps",
                keywords_matched=[keyword],
                confidence_score=0.9
            )
            
            discovered_leads.append(lead)
    
    return discovered_leads
```

#### `_enrich_company_lead(lead: CompanyLead, context: str) -> CompanyLead`

**The Agentic Enrichment Workflow** (Most Complex Part):

```python
# Phase 1: Deep Website Crawling
scraped_data = await self.scraper.extract_contact_info(lead.website)
website_content = scraped_data.get("website_content", "")  # ~20K chars

# Auto-correct bad URLs
if len(website_content) < 500:
    recovery_query = f"{lead.company_name} official website"
    search_results = self.scraper.search(recovery_query, max_results=1)
    new_url = search_results[0]['href']
    lead.website = new_url
    scraped_data = await self.scraper.extract_contact_info(new_url)

# Phase 2: Multi-Source Verification (7 parallel searches)
verification_queries = [
    f"{lead.company_name} official headquarters address",
    f"{lead.company_name} CEO founder president executive",
    f"{lead.company_name} leadership management board",
    f"{lead.company_name} social media LinkedIn",
    f"{lead.company_name} branch locations offices",
    f"{lead.company_name} contact phone email",
    f"{lead.company_name} LinkedIn site:linkedin.com"
]

search_results = await asyncio.gather(*[
    loop.run_in_executor(None, lambda q=q: self.scraper.search(q, max_results=4))
    for q in verification_queries
])

# Compile search context
search_context = ""
for results in search_results:
    search_context += "\n".join([
        f"Title: {r['title']}\nSnippet: {r['body']}\nLink: {r['href']}"
        for r in results
    ])

# Phase 3: LLM Agentic Analysis
system_prompt = """
**Role:** Senior Business Intelligence Agent

**Objective:** Extract and verify:
- Company details (name, HQ address, phone, emails)
- Social media (LinkedIn, Twitter, Facebook, Instagram, etc.)
- **KEY CONTACTS** (CEO, executives, decision-makers) ← TOP PRIORITY
- Branch locations

**ZERO HALLUCINATION POLICY:**
- Only verified data from sources
- Return "Not Publicly Disclosed" for missing data
- NO fake emails (info@, contact@)
- Extract ALL executive names from LinkedIn snippets

**Output JSON Schema:**
{
  "company_details": {...},
  "social_media": {...},
  "key_decision_makers": [
    {
      "name": "...",
      "title": "...",
      "role_category": "Decision Maker|Technical Lead|Other",
      "email": "...",
      "linkedin": "...",
      "source": "Website|LinkedIn|Search"
    }
  ],
  "branches": [...]
}
"""

user_prompt = f"""
**Target Company:** {lead.company_name}
**Website:** {lead.website}

**SOURCE DATA 1: WEBSITE CONTENT**
{website_content[:20000]}

**SOURCE DATA 2: EXTERNAL VERIFICATION**
{search_context}

Extract the complete JSON profile now.
"""

response = await self.client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ],
    response_format={"type": "json_object"}
)

final_data = json.loads(response.choices[0].message.content)

# Phase 4: Data Mapping
lead.main_address = final_data["company_details"]["headquarters_address"]
lead.email_addresses = final_data["company_details"]["general_emails"]
lead.linkedin_url = final_data["social_media"]["linkedin"]

# Map executives
for contact in final_data["key_decision_makers"]:
    lead.key_contacts.append(PersonContact(
        full_name=contact["name"],
        designation=contact["title"],
        role_category=contact["role_category"],
        email=contact.get("email"),
        linkedin_url=contact.get("linkedin")
    ))

lead.enrichment_status = "enriched"
lead.confidence_score = 0.95 if len(lead.key_contacts) > 0 else 0.7

return lead
```

---

# 5. API Endpoints

### **File**: `app/api/endpoints.py`

## Available Endpoints

| Endpoint | Method | Purpose | Agent Used |
|----------|--------|---------|------------|
| `/api/lookup-company` | POST | Auto-fetch company URL & industry | CompanyLookupService |
| `/api/analyze` | POST | Analyze company & extract ICP | ResearchAgent |
| `/api/keywords` | POST | Generate buyer-intent keywords | DiscoveryAgent |
| `/api/strategy` | POST | Recommend lead gen channels | DiscoveryAgent |
| `/api/generate-leads` | POST | Generate & enrich leads (full workflow) | LeadGenerationAgent |
| `/api/generate-leads-stream` | POST | Stream leads as they're generated | LeadGenerationAgent |

### Detailed Endpoint Specs

#### 1. `POST /api/lookup-company`
```python
# Input
{
    "company_name": "Arizona Tile"
}

# Output
{
    "website": "https://arizonatile.com",
    "industry": "Building Materials & Tile Distribution",
    "error": null
}
```

#### 2. `POST /api/analyze`
```python
# Input
{
    "company_name": "Arizona Tile",
    "website": "https://arizonatile.com",
    "industry": "Building Materials",
    "existing_customers": "General contractors, architects",
    "sub_product": "Porcelain tiles"
}

# Output
{
    "company_summary": "...",
    "icp_profile": [...],
    "target_industries": [...],
    "usp": "...",
    "customer_pattern": {...},
    "confidence_score": 0.85
}
```

#### 3. `POST /api/keywords`
```python
# Input
{
    "icp_profile": ["General contractors", "Architects"],
    "target_industries": ["Construction"],
    "company_summary": "Premium tile supplier"
}

# Output
{
    "grouped_keywords": [
        {
            "category_name": "Transactional",
            "keywords": ["buy tiles wholesale", "tile suppliers"]
        }
    ]
}
```

#### 4. `POST /api/strategy`
```python
# Input
{
    "selected_keywords": ["tile suppliers", "stone distributors"],
    "company_summary": "Premium tile supplier",
    "target_industries": ["Construction"]
}

# Output
{
    "channels": [
        {"name": "Google Maps", "relevance_score": 95},
        {"name": "LinkedIn", "relevance_score": 85}
    ],
    "strategy_summary": "Google Maps is optimal..."
}
```

#### 5. `POST /api/generate-leads` (MAIN ENDPOINT)
```python
# Input
{
    "selected_channels": ["Google Maps"],
    "selected_keywords": ["restaurants", "hotels"],
    "target_industries": ["Hospitality"],
    "location": "Miami, FL",
    "max_leads_per_channel": 50,
    "company_summary": "..."
}

# Output
{
    "total_leads": 100,
    "leads_by_channel": {
        "Google Maps": 100
    },
    "companies": [
        {
            "company_name": "Joe's Pizza",
            "website": "https://joespizza.com",
            "location": "123 Ocean Dr, Miami, FL",
            "phone_numbers": [{"number": "+1-305-555-1234", "has_whatsapp": true}],
            "channel_source": "Google Maps",
            "keywords_matched": ["restaurants"],
            "key_contacts": [
                {
                    "full_name": "Joe Smith",
                    "designation": "Owner",
                    "role_category": "Decision Maker",
                    "email": "joe@joespizza.com",
                    "linkedin_url": "..."
                }
            ],
            "enrichment_status": "enriched",
            "confidence_score": 0.95
        }
    ],
    "generation_summary": "Generated 100 leads",
    "started_at": "2026-01-21T10:00:00Z",
    "completed_at": "2026-01-21T10:05:30Z"
}
```

---

# 6. Data Flow

## Complete Request-Response Cycle

```
┌─────────────┐
│   FRONTEND  │
│   (React)   │
└──────┬──────┘
       │ POST /api/generate-leads
       │ {channels: ["Google Maps"], keywords: ["restaurants"], location: "Miami"}
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ FASTAPI BACKEND (main.py + endpoints.py)                         │
│                                                                   │
│  1. Receives JSON request                                        │
│  2. Validates with Pydantic: LeadGenerationRequest               │
│  3. Routes to: lead_gen_agent.generate_leads(request)            │
└──────┬───────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ LEAD GENERATION AGENT                                            │
│                                                                   │
│  For channel "Google Maps":                                      │
│    ↓                                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ GOOGLE MAPS SCRAPER (Playwright)                        │    │
│  │                                                          │    │
│  │  1. Launches browser                                    │    │
│  │  2. Navigates to google.com/maps                        │    │
│  │  3. Searches "restaurants in Miami"                     │    │
│  │  4. Scrolls through all results                         │    │
│  │  5. Visits each business page                           │    │
│  │  6. Extracts: name, address, phone, website             │    │
│  │  7. Returns CompanyRecord objects                       │    │
│  └────────────┬────────────────────────────────────────────┘    │
│               │                                                   │
│               ▼                                                   │
│  Converts to: CompanyLead (channel_source="Google Maps")         │
│  Returns: [Lead1, Lead2, Lead3, ...]                             │
└──────┬───────────────────────────────────────────────────────────┘
       │
       │ For each discovered lead (parallel):
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ ENRICHMENT PHASE (per lead)                                      │
│                                                                   │
│  1. WEB SCRAPER → Scrapes company website                        │
│     Returns: 20K chars of content                                │
│                                                                   │
│  2. DUCKDUCKGO SEARCH → 7 verification queries (parallel)        │
│     Returns: Search results with executive info                  │
│                                                                   │
│  3. GPT-4o-mini ANALYSIS                                         │
│     Input: Website content + Search results                      │
│     Process: Extracts executives, emails, social media           │
│     Output: JSON with verified data                              │
│                                                                   │
│  4. DATA MAPPING                                                 │
│     Converts LLM JSON → CompanyLead with PersonContact[]         │
│                                                                   │
│  Returns: Enriched CompanyLead                                   │
└──────┬───────────────────────────────────────────────────────────┘
       │
       │ All enriched leads collected
       ▼
┌──────────────────────────────────────────────────────────────────┐
│ FASTAPI BACKEND                                                  │
│                                                                   │
│  Aggregates results:                                             │
│    total_leads = 100                                             │
│    leads_by_channel = {"Google Maps": 100}                       │
│    companies = [EnrichedLead1, EnrichedLead2, ...]               │
│                                                                   │
│  Returns: LeadGenerationResult (JSON)                            │
└──────┬───────────────────────────────────────────────────────────┘
       │
       │ HTTP 200 OK
       │ Content-Type: application/json
       ▼
┌─────────────┐
│   FRONTEND  │
│   Displays  │
│   Results   │
└─────────────┘
```

---

# 7. Integration Components

## 7.1 WebScraper Service

### **File**: `app/services/web_scraper.py`

### **Technology**: Playwright + BeautifulSoup + DuckDuckGo

### **Key Methods**:

#### `extract_contact_info(url) -> dict`
- Scrapes homepage, /about, /contact, /team, /locations
- Returns: emails, phones, addresses, website_content

#### `search(query, max_results=10) -> List[dict]`
- Uses DuckDuckGo Search API
- Returns: title, body (snippet), href

#### `extract_social_media_links(url) -> dict`
- Parses footer for social media links
- Returns: linkedin_url, twitter_url, facebook_url, etc.

## 7.2 GoogleMapsScraper

### **File**: `app/agents/google_maps.py`

### **Technology**: Playwright (headless Chromium)

### **Strategy**:
1. **Infinite Scroll** - Scrolls sidebar to load all results
2. **URL Harvesting** - Collects all business URLs first
3. **Parallel Extraction** - Visits 5-20 pages concurrently
4. **Smart Selectors** - Uses ARIA labels for resilience

### **Key Features**:
- Anti-detection (user agent, webdriver hiding)
- Cookie consent handling
- Retry logic (3 attempts)
- Scroll limits (200 max, 3-scroll stagnation exit)
- Resource blocking (images, fonts, CSS disabled on detail pages)

## 7.3 CompanyLookupService

### **File**: `app/services/company_lookup.py`

### **Purpose**: Auto-fetch company website & industry

### **Flow**:
1. Searches DuckDuckGo: "{company_name} official website"
2. Filters results (excludes LinkedIn, Facebook, Wikipedia)
3. GPT-4o-mini classifies industry based on snippet
4. Returns: website URL + industry

---

# 8. Complete Workflow Examples

## Example 1: Generate Leads for "Arizona Tile"

### Step 1: Company Research
```bash
POST /api/analyze
{
    "company_name": "Arizona Tile",
    "website": "https://arizonatile.com",
    "industry": "Building Materials",
    "existing_customers": "General contractors in Phoenix, AZ"
}
```

**Response**:
```json
{
    "icp_profile": ["General contractors", "Architects"],
    "target_industries": ["Construction", "Architecture"],
    "customer_pattern": {
        "common_industries": ["Construction"],
        "geographic_focus": "Southwest US"
    }
}
```

### Step 2: Keyword Discovery
```bash
POST /api/keywords
{
    "icp_profile": ["General contractors", "Architects"],
    "target_industries": ["Construction"],
    "company_summary": "Premium tile supplier"
}
```

**Response**:
```json
{
    "grouped_keywords": [
        {
            "category_name": "Transactional",
            "keywords": [
                "tile suppliers near me",
                "buy porcelain tiles wholesale",
                "natural stone distributors"
            ]
        }
    ]
}
```

### Step 3: Channel Strategy
```bash
POST /api/strategy
{
    "selected_keywords": ["tile suppliers", "general contractors"],
    "company_summary": "Premium tile supplier",
    "target_industries": ["Construction"]
}
```

**Response**:
```json
{
    "channels": [
        {"name": "Google Maps", "relevance_score": 95},
        {"name": "LinkedIn", "relevance_score": 80}
    ]
}
```

### Step 4: Generate Leads
```bash
POST /api/generate-leads
{
    "selected_channels": ["Google Maps"],
    "selected_keywords": ["general contractors", "architecture firms"],
    "target_industries": ["Construction"],
    "location": "Phoenix, AZ",
    "max_leads_per_channel": 50,
    "company_summary": "Arizona Tile is a premium tile supplier"
}
```

**Process** (behind the scenes):
1. ✅ Google Maps scraper launches
2. ✅ Searches "general contractors in Phoenix, AZ"
3. ✅ Finds 50 businesses on Google Maps
4. ✅ For each business:
   - Scrapes name, address, phone, website from Google Maps
   - Visits their website and scrapes content
   - Runs 7 DuckDuckGo searches for verification
   - Sends to GPT-4o-mini for enrichment
   - Extracts executives, emails, social profiles
5. ✅ Returns 50 enriched leads

**Sample Response**:
```json
{
    "total_leads": 50,
    "leads_by_channel": {"Google Maps": 50},
    "companies": [
        {
            "company_name": "Phoenix Builders Inc.",
            "website": "https://phoenixbuilders.com",
            "location": "1234 Central Ave, Phoenix, AZ 85004",
            "phone_numbers": [
                {"number": "+1-602-555-1234", "has_whatsapp": true}
            ],
            "channel_source": "Google Maps",
            "keywords_matched": ["general contractors"],
            "key_contacts": [
                {
                    "full_name": "John Smith",
                    "designation": "CEO & Founder",
                    "role_category": "Decision Maker",
                    "email": "john@phoenixbuilders.com",
                    "linkedin_url": "linkedin.com/in/johnsmith",
                    "data_source": "LinkedIn"
                }
            ],
            "email_addresses": ["info@phoenixbuilders.com"],
            "linkedin_url": "linkedin.com/company/phoenix-builders",
            "enrichment_status": "enriched",
            "confidence_score": 0.95,
            "discovered_at": "2026-01-21T10:00:00Z"
        }
        // ... 49 more leads
    ]
}
```

---

## Summary

This backend system is a **multi-agent AI orchestration platform** that:

1. ✅ **Analyzes companies** using GPT-4o-mini (ResearchAgent)
2. ✅ **Generates keywords** using GPT-4o-mini (DiscoveryAgent)
3. ✅ **Scrapes Google Maps** using Playwright (GoogleMapsScraper)
4. ✅ **Enriches leads** using GPT-4o-mini + multi-source verification (LeadGenerationAgent)
5. ✅ **Returns structured data** via FastAPI REST endpoints

### Key Technologies:
- **LLM**: OpenAI GPT-4o-mini (all agents)
- **Web Scraping**: Playwright (Google Maps + websites)
- **Search**: DuckDuckGo Search API
- **Framework**: FastAPI + Pydantic
- **Async**: asyncio + AsyncOpenAI

### Models in Action:
- **GPT-4o-mini** is the ONLY LLM used across all 3 agents
- Configured via environment variables (`OPENAI_API_KEY`, `OPENAI_MODEL`)
- Used for: analysis, keyword generation, channel recommendation, and lead enrichment
- Always returns structured JSON using `response_format={"type": "json_object"}`

**End of Documentation** 🎉
