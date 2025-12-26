# Lead Genius Agent - Implementation Plan

## 1. Architecture Overview

We will adopt a **Modern Monorepo** structure ensuring separation of concerns while keeping the codebase unified.

**Structure:**
```
/
├── frontend/          # Next.js 14 (App Router), TailwindCSS, TypeScript
├── backend/           # FastAPI, Python 3.11+, PydanticAI / LangChain
└── docker-compose.yml # For local orchestration
```

### Backend (Intelligent Core)
- **Framework**: FastAPI (High performance, easy async support for agents).
- **AI Engine**: OpenAI API (GPT-4o or similar).
- **Agent Orchestration**: Modular agent architecture.
  - `StrategicResearchAgent`: Web scraping (Firecrawl/Tavily or similar if available, otherwise `beautifulsoup` + `requests`) + LLM Analysis.
  - `DiscoveryAgent`: Keyword expansion + Channel mapping.
- **Database**: SQLite (for MVP/Embedded) or PostgreSQL (Production). We will use a simple in-memory or file-based JSON store for this session to keep it lightweight unless persistence is strictly required (User mentioned "Dashboard", so simple persistence is needed).
- **Search/Scraping**: We will use a combination of Search Tools (e.g., DuckDuckGo search) and Scrapers.

### Frontend (Premium UI/UX)
- **Framework**: Next.js 14.
- **Styling**: TailwindCSS (Vibrant colors, Glassmorphism, Dark mode default).
- **State Management**: React Query (TanStack Query) for async data fetching.
- **UI Components**: Radix UI primitives or similar accessible base, styled for "Wow" factor.

## 2. Agent Workflow

### Agent 1: Strategic Research
1. **Input**: URL, Company Name.
2. **Process**:
   - `search_web(query=f"{company_name} site:{domain}")` to verify.
   - `craw_site(url)` (Simulated or via simple scraper) to get text content.
   - `analyze_content(llm)`: Extract USP, Persona, Pain points.
3. **Output**: JSON object with ICP, Industry, Summary.

### Agent 2: Keyword & Channel Discovery
1. **Input**: ICP, Industry (from Agent 1, confirmed by User).
2. **Process**:
   - `generate_keywords(llm)`: Brainstorm intent-based keywords.
   - `map_channels(llm)`: Identify best platforms (LinkedIn, Google, etc.).
3. **Output**: JSON object with Keywords (scored) and Channels.

## 3. Step-by-Step Implementation

1. **Scaffold**: Create `frontend` and `backend` directories.
2. **Backend Setup**:
   - Install FastAPI, Uvicorn, OpenAI, HTTPX.
   - Create `Agent` abstract base class.
   - Implement `ResearchAgent` and `DiscoveryAgent`.
   - Expose endpoints: `/api/research`, `/api/discovery`.
3. **Frontend Setup**:
   - Initialize Next.js project.
   - Design Global CSS (Theming, Typography - Inter/Outfit).
   - Create `Onboarding` Component (Input).
   - Create `AnalysisResult` Component (Editable Fields).
   - Create `DiscoveryResult` Component (Tables/Cards).
4. **Integration**: Connect Frontend to Backend.
5. **Refinement**: UI Polish (Animations, Transitions).

## 4. Environment Variables
- `OPENAI_API_KEY`: Required for agents.
- `BACKEND_URL`: For frontend to connect.
