import asyncio
from datetime import datetime
from app.services.company_lookup import company_lookup_service
from app.agents.lead_generation_agent import LeadGenerationAgent
from .queue import enqueue_job  # enqueue helper
from app.database import AsyncSessionLocal
from sqlalchemy import text

# ----------------------------------------------------------------------
# Helper: fetch all tenant IDs from the ``tenants`` table.
# ----------------------------------------------------------------------
async def fetch_tenant_ids() -> list[str]:
    """Return a list of tenant UUID strings from the DB.

    Assumes a table ``tenants`` with a primary‑key column ``id`` (UUID).
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT id FROM tenants"))
        rows = result.fetchall()
        return [str(row[0]) for row in rows]

# ----------------------------------------------------------------------
# Scheduler job – runs periodically and enqueues a scrape job per tenant
# ----------------------------------------------------------------------
async def launch_scrape_job():
    print(f"[SCHEDULER] Running scrape job at {datetime.utcnow().isoformat()}")
    # Fetch tenant IDs from the database instead of a placeholder list.
    tenants = await fetch_tenant_ids()
    for tenant_id in tenants:
        payload = {"action": "scrape", "timestamp": datetime.utcnow().isoformat()}
        entry_id = await enqueue_job(tenant_id, payload)
        print(f"[SCHEDULER] Enqueued job {entry_id} for tenant {tenant_id}")

