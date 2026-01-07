
import requests
import json
import sys

def verify_contacts():
    url = "http://localhost:8000/api/generate-leads-stream"
    
    payload = {
        "selected_channels": ["Google"],
        "selected_keywords": ["Levantina"],
        "target_industries": ["Building Materials"],
        "company_summary": "Natural stone and building materials company",
        "max_leads_per_channel": 1
    }
    
    print(f"Testing API: {url}")
    print("Payload:", json.dumps(payload, indent=2))
    
    try:
        with requests.post(url, json=payload, stream=True, timeout=120) as response:
            if response.status_code == 200:
                print("\nStreaming Response:")
                for line in response.iter_lines():
                    if line:
                        msg = json.loads(line)
                        type_ = msg.get("type")
                        if type_ == "status":
                            print(f"[STATUS] {msg.get('data')}")
                        elif type_ == "lead":
                            lead = msg.get("data")
                            print(f"\n[LEAD] {lead.get('company_name')}")
                            contacts = lead.get("key_contacts", [])
                            print(f"  Contacts: {len(contacts)}")
                            for c in contacts:
                                print(f"    - {c.get('full_name')} ({c.get('designation')}) | {c.get('email')}")
                        elif type_ == "error":
                            print(f"[ERROR] {msg.get('message')}")
            else:
                print(f"API Error: {response.status_code}")
                print(response.text)
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    verify_contacts()
