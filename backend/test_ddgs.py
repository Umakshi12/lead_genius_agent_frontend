
from duckduckgo_search import DDGS

print("Testing DDGS...")
try:
    with DDGS() as ddgs:
        print("Using context manager...")
        r = list(ddgs.text("Microsoft CEO", max_results=3))
        print(f"Results: {len(r)}")
        for i in r:
            print(i)
except Exception as e:
    print(f"Error: {e}")

try:
    print("Direct instantiation...")
    ddgs = DDGS()
    r = list(ddgs.text("Google CEO", max_results=3))
    print(f"Results: {len(r)}")
except Exception as e:
    print(f"Error: {e}")
