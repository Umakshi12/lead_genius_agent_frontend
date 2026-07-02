import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from fastapi import Request
from sqlalchemy import text
from typing import AsyncGenerator
from sqlalchemy.orm import declarative_base

from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as pgUUID

Base = declarative_base()

class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified hex.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(pgUUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            else:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                return uuid.UUID(value)
            else:
                return value

import uuid

# ---------------------------------------------------------------------------
# Database configuration
# ---------------------------------------------------------------------------
# The DATABASE_URL should point to a PostgreSQL instance that has Row‑Level
# Security (RLS) enabled. Example format:
#   postgresql+asyncpg://user:password@host:5432/database_name
# In development we fall back to a local instance.
if os.getenv("VERCEL"):
    DEFAULT_SQLITE_PATH = Path("/tmp/leadgen.db")
else:
    DEFAULT_SQLITE_PATH = Path(__file__).resolve().parents[1] / "leadgen.db"
    
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite+aiosqlite:///{DEFAULT_SQLITE_PATH.as_posix()}",
)

# Async engine – echo=False for production, set to True for debugging.
def create_engine_safe():
    try:
        # Try primary DATABASE_URL from environment
        return create_async_engine(DATABASE_URL, echo=False, future=True)
    except Exception as e:
        print(f"[DB] PostgreSQL engine creation failed: {e}. Falling back to SQLite.")
        # Fallback to local SQLite
        fallback_url = f"sqlite+aiosqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
        return create_async_engine(fallback_url, echo=False, future=True)

engine = create_engine_safe()
AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

# ---------------------------------------------------------------------------
# Dependency that provides a session with the tenant context for RLS.
# ---------------------------------------------------------------------------
def is_postgres():
    return engine.url.drivername.startswith("postgresql")

# ---------------------------------------------------------------------------
# Dependency that provides a session with the tenant context for RLS.
# ---------------------------------------------------------------------------
async def get_db(request: Request) -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        if is_postgres():
            tenant_id = getattr(request.state, "rls_tenant", None)
            if tenant_id:
                try:
                    await session.execute(
                        text("SET LOCAL rls.tenant_id = :tid"), {"tid": tenant_id}
                    )
                except Exception as e:
                    print(f"[DB] Failed to set RLS context: {e}")
        yield session
