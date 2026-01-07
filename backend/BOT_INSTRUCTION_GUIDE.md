# How to Instruct Your Bot for Arizona Tile-Quality Lead Generation

## System Prompt Template

Use this as your bot's system prompt for lead enrichment:

```
**Role:** You are a Senior Business Intelligence Agent specializing in high-fidelity lead generation and corporate data extraction.

**Objective:** Extract and verify the following fields for the target company:
- Company Name, Official Website URL
- Phone Numbers (with WhatsApp detection for international numbers)
- Email Addresses (verified, no placeholders)
- Social Media (LinkedIn, Twitter, Facebook, Instagram, YouTube, TikTok, Pinterest, WhatsApp)
- Full Headquarters Address
- Branch/Office Locations with contact details
- **KEY PRIORITY: Executive Names, Titles, and LinkedIn Profiles**

**CRITICAL: FINDING KEY CONTACTS IS THE #1 PRIORITY**
- Extract ALL executive names (CEO, Founder, President, VP, Director, CFO, CTO, CMO, COO, etc.)
- Check BOTH website content AND search results for executive information
- LinkedIn company search results often contain executive directories - extract ALL names
- Even with minimal info (just name + title), you MUST include them
- Look for: Leadership team, Management team, Board members, Founders, C-suite executives
- **Empty executive list = FAILURE**

**ZERO HALLUCINATION POLICY:**
1. **Strict Verification:** If data is not explicitly visible, return "Not Publicly Disclosed"
2. **NO Fabrication:** Do NOT generate placeholder emails (info@, contact@) unless actually found
3. **Multi-Source:** Cross-reference website content with search results
4.  **LinkedIn Priority:** Executive LinkedIn profiles are critical - extract from search snippets
5. **WhatsApp Detection:** Mark international numbers (+country code) as WhatsApp-enabled
6. **Role Categories:** Classify executives as Decision Maker, Technical Lead, Purchasing Authority, or Other
7. **Date Validation:** Prioritize recent data, flag "Former" titles

**Verification Loop (Before Finalizing):**
* Did I extract ALL executive names from LinkedIn company search results?
* Did I check BOTH CEO/founder AND leadership/management search queries?
* Did I find ALL 8 social media platforms (if they exist)?
* Are branch phone numbers distinct from HQ?
* Did I avoid generating any fake data?

**Output Schema:**
{
  "company_details": {
    "official_name": "...",
    "headquarters_address": "...",
    "main_phone": "...",
    "general_emails": ["..."]
  },
  "social_media": {
    "linkedin": "...",
    "twitter": "...",
    "facebook": "...",
    "instagram": "...",
    "youtube": "...",
    "tiktok": "...",
    "pinterest": "...",
    "whatsapp": "..."
  },
  "key_decision_makers": [
    {
      "name": "...",
      "title": "...",
      "role_category": "Decision Maker|Technical Lead|Purchasing Authority|Other",
      "email": "Not Publicly Disclosed",
      "phone": "Not Publicly Disclosed",
      "linkedin": "...",
      "twitter": "...",
      "source": "Website|LinkedIn|Search"
    }
  ],
  "branches": [
    {
      "name": "...",
      "address": "...",
      "phone": "...",
      "email": "..."
    }
  ]
}
```

## Agentic Workflow (ReAct Loop)

Your bot should follow this exact sequence:

### Phase 1: Discovery
```
1. Crawl main website URL
2. Find and crawl: /about, /contact, /locations, /team, /leadership, /about-us
3. Extract social media links from footer/header
4. Parse structured data (schema.org LocalBusiness)
5. IF content < 500 chars → Search for "Company Name official website" → Retry
```

### Phase 2: Enrichment (External Verification)
```
Run these 7 search queries in parallel:

1. "{company} official headquarters address location"
2. "{company} CEO founder president executive team"
3. "{company} leadership management board directors"
4. "{company} official social media linkedin facebook instagram twitter"
5. "{company} branch locations offices stores"
6. "{company} contact phone email customer service"
7. "{company} LinkedIn company profile site:linkedin.com"

Compile all search snippets - these contain executive names!
```

### Phase 3: Extraction & Validation
```
1. Feed the LLM:
   - Website content (up to 20,000 chars)
   - All 7 search result snippets
   - System prompt (above)
   
2. LLM analyzes and extracts structured JSON

3. Post-processing:
   - Filter out "Not Publicly Disclosed" strings from actual fields
   - Detect WhatsApp: phone.startswith('+') → has_whatsapp = True
   - Prioritize direct scraped social links over LLM-extracted ones
   - Validate URLs (must start with http)
```

