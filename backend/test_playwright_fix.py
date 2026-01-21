"""
Quick test script to verify Playwright works with the event loop policy fix
"""
import sys
import asyncio
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# CRITICAL FIX for Python 3.13+ on Windows
if sys.platform == 'win32':
    if sys.version_info >= (3, 13):
        import nest_asyncio
        nest_asyncio.apply()
        print(f"[OK] Applied nest_asyncio for Python {sys.version_info.major}.{sys.version_info.minor}")
    else:
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
            print("[OK] Set WindowsSelectorEventLoopPolicy")
        except AttributeError:
            print("[WARN] WindowsSelectorEventLoopPolicy not available")

async def test_playwright():
    try:
        from playwright.async_api import async_playwright
        
        print("[TEST] Testing Playwright initialization...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            print("[OK] Browser launched successfully!")
            
            context = await browser.new_context()
            page = await context.new_page()
            
            await page.goto("https://www.google.com")
            title = await page.title()
            print(f"[OK] Page loaded: {title}")
            
            await browser.close()
            print("[OK] Test completed successfully! Playwright is working.")
            return True
            
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_playwright())
    if result:
        print("\n[SUCCESS] Your Playwright setup is working correctly.")
        print("Now restart your main server with: python main.py")
    else:
        print("\n[FAILED] Test failed. Please check the error above.")
