"""
Company Lookup Service
Fetches company URL and industry using DuckDuckGo search and OpenAI
"""

import os
import re
import json
import asyncio
from typing import Optional
from openai import AsyncOpenAI
from duckduckgo_search import DDGS
from dotenv import load_dotenv

load_dotenv()


class CompanyLookupService:
    """Service to auto-fetch company URL and industry from search engines."""

    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def lookup_company(self, company_name: str) -> dict:
        """
        Look up company information using search engines.
        
        Args:
            company_name: The name of the company to look up
            
        Returns:
            dict with website and industry
        """
        if not company_name or len(company_name.strip()) < 2:
            return {"website": None, "industry": None, "error": "Company name too short"}

        try:
            # Step 1: Search for the company using DuckDuckGo (run in thread to avoid blocking)
            search_results = await self._search_company(company_name)
            
            if not search_results:
                return {"website": None, "industry": None, "error": "No search results found"}

            # Step 2: Use OpenAI to extract the official website and industry
            result = await self._extract_company_info(company_name, search_results)
            
            return result

        except Exception as e:
            print(f"Company lookup error: {e}")
            return {"website": None, "industry": None, "error": str(e)}

    async def _search_company(self, company_name: str) -> list:
        """Search for company information using DuckDuckGo."""
        
        def _sync_search():
            """Synchronous search function to run in thread."""
            try:
                with DDGS() as ddgs:
                    # Search for company official website
                    results = list(ddgs.text(
                        f"{company_name} official website company",
                        max_results=8
                    ))
                    
                    # Also search for company industry/about
                    industry_results = list(ddgs.text(
                        f"{company_name} company industry about what does",
                        max_results=5
                    ))
                    
                    return results + industry_results
            except Exception as e:
                print(f"DuckDuckGo search error: {e}")
                return []
        
        # Run synchronous DDGS in a thread to avoid blocking the event loop
        try:
            return await asyncio.to_thread(_sync_search)
        except Exception as e:
            print(f"Async search wrapper error: {e}")
            return []

    async def _extract_company_info(self, company_name: str, search_results: list) -> dict:
        """Use OpenAI to extract the official website and industry from search results."""
        
        # Format search results for the prompt
        formatted_results = ""
        for i, result in enumerate(search_results[:10], 1):
            title = result.get("title", "")
            url = result.get("href", "")
            body = result.get("body", "")
            formatted_results += f"\n{i}. Title: {title}\n   URL: {url}\n   Description: {body}\n"

        prompt = f"""You are a research assistant. Based on the following search results for the company "{company_name}", extract:
1. The official website URL of the company (not a news article, not LinkedIn, not a directory listing - the company's actual official website)
2. The industry/sector the company operates in

Search Results:
{formatted_results}

Important Rules:
- For the website, find the company's PRIMARY official domain (e.g., company.com, not linkedin.com/company/...)
- If the company name appears in the domain, that's likely the official site
- For industry, be specific but concise (e.g., "Countertops & Stone Surfaces", "SaaS", "E-commerce", "Construction")
- If you cannot determine with confidence, return null

Respond in this exact JSON format only, no other text:
{{"website": "https://example.com" or null, "industry": "Industry Name" or null}}
"""

        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that extracts company information from search results. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=200
            )
            
            content = response.choices[0].message.content.strip()
            
            # Clean up the response - remove markdown code blocks if present
            if content.startswith("```"):
                content = re.sub(r'^```(?:json)?\n?', '', content)
                content = re.sub(r'\n?```$', '', content)
            
            # Parse the JSON response
            result = json.loads(content)
            
            # Validate website URL format
            website = result.get("website")
            if website and not website.startswith(("http://", "https://")):
                website = "https://" + website
            
            return {
                "website": website,
                "industry": result.get("industry"),
                "error": None
            }

        except Exception as e:
            print(f"OpenAI extraction error: {e}")
            # Fallback: Try to extract website from search results directly
            return self._fallback_extraction(company_name, search_results)

    def _fallback_extraction(self, company_name: str, search_results: list) -> dict:
        """Fallback method to extract company info without AI."""
        from urllib.parse import urlparse
        
        company_lower = company_name.lower().replace(" ", "")
        
        website = None
        for result in search_results:
            url = result.get("href", "")
            # Skip social media and directories
            skip_domains = ["linkedin.com", "facebook.com", "twitter.com", "instagram.com", 
                          "yelp.com", "yellowpages.com", "wikipedia.org", "crunchbase.com"]
            if any(domain in url.lower() for domain in skip_domains):
                continue
            
            # Check if company name appears in domain
            parsed = urlparse(url)
            domain = parsed.netloc.lower().replace("www.", "")
            
            # Simple match - if company name words appear in domain
            name_parts = company_name.lower().split()
            if any(part in domain for part in name_parts if len(part) > 2):
                website = f"{parsed.scheme}://{parsed.netloc}"
                break
        
        return {
            "website": website,
            "industry": None,  # Can't reliably determine without AI
            "error": None if website else "Could not determine official website"
        }


# Singleton instance
company_lookup_service = CompanyLookupService()

