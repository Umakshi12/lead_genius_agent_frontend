from duckduckgo_search import DDGS
import httpx
from bs4 import BeautifulSoup
import asyncio
import re
from typing import Dict, Optional

class WebScraper:
    def __init__(self):
        # Don't create persistent DDGS instance - create fresh one per search
        pass

    def search(self, query: str, max_results: int = 3):
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))
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
        Prioritizes footer links as they typically contain official social profiles.
        """
        social_links = {
            'linkedin_url': None,
            'twitter_url': None,
            'facebook_url': None,
            'instagram_url': None,
            'youtube_url': None,
            'github_url': None,
            'whatsapp_url': None,
            'tiktok_url': None,
            'pinterest_url': None,
            'snapchat_url': None,
            'threads_url': None,
            'tripadvisor_url': None,
        }
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            try:
                resp = await client.get(url, headers=headers, timeout=15.0)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    
                    # Priority 1: Look for links in footer first (most reliable)
                    footer_elements = soup.find_all(['footer', 'div', 'section'], 
                        class_=lambda x: x and any(f in x.lower() for f in ['footer', 'foot', 'bottom', 'social']))
                    
                    # Priority 2: Also check header and nav for social links
                    header_elements = soup.find_all(['header', 'nav', 'div'], 
                        class_=lambda x: x and any(h in str(x).lower() for h in ['header', 'nav', 'social', 'top']))
                    
                    # Combine priority elements with all links as fallback
                    priority_links = []
                    for elem in footer_elements + header_elements:
                        priority_links.extend(elem.find_all('a', href=True))
                    
                    # Fallback to all links if none found in priority areas
                    all_links = soup.find_all('a', href=True)
                    
                    # Process priority links first, then all links
                    links_to_process = priority_links + [l for l in all_links if l not in priority_links]
                    
                    for link in links_to_process:
                        href = link.get('href', '').lower()
                        original_href = link.get('href', '')
                        
                        # LinkedIn
                        if ('linkedin.com/company/' in href or 'linkedin.com/in/' in href) and not social_links['linkedin_url']:
                            clean_url = original_href.split('?')[0]
                            social_links['linkedin_url'] = self._normalize_url(clean_url)
                        
                        # Twitter/X
                        elif ('twitter.com/' in href or 'x.com/' in href) and not social_links['twitter_url']:
                            if '/status/' not in href and '/intent/' not in href and '/share' not in href:
                                clean_url = original_href.split('?')[0]
                                social_links['twitter_url'] = self._normalize_url(clean_url)
                        
                        # Facebook
                        elif 'facebook.com/' in href and not social_links['facebook_url']:
                            if '/sharer/' not in href and '/share' not in href and '/plugins/' not in href:
                                clean_url = original_href.split('?')[0]
                                social_links['facebook_url'] = self._normalize_url(clean_url)
                        
                        # Instagram
                        elif 'instagram.com/' in href and not social_links['instagram_url']:
                            if '/p/' not in href and '/reel/' not in href:
                                clean_url = original_href.split('?')[0]
                                social_links['instagram_url'] = self._normalize_url(clean_url)
                        
                        # YouTube
                        elif ('youtube.com/' in href or 'youtu.be/' in href) and not social_links['youtube_url']:
                            if '/watch' not in href and '/embed/' not in href:
                                clean_url = original_href.split('?')[0]
                                social_links['youtube_url'] = self._normalize_url(clean_url)
                        
                        # GitHub
                        elif 'github.com/' in href and not social_links['github_url']:
                            clean_url = original_href.split('?')[0]
                            social_links['github_url'] = self._normalize_url(clean_url)
                        
                        # WhatsApp - multiple formats
                        elif ('wa.me/' in href or 'whatsapp.com/' in href or 'api.whatsapp.com/' in href) and not social_links['whatsapp_url']:
                            social_links['whatsapp_url'] = original_href
                        
                        # TikTok
                        elif 'tiktok.com/' in href and not social_links['tiktok_url']:
                            if '/video/' not in href:
                                clean_url = original_href.split('?')[0]
                                social_links['tiktok_url'] = self._normalize_url(clean_url)
                        
                        # Pinterest
                        elif 'pinterest.com/' in href and not social_links['pinterest_url']:
                            if '/pin/' not in href:
                                clean_url = original_href.split('?')[0]
                                social_links['pinterest_url'] = self._normalize_url(clean_url)
                        
                        # Snapchat
                        elif 'snapchat.com/' in href and not social_links['snapchat_url']:
                            clean_url = original_href.split('?')[0]
                            social_links['snapchat_url'] = self._normalize_url(clean_url)
                        
                        # Threads
                        elif 'threads.net/' in href and not social_links['threads_url']:
                            clean_url = original_href.split('?')[0]
                            social_links['threads_url'] = self._normalize_url(clean_url)
                        
                        # TripAdvisor
                        elif 'tripadvisor.com/' in href and not social_links['tripadvisor_url']:
                            clean_url = original_href.split('?')[0]
                            social_links['tripadvisor_url'] = self._normalize_url(clean_url)
                    
                    # Count found links
                    found_count = sum(1 for v in social_links.values() if v is not None)
                    print(f"✓ Extracted {found_count} social media links from {url}")
                    print(f"  Links found: {[k.replace('_url', '') for k, v in social_links.items() if v]}")
                    
            except Exception as e:
                print(f"Error extracting social links from {url}: {e}")
        
        return social_links
    
    def _normalize_url(self, url: str) -> str:
        """Ensure URL has proper protocol prefix."""
        if url and not url.startswith(('http://', 'https://')):
            if url.startswith('//'):
                return 'https:' + url
            return 'https://' + url
        return url

    async def extract_contact_info(self, url: str) -> Dict:
        """
        Extract company contact information including:
        - Main address
        - Phone numbers
        - Email addresses
        - Branch/office locations with their contact details
        """
        contact_info = {
            'main_address': None,
            'phone_numbers': [],
            'email_addresses': [],
            'branches': []  # List of {name, address, phone, email}
        }
        
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        
        async with httpx.AsyncClient(follow_redirects=True, verify=False) as client:
            try:
                # Try to fetch main page and contact page
                pages_to_check = [url]
                
                # Common contact page URLs
                base_url = url.rstrip('/')
                contact_pages = [
                    f"{base_url}/contact",
                    f"{base_url}/contact-us",
                    f"{base_url}/locations",
                    f"{base_url}/about",
                    f"{base_url}/about-us",
                ]
                
                # First get the main page to find contact links
                resp = await client.get(url, headers=headers, timeout=15.0)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, 'html.parser')
                    
                    # Look for contact page links
                    for link in soup.find_all('a', href=True):
                        href = link.get('href', '').lower()
                        if any(keyword in href for keyword in ['contact', 'location', 'office', 'branch', 'store']):
                            full_url = self._make_absolute_url(base_url, link['href'])
                            if full_url not in pages_to_check:
                                pages_to_check.append(full_url)
                    
                    # Extract from main page
                    self._extract_from_soup(soup, contact_info)
                
                # Check additional pages (limit to 3 to avoid too many requests)
                for page_url in pages_to_check[1:4]:
                    try:
                        resp = await client.get(page_url, headers=headers, timeout=10.0)
                        if resp.status_code == 200:
                            soup = BeautifulSoup(resp.text, 'html.parser')
                            self._extract_from_soup(soup, contact_info)
                    except:
                        continue
                
                # Deduplicate
                contact_info['phone_numbers'] = list(set(contact_info['phone_numbers']))
                contact_info['email_addresses'] = list(set(contact_info['email_addresses']))
                
                # Log results
                print(f"✓ Extracted contact info from {url}")
                print(f"  Main address: {contact_info['main_address'][:50] if contact_info['main_address'] else 'Not found'}...")
                print(f"  Phones: {len(contact_info['phone_numbers'])}, Emails: {len(contact_info['email_addresses'])}, Branches: {len(contact_info['branches'])}")
                
            except Exception as e:
                print(f"Error extracting contact info from {url}: {e}")
        
        return contact_info
    
    def _extract_from_soup(self, soup: BeautifulSoup, contact_info: Dict):
        """Extract contact information from a BeautifulSoup object."""
        
        # Get full text for regex matching
        text = soup.get_text(separator=' ')
        
        # --- Extract Phone Numbers ---
        # Various phone formats: (123) 456-7890, 123-456-7890, +1 123 456 7890, etc.
        phone_patterns = [
            r'\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # US format
            r'\+\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}',  # International
            r'\d{3}[-.\s]\d{3}[-.\s]\d{4}',  # Simple format
        ]
        
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            for phone in phones:
                cleaned = re.sub(r'[^\d+]', '', phone)
                if len(cleaned) >= 10:  # Valid phone length
                    contact_info['phone_numbers'].append(phone.strip())
        
        # Also check tel: links
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if href.startswith('tel:'):
                phone = href.replace('tel:', '').strip()
                if phone and len(phone) >= 10:
                    contact_info['phone_numbers'].append(phone)
        
        # --- Extract Email Addresses ---
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, text)
        for email in emails:
            # Filter out common fake/placeholder emails
            if not any(fake in email.lower() for fake in ['example.com', 'test.com', 'domain.com', 'email.com']):
                contact_info['email_addresses'].append(email.lower())
        
        # Also check mailto: links
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if href.startswith('mailto:'):
                email = href.replace('mailto:', '').split('?')[0].strip()
                if email and '@' in email:
                    contact_info['email_addresses'].append(email.lower())
        
        # --- Extract Addresses ---
        # Look in common address containers
        address_containers = soup.find_all(['address', 'div', 'p', 'span'], 
            class_=lambda x: x and any(k in str(x).lower() for k in ['address', 'location', 'contact', 'office', 'hq', 'headquarter']))
        
        # Also look for structured data (schema.org)
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                import json
                data = json.loads(script.string)
                if isinstance(data, dict):
                    self._extract_from_structured_data(data, contact_info)
                elif isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            self._extract_from_structured_data(item, contact_info)
            except:
                continue
        
        # Extract from address containers
        for container in address_containers:
            address_text = container.get_text(separator=', ').strip()
            # Clean up the address
            address_text = re.sub(r'\s+', ' ', address_text)
            if len(address_text) > 20 and len(address_text) < 500:  # Reasonable address length
                if not contact_info['main_address']:
                    contact_info['main_address'] = address_text
        
        # --- Extract Branch/Office Locations ---
        # Look for location cards or lists
        location_containers = soup.find_all(['div', 'section', 'article'], 
            class_=lambda x: x and any(k in str(x).lower() for k in ['location', 'branch', 'office', 'store', 'showroom']))
        
        for container in location_containers:
            branch = self._extract_branch_info(container)
            if branch and branch.get('name') or branch.get('address'):
                # Check if not duplicate
                is_duplicate = any(
                    b.get('address') == branch.get('address') 
                    for b in contact_info['branches'] if b.get('address')
                )
                if not is_duplicate:
                    contact_info['branches'].append(branch)
    
    def _extract_from_structured_data(self, data: Dict, contact_info: Dict):
        """Extract contact info from schema.org structured data."""
        # Handle Organization/LocalBusiness schemas
        if '@type' in data and data['@type'] in ['Organization', 'LocalBusiness', 'Store', 'Corporation']:
            if 'address' in data:
                addr = data['address']
                if isinstance(addr, dict):
                    parts = [
                        addr.get('streetAddress', ''),
                        addr.get('addressLocality', ''),
                        addr.get('addressRegion', ''),
                        addr.get('postalCode', ''),
                        addr.get('addressCountry', '')
                    ]
                    full_address = ', '.join(p for p in parts if p)
                    if full_address and not contact_info['main_address']:
                        contact_info['main_address'] = full_address
                elif isinstance(addr, str):
                    if not contact_info['main_address']:
                        contact_info['main_address'] = addr
            
            if 'telephone' in data:
                contact_info['phone_numbers'].append(data['telephone'])
            
            if 'email' in data:
                contact_info['email_addresses'].append(data['email'].lower())
        
        # Handle multiple locations
        if 'location' in data and isinstance(data['location'], list):
            for loc in data['location']:
                if isinstance(loc, dict):
                    branch = {
                        'name': loc.get('name', ''),
                        'address': '',
                        'phone': loc.get('telephone', ''),
                        'email': loc.get('email', '')
                    }
                    if 'address' in loc:
                        addr = loc['address']
                        if isinstance(addr, dict):
                            parts = [addr.get('streetAddress', ''), addr.get('addressLocality', ''), 
                                   addr.get('addressRegion', ''), addr.get('postalCode', '')]
                            branch['address'] = ', '.join(p for p in parts if p)
                        else:
                            branch['address'] = str(addr)
                    if branch['name'] or branch['address']:
                        contact_info['branches'].append(branch)
    
    def _extract_branch_info(self, container) -> Dict:
        """Extract branch information from a container element."""
        branch = {
            'name': '',
            'address': '',
            'phone': '',
            'email': ''
        }
        
        text = container.get_text(separator=' ')
        
        # Try to find branch name (usually in heading)
        for heading in container.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'strong', 'b']):
            heading_text = heading.get_text().strip()
            if len(heading_text) > 3 and len(heading_text) < 100:
                branch['name'] = heading_text
                break
        
        # Find phone
        phone_match = re.search(r'\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        if phone_match:
            branch['phone'] = phone_match.group()
        
        # Find email
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        if email_match:
            branch['email'] = email_match.group().lower()
        
        # Find address (look for address element or structured text)
        address_elem = container.find('address')
        if address_elem:
            branch['address'] = address_elem.get_text(separator=', ').strip()
        else:
            # Try to find address-like text
            for elem in container.find_all(['p', 'div', 'span']):
                elem_text = elem.get_text().strip()
                # Check if it looks like an address (contains numbers and common address words)
                if re.search(r'\d+.*(?:street|st|avenue|ave|road|rd|drive|dr|suite|floor|building)', elem_text.lower()):
                    branch['address'] = elem_text
                    break
        
        return branch
    
    def _make_absolute_url(self, base_url: str, href: str) -> str:
        """Convert relative URL to absolute."""
        if href.startswith('http'):
            return href
        elif href.startswith('//'):
            return 'https:' + href
        elif href.startswith('/'):
            return base_url.rstrip('/') + href
        else:
            return base_url.rstrip('/') + '/' + href
