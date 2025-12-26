import os
import json
from openai import AsyncOpenAI
from app.models.schemas import CompanyInput, ResearchResult
from app.services.web_scraper import WebScraper

class ResearchAgent:
    def __init__(self):
        self.scraper = WebScraper()
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def analyze(self, input_data: CompanyInput) -> ResearchResult:
        url = input_data.website
        
        # If URL is missing, search for it
        if not url:
            print(f"Searching for URL for {input_data.company_name}...")
            results = self.scraper.search(f"{input_data.company_name} official site", max_results=1)
            if results:
                url = results[0]['href']
                print(f"Found URL: {url}")
        
        content = ""
        if url:
            print(f"Scraping {url}...")
            content = await self.scraper.get_content(url)
        
        if not content:
            print("Content fetch failed or empty.")
            # Fallback or just analyze name
        
        system_prompt = """You are a Expert Market Research Agent. 
        Analyze the provided company website content.
        Extract the following fields in JSON format:
        - company_summary: A concise, professional summary.
        - icp_profile: A list of Ideal Customer Profiles (e.g. "Enterprise SaaS Companies", "Dental Clinics").
        - target_industries: A list of industries they sell to.
        - target_companies: A list of specific company examples they likely target (e.g. "Google", "Marriott", "Local Contractors").
        - usp: Their Unique Selling Proposition.
        - pain_points: A list of customer pain points they address.
        
        Be strictly factual based on the content.
        """
        
        user_prompt = f"""
        Analyze this company:
        Name: {input_data.company_name}
        Industry: {input_data.industry}
        Existing Customers: {input_data.existing_customers}
        Content:
        {content[:6000]}
        """
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={ "type": "json_object" }
            )
            
            data = json.loads(response.choices[0].message.content)
            
            return ResearchResult(
                company_name=input_data.company_name,
                company_summary=data.get("company_summary", "Analysis unavailable."),
                icp_profile=data.get("icp_profile", []),
                target_industries=data.get("target_industries", []),
                target_companies=data.get("target_companies", []),
                usp=data.get("usp", ""),
                pain_points=data.get("pain_points", []),
                sources=[url] if url else ["No source found"],
                confidence_score=0.85 if content else 0.4
            )
        except Exception as e:
            print(f"Error in LLM analysis: {e}")
            return ResearchResult(
                company_name=input_data.company_name,
                company_summary="Error during analysis.",
                icp_profile=[],
                target_industries=[],
                target_companies=[],
                usp="",
                pain_points=[],
                sources=[],
                confidence_score=0.0
            )
