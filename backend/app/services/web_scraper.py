from duckduckgo_search import DDGS
import httpx
from bs4 import BeautifulSoup
import asyncio

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
                    for script in soup(["script", "style", "nav", "footer", "header"]):
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
