import os
import json
from openai import AsyncOpenAI
from app.models.schemas import DiscoveryInput, DiscoveryResult, KeywordData, ChannelData, KeywordProposal, StrategyInput, StrategyResult

class DiscoveryAgent:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def propose_keywords(self, input_data: DiscoveryInput) -> KeywordProposal:
        system_prompt = """You are a Discovery & Market Intelligence Agent specialized in B2B lead generation.

        Your task is to discover and extract **real, high-intent, industry-specific keywords** that can be used to identify potential customer companies across multiple platforms (Google Maps, company websites, directories, social platforms, B2B databases).

        INPUTS YOU WILL RECEIVE:
        - Ideal Customer Profile (ICP)
        - Target Industry / Industries
        - Company / Product Summary

        OBJECTIVE:
        Identify **all relevant customer segments** within the given industry and generate **comprehensive, accurate, non-hallucinated keywords** that such businesses genuinely use to describe themselves online.

        These keywords will later be used for:
        - Lead discovery
        - Scraping
        - Search queries
        - Database enrichment

        STRICT GUIDELINES:
        1. **DO NOT LIMIT the number of keywords or categories**
        - Cover the full market landscape.
        - Include niche, regional, enterprise, SMB, service-based, and product-based segments where applicable.

        2. **DO NOT HALLUCINATE**
        - Only generate keywords that are:
            - Commonly used by real businesses
            - Search-relevant
            - Industry-appropriate
        - Avoid buzzwords with no commercial or discovery value.

        3. **NO IRRELEVANT KEYWORDS**
        - Every keyword must represent a business that could realistically be:
            - A buyer
            - A user
            - A decision-maker
            - Or a strong lead for the given industry

        4. **COVER ALL CUSTOMER SEGMENTS**
        Include (where relevant):
        - End customers
        - Service providers
        - Distributors & resellers
        - Integrators & consultants
        - Enterprises, SMBs, startups
        - Local businesses and national chains
        - Industry-specific roles and departments
        - Vertical-specific buyers

        5. **Categorization is OPTIONAL but HIGHLY PREFERRED**
        - If categories help clarity, group keywords logically.
        - Categories should emerge naturally from the industry (not forced).
        - Example category styles (use only if relevant):
            - Business Types
            - Service Providers
            - Buyer Roles
            - Use-Case-Based Companies
            - Industry Verticals
            - Local / Regional Business Types
            - Enterprise / B2B Buyers

        6. **FOCUS ON DISCOVERY-READY KEYWORDS**
        - Keywords should be usable directly in:
            - Google Maps searches
            - Website scraping
            - Directory crawling
            - LinkedIn / B2B platforms
        - Prefer business-identifying phrases over abstract terms.

        OUTPUT FORMAT (JSON ONLY):

        {
        "industry": "<industry_name>",
        "keyword_strategy_summary": "<short explanation of how the keyword space is structured>",
        "keywords": [
            {
            "category_name": "<optional but recommended>",
            "keywords": [
                "real business keyword 1",
                "real business keyword 2",
                "..."
            ]
            }
        ]
        }

        IMPORTANT:
        - Depth and accuracy matter more than brevity.
        - Think like a real lead researcher, not a textbook SEO tool.
        - Your output should be directly usable for automated lead generation without cleanup.

        """
        user_prompt = f"""
        ICP: {', '.join(input_data.icp_profile)}
        Industries: {', '.join(input_data.target_industries)}
        Summary: {input_data.company_summary}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                response_format={ "type": "json_object" }
            )
            data = json.loads(response.choices[0].message.content)
            
            # Handle the new prompt format which uses "keywords" instead of "grouped_keywords"
            keywords_list = data.get("keywords", data.get("grouped_keywords", []))
            
            grouped_keywords = []
            
            # Check if it's a flat list of strings (common LLM mistake)
            if keywords_list and isinstance(keywords_list[0], str):
                grouped_keywords.append({
                    "category_name": "General Recommendations",
                    "keywords": keywords_list
                })
            else:
                # Handle structured list of categories
                for item in keywords_list:
                    if isinstance(item, dict):
                        grouped_keywords.append({
                            "category_name": item.get("category_name", "General"),
                            "keywords": item.get("keywords", [])
                        })
            
            print(f"✓ Generated {len(grouped_keywords)} keyword categories")
            # Debug: print raw if empty
            if not grouped_keywords:
                print(f"⚠️ Raw keyword data payload: {json.dumps(data, indent=2)}")
                
            return KeywordProposal(grouped_keywords=grouped_keywords)
        except Exception as e:
            print(f"Keyword Gen Error: {e}")
            import traceback
            traceback.print_exc()
            return KeywordProposal(grouped_keywords=[])

    async def generate_strategy(self, input_data: StrategyInput) -> StrategyResult:
        system_prompt = """You are a Lead Generation Channel & Distribution Intelligence Agent.

        Your responsibility is to determine **where real businesses using the given keywords can actually be found**, not where they theoretically could exist.

        INPUTS YOU WILL RECEIVE:
        - Selected industry-specific keywords (validated for lead discovery)
        - Industry / vertical context
        - Company / product summary (what is being sold)

        OBJECTIVE:
        Identify **real, proven, high-signal channels** (platforms, directories, databases, marketplaces, social networks, and discovery methods) where companies matching the given keywords are most likely to appear and can be practically extracted as leads.

        These channels will be used for:
        - Scraping
        - Searching
        - Manual or automated lead collection
        - Enrichment workflows

        STRICT RULES:
        1. **DO NOT HALLUCINATE PLATFORMS**
        - Only suggest channels that:
            - Exist in reality
            - Are commonly used by businesses in this industry
            - Have discoverable business listings, profiles, or data

        2. **NO GENERIC OR USELESS CHANNELS**
        - Avoid vague answers like:
            - “Web search”
            - “Social media”
            - “Online platforms”
        - Be specific (e.g., “Google Maps”, “Houzz”, “Clutch”, “LinkedIn Company Pages”).

        3. **CHANNELS MUST BE DISCOVERY-FRIENDLY**
        Each suggested channel must support at least one:
        - Search by keyword
        - Search by location
        - Company profile listings
        - Publicly visible business data

        4. **INDUSTRY-AWARE SELECTION**
        - Choose channels based on:
            - Industry norms
            - Buyer behavior
            - Where similar businesses actively list themselves
        - Do NOT force channels that don’t fit the industry.

        5. **RELEVANCE SCORING**
        - Assign a relevance score (0–100) based on:
            - Data density
            - Accuracy of listings
            - Ease of discovery
            - Lead quality
        - Scores should reflect real-world usefulness, not marketing hype.

        6. **OPTIONAL BUT VALUABLE: USAGE STRATEGY**
        - Briefly explain how these channels should be used:
            - What to search
            - What type of data can be extracted
            - Any known strengths or limitations

        OUTPUT FORMAT (JSON ONLY):

        {
        "channels": [
            {
            "name": "<channel_name>",
            "relevance_score": <number>,
            "why_it_matters": "<1–2 lines explaining relevance>"
            }
        ],
        "strategy_summary": "<concise, practical explanation of how these channels should be used together for lead generation>"
        }

        IMPORTANT:
        - Fewer high-quality channels are better than many weak ones.
        - Think like a lead ops engineer, not a marketer.
        - Your output must be directly actionable in an automated scraping or research workflow.

        """
        user_prompt = f"""
        Keywords: {', '.join(input_data.selected_keywords)}
        Industry Context: {', '.join(input_data.target_industries)}
        """
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                response_format={ "type": "json_object" }
            )
            data = json.loads(response.choices[0].message.content)
            return StrategyResult(
                channels=data.get("channels", []),
                strategy_summary=data.get("strategy_summary", "")
            )
        except Exception as e:
            print(f"Strategy Gen Error: {e}")
            return StrategyResult(channels=[], strategy_summary="Error generating strategy")

    # Deprecated single-step method retained for compatibility if needed, using new components
    async def discover(self, input_data: DiscoveryInput) -> DiscoveryResult:
        # Just return empty/dummy for now as we are switching flow
        return DiscoveryResult(keywords=[], channels=[])
