import os
import sys
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.middleware import TenantMiddleware

# Python 3.13+ on Windows defaults to an event loop that may break Playwright subprocesses.
if sys.platform == "win32":
    if sys.version_info >= (3, 13):
        import nest_asyncio

        nest_asyncio.apply()
        print("[PLAYWRIGHT FIX] Python 3.13+ - Applied nest_asyncio patch")
    else:
        try:
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
            print("[PLAYWRIGHT FIX] Using WindowsSelectorEventLoopPolicy")
        except AttributeError:
            pass

load_dotenv()

app = FastAPI(title="Lead Genius AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TenantMiddleware)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Lead Genius AI Agent System is running."}


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/api")
def api_root():
    return {"message": "API is working"}



from app.api import endpoints, leads, campaigns  # noqa: E402

app.include_router(endpoints.router, prefix="/api")
app.include_router(leads.router, prefix="/api")
app.include_router(campaigns.router, prefix="/api")


@app.on_event("startup")
async def on_startup():
    # Ensure DB tables exist for local dev and first-run environments.
    from app.database import engine, Base
    from app.models.lead import Lead  # noqa: F401
    from app.models.campaign import Campaign  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)