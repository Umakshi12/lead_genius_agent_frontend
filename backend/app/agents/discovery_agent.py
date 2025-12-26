import os
import json
from openai import AsyncOpenAI
from app.models.schemas import DiscoveryInput, DiscoveryResult, KeywordData, ChannelData, KeywordProposal, StrategyInput, StrategyResult

class DiscoveryAgent:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def propose_keywords(self, input_data: DiscoveryInput) -> KeywordProposal:
        system_prompt = """You are a SEO & Lead Data Strategist.
        Based on the provided ICP and Industry, generate a comprehensive list of high-intent keywords.
        Group them into logical categories meaningful for B2B searching.
        
        Example Categories: "Professional Roles", "Company Types", "Service Offerings", "Project Types", "Industry Verticals".
        
        Output JSON format:
        {
            "grouped_keywords": [
                { "category_name": "Professional Roles", "keywords": ["Architects", "Designers", ...] },
                ...
            ]
        }
        
        IMPORTANT: Limit to 3-5 distinct categories.
        For each category, provide ONLY 3-4 high-value keywords.
        Do NOT overwhelm the user with too many options.
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
            # Validate structured output
            return KeywordProposal(**data)
        except Exception as e:
            print(f"Keyword Gen Error: {e}")
            return KeywordProposal(grouped_keywords=[])

    async def generate_strategy(self, input_data: StrategyInput) -> StrategyResult:
        system_prompt = """You are a Lead Generation Channel Expert.
        Based on the SELECTED keywords, identify the specific channels (Platforms, Directories, Methods) to find these leads.
        
        Output JSON:
        {
            "channels": [
                {"name": "LinkedIn Sales Nav", "relevance_score": 95},
                {"name": "Houzz", "relevance_score": 88}
            ],
            "strategy_summary": "Brief explanation of how to use these channels..."
        }
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
