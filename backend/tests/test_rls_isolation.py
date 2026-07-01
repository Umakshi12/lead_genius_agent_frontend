import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine

# Helper to run a query with a specific tenant context
async def run_with_tenant(tenant_id: str) -> list:
    async with AsyncSessionLocal() as session:
        # Set the RLS tenant variable for this session
        await session.execute(text("SET LOCAL rls.tenant_id = :tid"), {"tid": tenant_id})
        result = await session.execute(text("SELECT id, tenant_id, name FROM leads"))
        rows = result.fetchall()
        return rows

@pytest_asyncio.fixture(scope="module")
async def setup_test_data():
    # Create two tenants and insert sample leads for each
    tenant_a = str(uuid.uuid4())
    tenant_b = str(uuid.uuid4())
    async with AsyncSessionLocal() as session:
        # Insert leads for tenant A
        await session.execute(
            text("INSERT INTO leads (id, tenant_id, name) VALUES (:id, :tid, :name)"),
            {
                "id": str(uuid.uuid4()),
                "tid": tenant_a,
                "name": "Lead A1",
            },
        )
        await session.execute(
            text("INSERT INTO leads (id, tenant_id, name) VALUES (:id, :tid, :name)"),
            {
                "id": str(uuid.uuid4()),
                "tid": tenant_a,
                "name": "Lead A2",
            },
        )
        # Insert leads for tenant B
        await session.execute(
            text("INSERT INTO leads (id, tenant_id, name) VALUES (:id, :tid, :name)"),
            {
                "id": str(uuid.uuid4()),
                "tid": tenant_b,
                "name": "Lead B1",
            },
        )
        await session.commit()
    return tenant_a, tenant_b

@pytest.mark.asyncio
async def test_rls_isolation(setup_test_data):
    tenant_a, tenant_b = setup_test_data

    # Query as tenant A – should only see A's leads
    rows_a = await run_with_tenant(tenant_a)
    assert all(row[1] == tenant_a for row in rows_a), "Tenant A sees other tenants' data"

    # Query as tenant B – should only see B's leads
    rows_b = await run_with_tenant(tenant_b)
    assert all(row[1] == tenant_b for row in rows_b), "Tenant B sees other tenants' data"

    # Ensure the two result sets are disjoint
    ids_a = {row[0] for row in rows_a}
    ids_b = {row[0] for row in rows_b}
    assert ids_a.isdisjoint(ids_b), "Leads from different tenants overlapped"