### Phase 4: Self-Correction
```
Before finalizing:
- IF no executives found → Flag as low confidence (0.7)
- IF 5+ executives found → High confidence (0.95)
- IF no social media → Retry with targeted social search
- IF no branches but industry suggests retail/services → Search again
```

## Search Query Templates

For best results, use these exact query formats:

```python
SEARCH_QUERIES = [
    "{company} official headquarters address location",
    "{company} CEO founder president executive team",
    "{company} leadership management board directors",
    "{company} official social media linkedin facebook instagram",
    "{company} branch locations offices stores showrooms",
    "{company} contact phone email customer service",
    "{company} LinkedIn company profile site:linkedin.com",
]
```

## Executive Discovery - The Secret Sauce

**Why Arizona Tile found 8 executives:**

1. **LinkedIn Company Search**: Query #7 returns LinkedIn company page, which lists executives
2. **Separate Exec Queries**: Query #2 (CEO/founder) and #3 (leadership) cover different levels
3. **Snippet Extraction**: LLM extracts names directly from search snippets, not just URLs
4. **Minimal Info Acceptance**: Name + Title is enough - no email required

**Example Search Result Processing:**
```
Search: "Arizona Tile CEO founder president"
Result Snippet: "... John Huarte, Founder and CEO of Arizona Tile, leads the company..."

LLM Extracts:
{
  "name": "John Huarte",
  "title": "Founder and CEO",
  "role_category": "Decision Maker",
  "email": "Not Publicly Disclosed",
  "linkedin": "Not Publicly Disclosed",
  "source": "Search"
}
```

## WhatsApp Detection Logic

```python
has_whatsapp = (
    phone_number.strip().startswith('+') or  # International format
    'whatsapp' in contact_page.lower() or    # Explicit mention
    'wa.me' in links                          # WhatsApp link found
)
```

## Common Mistakes to Avoid

❌ **Don't**: Generate "info@company.com" if not actually found  
✅ **Do**: Use "Not Publicly Disclosed"

❌ **Don't**: Stop at 1-2 executives  
✅ **Do**: Extract ALL names from search results (LinkedIn lists)

❌ **Don't**: Treat "Former CEO" as current  
✅ **Do**: Check for "Former" and prioritize recent data

❌ **Don't**: Duplicate HQ phone for all branches  
✅ **Do**: Mark branch phone as distinct or leave empty

❌ **Don't**: Use only website content  
✅ **Do**: Cross-reference with 7 search queries

## Model Recommendations

- **Best**: GPT-4o or Claude Opus (strong reasoning for complex extraction)
- **Good**: GPT-4-turbo (balanced cost/quality)
- **Avoid**: GPT-3.5/4o-mini (too weak for verification loop)

## Rate Limiting

**Per Company:**
- 1 website crawl
- 7 search queries
- 1 LLM call (with 20K+ context)

**Recommendation:**
- Batch companies: Process 10 at a time
- Add 2-second delay between searches
- Cache search results for 24 hours

## Success Metrics

A well-configured bot should achieve:

- ✅ **Executive Discovery**: 70-80% of companies (5+ contacts)
- ✅ **Social Media Coverage**: 90% have 3+ platforms
- ✅ **Branch Detection**: 80% for multi-location businesses
- ✅ **Zero Hallucinations**: 100% (strict policy)
- ✅ **Confidence Score**: >0.8 average

## Example: Arizona Tile Configuration

```python
company = "Arizona Tile"
website = "https://www.arizonatile.com"

# Discovery Phase
pages_crawled = [
    "/",
    "/about-us",
    "/locations", 
    "/contact"
]

# Enrichment Phase (7 queries)
searches_performed = 7
search_results_analyzed = 28  # 4 results per query

# Extraction Phase
executives_found = 8  # John Huarte, Joe Kennedy, Don Kesteloot, Beth Gaughan, etc.
branches_found = 28
social_platforms_found = 7  # LinkedIn, Instagram, Facebook, Pinterest, Twitter, YouTube, TikTok

# Validation
confidence_score = 0.95
hallucinations = 0
```

---

**Bottom Line:**

The magic is in the **multi-source verification** (website + 7 targeted searches) combined with **executive-focused prompting** and a **strict no-hallucination policy**.
