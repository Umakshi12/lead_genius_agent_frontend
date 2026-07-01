import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any

import aioredis

from app.agents.lead_generation_agent import LeadGenerationAgent

# ----------------------------------------------------------------------
# Worker that consumes jobs from the Redis stream ``leadgen:jobs``
# ----------------------------------------------------------------------
LOGGER = logging.getLogger("leadgen_worker")
LOGGER.setLevel(logging.INFO)

REDIS_URL = "redis://localhost:6379/0"
STREAM_NAME = "leadgen:jobs"
GROUP_NAME = "leadgen_workers"
CONSUMER_NAME = f"worker-{datetime.utcnow().isoformat()}"

async def get_redis() -> aioredis.Redis:
    """Singleton Redis connection used by the worker."""
    return await aioredis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

async def ensure_consumer_group(redis: aioredis.Redis) -> None:
    """Create the consumer group if it does not exist."""
    try:
        await redis.xgroup_create(name=STREAM_NAME, groupname=GROUP_NAME, id="0", mkstream=True)
        LOGGER.info("Created consumer group %s for stream %s", GROUP_NAME, STREAM_NAME)
    except aioredis.ResponseError as exc:
        # ``BUSYGROUP`` means the group already exists – ignore.
        if "BUSYGROUP" in str(exc):
            LOGGER.debug("Consumer group %s already exists", GROUP_NAME)
        else:
            raise

async def process_job(job_id: str, data: Dict[bytes, bytes]) -> None:
    """Handle a single job entry.

    Expected fields in ``data``:
        - ``tenant_id`` – the UUID of the tenant.
        - ``payload``   – JSON string with job‑specific parameters.
    """
    tenant_id = data.get(b"tenant_id", b"").decode()
    payload_raw = data.get(b"payload", b"{}")
    payload: Dict[str, Any] = json.loads(payload_raw)

    LOGGER.info("Processing job %s for tenant %s with payload %s", job_id, tenant_id, payload)

    # Placeholder: invoke the lead generation agent. In a real system you would
    # pass the tenant context (e.g. set the RLS tenant) and the payload details.
    lead_agent = LeadGenerationAgent()
    # Example: pretend we have a LeadGenerationRequest schema – here we just log.
    # await lead_agent.generate_leads_stream(...)
    await asyncio.sleep(0.1)  # simulate work
    LOGGER.info("Finished job %s for tenant %s", job_id, tenant_id)

async def worker_loop() -> None:
    redis = await get_redis()
    await ensure_consumer_group(redis)

    while True:
        # Block for up to 5 seconds waiting for new entries.
        entries = await redis.xreadgroup(
            groupname=GROUP_NAME,
            consumername=CONSUMER_NAME,
            streams={STREAM_NAME: ">"},
            count=10,
            block=5000,
        )
        if not entries:
            continue
        for stream, messages in entries:
            for job_id, fields in messages:
                try:
                    await process_job(job_id, fields)
                    # Acknowledge the message so it is not redelivered.
                    await redis.xack(STREAM_NAME, GROUP_NAME, job_id)
                except Exception as exc:  # pragma: no cover – defensive
                    LOGGER.exception("Error processing job %s: %s", job_id, exc)
                    # Optionally move to a dead‑letter stream or leave un‑acked.

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(worker_loop())
