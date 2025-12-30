from duckduckgo_search import DDGS
import httpx
from bs4 import BeautifulSoup
import asyncio
import re
from typing import Dict, Optional

class WebScraper:
    def __init__(self):
        self.ddgs = DDGS()

    def search(self, query: str, max_results: int = 3):
        try:
            results = self.ddgs.text(query, max_results=max_results)
            return results
        except Exception as e:
            print(f"Search error: {e}")
            return []

    async def get_content(self, url: str):
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            try:
                resp = await client.get(url, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    # Strip script and style elements
                    for script in soup(["script", "style"]):
                        script.extract()
                    text = soup.get_text()
                    lines = (line.strip() for line in text.splitlines())
                    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                    text = '\n'.join(chunk for chunk in chunks if chunk)
                    return text[:8000] # Truncate to reasonable context window
            except Exception as e:
                print(f"Error fetching {url}: {e}")
                return ""
        return ""
    
    async def extract_social_media_links(self, url: str) -> Dict[str, Optional[str]]:
        """
        Extract social media links directly from HTML by parsing href attributes.
        This is more reliable than asking LLM to extract from text.
        """
        social_links = {
            'linkedin_url': None,
            'twitter_url': None,
            'facebook_url': None,
            'instagram_url': None,
            'youtube_url': None,
            'github_url': None
        }
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            try:
                resp = await client.get(url, headers=headers, timeout=10.0)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    
                    # Find all links
                    all_links = soup.find_all('a', href=True)
                    
                    for link in all_links:
                        href = link['href'].lower()
                        
                        # LinkedIn
                        if 'linkedin.com/company/' in href or 'linkedin.com/in/' in href:
                            if not social_links['linkedin_url']:
                                # Clean up the URL
                                clean_url = link['href'].split('?')[0]  # Remove query params
                                social_links['linkedin_url'] = clean_url
                        
                        # Twitter/X
                        elif 'twitter.com/' in href or 'x.com/' in href:
                            if not social_links['twitter_url'] and '/status/' not in href:
                                clean_url = link['href'].split('?')[0]
                                social_links['twitter_url'] = clean_url
                        
                        # Facebook
                        elif 'facebook.com/' in href:
                            if not social_links['facebook_url'] and '/sharer/' not in href:
                                clean_url = link['href'].split('?')[0]
                                social_links['facebook_url'] = clean_url
                        
                        # Instagram
                        elif 'instagram.com/' in href:
                            if not social_links['instagram_url'] and '/p/' not in href:
                                clean_url = link['href'].split('?')[0]
                                social_links['instagram_url'] = clean_url
                        
                        # YouTube
                        elif 'youtube.com/' in href or 'youtu.be/' in href:
                            if not social_links['youtube_url'] and '/watch' not in href:
                                clean_url = link['href'].split('?')[0]
                                social_links['youtube_url'] = clean_url
                        
                        # GitHub
                        elif 'github.com/' in href:
                            if not social_links['github_url']:
                                clean_url = link['href'].split('?')[0]
                                social_links['github_url'] = clean_url
                    
                    print(f"Extracted social media links: {social_links}")
                    
            except Exception as e:
                print(f"Error extracting social links from {url}: {e}")
        
        return social_links
