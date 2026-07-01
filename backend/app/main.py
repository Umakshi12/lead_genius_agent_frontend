import os
import logging
from logging.config import dictConfig
from app.logging_config import setup_logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

from app.middleware import TenantMiddleware
from app.api import endpoints, auth
from app.core.jobs import launch_scrape_job
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

# ------------------------------------------------------------
# Logging configuration – set up as early as possible
# ------------------------------------------------------------
setup_logging(level="INFO")
logger = logging.getLogger("leadgen_app")

app = FastAPI(title="Lead Genius SaaS API", version="0.1.0")

# Global middlewares
# app.add_middleware(HTTPSRedirectMiddleware)  # disable locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod (specific domains)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TenantMiddleware)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
from app.api import campaigns

app.include_router(campaigns.router, prefix="/api", tags=["campaigns"])  # added campaigns routes
from app.api import leads
app.include_router(leads.router, prefix="/api", tags=["leads"])
app.include_router(endpoints.router, prefix="/api", tags=["lead"])

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

# Scheduler setup – runs every 5 minutes (adjust as needed)
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def on_startup():
    logger.info("[STARTUP] Initializing resources")
    
    # Create tables
    from app.database import engine, Base
    from app.models.campaign import Campaign
    from app.models.lead import Lead
    
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[STARTUP] Database tables synchronized")
    except Exception as e:
        logger.error(f"[STARTUP] Failed to synchronize database: {e}")
        logger.warning("[STARTUP] Application will continue, but database features may fail")

    # Start APScheduler
    scheduler.add_job(
        launch_scrape_job,
        trigger=IntervalTrigger(minutes=5),
        id="scrape_job",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("[STARTUP] Scheduler started – scrape job every 5 minutes")

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("[SHUTDOWN] Cleaning up")
    scheduler.shutdown(wait=False)
    # Close Redis connection if it was created
    from app.core.queue import _redis
    if _redis:
        await _redis.close()
    logger.info("[SHUTDOWN] Resources cleaned up")
