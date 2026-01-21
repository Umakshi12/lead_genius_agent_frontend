import os
import sys
import asyncio

# CRITICAL FIX for Python 3.13+ on Windows with Playwright
# Python 3.13 uses ProactorEventLoop by default which doesn't support subprocess creation
# Solution: Use nest_asyncio to allow nested event loops
if sys.platform == 'win32':
    if sys.version_info >= (3, 13):
        # Python 3.13+: Use nest_asyncio to enable subprocess support
        import nest_asyncio
        nest_asyncio.apply()
        print("[PLAYWRIGHT FIX] Python 3.13+ - Applied nest_asyncio patch")
    else:
        # Python 3.8-3.12: Use SelectorEventLoop (has native subprocess support)
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
            print("[PLAYWRIGHT FIX] Using WindowsSelectorEventLoopPolicy")
        except AttributeError:
            pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Lead Genius AI API", version="1.0.0")

# Configure CORS - Allowing all for local dev to avoid headaches
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Lead Genius AI Agent System is running."}

from app.api import endpoints
app.include_router(endpoints.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)