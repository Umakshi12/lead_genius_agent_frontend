from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, desc, or_, func
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

from app.database import get_db
from app.models.lead import Lead

router = APIRouter()

async def get_tenant_id(request: Request):
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        # Fallback to default tenant if middleware didn't set it (shouldn't happen with our new middleware)
        return "00000000-0000-0000-0000-000000000001"
    return tenant_id

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class LeadOut(BaseModel):
    id: uuid.UUID
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    status: str
    notes: Optional[str] = None
    campaign_id: Optional[uuid.UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class LeadsResponse(BaseModel):
    leads: List[dict]
    total: int

@router.get("/leads", response_model=LeadsResponse)
async def list_leads(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    campaign_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    query = select(Lead).where(Lead.tenant_id == tenant_id)
    
    if search:
        query = query.where(Lead.company_name.ilike(f"%{search}%"))
    if campaign_id:
        query = query.where(Lead.campaign_id == campaign_id)
    if status:
        query = query.where(Lead.status == status)
        
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Pagination
    query = query.order_by(desc(Lead.created_at)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    leads = result.scalars().all()
    
    return {
        "leads": [
            {
                "id": str(l.id),
                "company_name": l.company_name,
                "website": l.website,
                "industry": l.industry,
                "location": l.location,
                "status": l.status,
                "notes": l.notes,
                "campaign_id": str(l.campaign_id) if l.campaign_id else None,
                "created_at": l.created_at.isoformat() if l.created_at else None,
                **(l.data or {})
            } for l in leads
        ],
        "total": total
    }

@router.get("/leads/{lead_id}")
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    stmt = select(Lead).where(Lead.id == lead_id, Lead.tenant_id == tenant_id)
    result = await db.execute(stmt)
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    return {
        "id": str(lead.id),
        "company_name": lead.company_name,
        "website": lead.website,
        "industry": lead.industry,
        "location": lead.location,
        "status": lead.status,
        "notes": lead.notes,
        "campaign_id": str(lead.campaign_id) if lead.campaign_id else None,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
        **(lead.data or {})
    }

@router.patch("/leads/{lead_id}")
async def update_lead(
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id)
):
    stmt = select(Lead).where(Lead.id == lead_id, Lead.tenant_id == tenant_id)
    result = await db.execute(stmt)
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lead, key, value)
        
    await db.commit()
    return {"status": "success"}


