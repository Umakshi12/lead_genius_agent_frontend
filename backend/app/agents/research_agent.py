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
        social_media_links = {}
        contact_info = {}
        
        if url:
            print(f"Scraping {url}...")
            content = await self.scraper.get_content(url)
            
            # STEP 1: Extract social media links directly from HTML
            print(f"Extracting social media links from {url}...")
            social_media_links = await self.scraper.extract_social_media_links(url)
            
            # STEP 1.5: Extract contact info (addresses, phones, emails, branches)
            print(f"Extracting contact information from {url}...")
            contact_info = await self.scraper.extract_contact_info(url)
        
        if not content:
            print("Content fetch failed or empty.")
        
        # STEP 2: Scrape content from social media profiles for richer analysis
        social_content = {}
        print(f"Found social media accounts: {social_media_links}")
        
        for platform, social_url in social_media_links.items():
            if social_url:
                platform_name = platform.replace('_url', '').title()
                print(f"Scraping {platform_name} profile: {social_url}")
                try:
                    social_text = await self.scraper.get_content(social_url)
                    if social_text:
                        social_content[platform_name] = social_text[:2000]  # Limit per platform
                        print(f"✓ Scraped {len(social_text)} chars from {platform_name}")
                except Exception as e:
                    print(f"Error scraping {platform_name}: {e}")
        
        # STEP 3: Enhanced system prompt for comprehensive analysis
        system_prompt = """You are an Expert Market Research Agent. 
        Analyze the provided company website content AND social media profiles.
        
        Extract the following fields in JSON format:
        - company_summary: A comprehensive summary based on website AND social media presence. 
          Include insights from their social media activity, recent posts, engagement style, brand voice, and company culture.
        - icp_profile: A list of Ideal Customer Profiles - types of businesses/organizations that would BUY from this company 
        - target_industries: A list of industries where their CUSTOMERS operate (NOT the company's own industry).
        - target_companies: A list of SPECIFIC REAL COMPANY NAMES that are POTENTIAL CUSTOMERS - businesses that could 
          BUY this company's products/services. These should be PROSPECTS, not competitors!
          For example: If analyzing a countertop supplier, list construction companies, design firms, builders, 
          renovation contractors - NOT other countertop brands like Caesarstone or Cambria.
          Provide 5-10 real company names that match the ICP profile.
        - usp: Their Unique Selling Proposition (consider both website and social media messaging).
        - pain_points: A list of customer pain points they address.
        
        CRITICAL: target_companies must be POTENTIAL BUYERS/CUSTOMERS, not competitors or similar businesses!
        
        Use insights from social media to enrich your understanding of:
        - Company culture, values, and brand personality
        - Recent achievements, announcements, and milestones
        - Customer engagement, testimonials, and community feedback
        - Product updates, features, and innovations
        - Industry thought leadership and expertise
        - Team highlights and company growth
        
        Be strictly factual based on the content provided.
        """
        
        # Build comprehensive user prompt with website + social media content
        user_prompt = f"""
        Analyze this company:
        Name: {input_data.company_name}
        Industry: {input_data.industry}
        Existing Customers (use these as reference to find MORE companies like them): {input_data.existing_customers}
        
        IMPORTANT for target_companies field:
        - These should be POTENTIAL CUSTOMERS / PROSPECTS - companies that could BUY from {input_data.company_name}
        - DO NOT list competitors or companies in the same business as {input_data.company_name}
        - If existing customers are mentioned, find OTHER companies similar to those customers
        - If no existing customers provided, suggest real company names that match the ICP profiles
        
        
        === WEBSITE CONTENT ===
        {content[:5000]}
        
        === SOCIAL MEDIA INSIGHTS ===
        """
        
        # Add social media content to prompt
        if social_content:
            for platform, text in social_content.items():
                user_prompt += f"\n--- {platform} Profile ---\n{text}\n"
        else:
            user_prompt += "\nNo social media content available.\n"
        
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
                confidence_score=0.85 if content else 0.4,
                # Contact information (auto-extracted from website)
                main_address=contact_info.get("main_address"),
                phone_numbers=contact_info.get("phone_numbers", []),
                email_addresses=contact_info.get("email_addresses", []),
                branches=contact_info.get("branches", []),
                # Social media links (auto-extracted from website footer)
                linkedin_url=social_media_links.get("linkedin_url"),
                twitter_url=social_media_links.get("twitter_url"),
                facebook_url=social_media_links.get("facebook_url"),
                instagram_url=social_media_links.get("instagram_url"),
                youtube_url=social_media_links.get("youtube_url"),
                github_url=social_media_links.get("github_url"),
                whatsapp_url=social_media_links.get("whatsapp_url"),
                tiktok_url=social_media_links.get("tiktok_url"),
                pinterest_url=social_media_links.get("pinterest_url"),
                snapchat_url=social_media_links.get("snapchat_url"),
                threads_url=social_media_links.get("threads_url"),
                tripadvisor_url=social_media_links.get("tripadvisor_url")
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
