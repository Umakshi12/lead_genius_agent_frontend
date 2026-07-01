import asyncio
import logging
from backend.app.worker import worker_loop

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(worker_loop())
