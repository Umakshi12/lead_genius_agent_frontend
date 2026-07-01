from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert, update, delete, text
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

from app.database import get_db
from app.models.campaign import Campaign

router = APIRouter()

oauth_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# Simple dependency to extract tenant_id from request (set by middleware)
from fastapi import Request

async def get_tenant_id(request: Request):
    tenant_id = getattr(request.state, "rls_tenant", None)
    if not tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tenant not found")
    return tenant_id

class CampaignCreate(BaseModel):
    name: str = Field(..., example="Q2 2026 Outreach")
    keywords: List[str] = Field(default_factory=list, example=["AI", "Automation"])

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    keywords: Optional[List[str]] = None

class CampaignOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    keywords: List[str]
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

# Create campaign
@router.post("/campaigns", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
async def create_campaign(payload: CampaignCreate, db: AsyncSession = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    stmt = insert(Campaign).values(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        name=payload.name,
        keywords=payload.keywords,
    ).returning(Campaign)
    result = await db.execute(stmt)
    await db.commit()
    campaign = result.scalar_one_or_none()
    return campaign

# List campaigns for tenant
@router.get("/campaigns", response_model=List[CampaignOut])
async def list_campaigns(db: AsyncSession = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    stmt = select(Campaign).where(Campaign.tenant_id == tenant_id)
    result = await db.execute(stmt)
    campaigns = result.scalars().all()
    return campaigns

# Get campaign by id
@router.get("/campaigns/{campaign_id}", response_model=CampaignOut)
async def get_campaign(campaign_id: uuid.UUID, db: AsyncSession = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    stmt = select(Campaign).where(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id)
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

# Update campaign
@router.patch("/campaigns/{campaign_id}", response_model=CampaignOut)
async def update_campaign(campaign_id: uuid.UUID, payload: CampaignUpdate, db: AsyncSession = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    stmt = select(Campaign).where(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id)
    result = await db.execute(stmt)
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    update_data = payload.dict(exclude_unset=True)
    if update_data:
        upd_stmt = (
            update(Campaign)
            .where(Campaign.id == campaign_id)
            .values(**update_data)
            .returning(Campaign)
        )
        upd_res = await db.execute(upd_stmt)
        await db.commit()
        campaign = upd_res.scalar_one_or_none()
    return campaign

# Delete campaign
@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(campaign_id: uuid.UUID, db: AsyncSession = Depends(get_db), tenant_id: str = Depends(get_tenant_id)):
    stmt = delete(Campaign).where(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id)
    await db.execute(stmt)
    await db.commit()
    return None
