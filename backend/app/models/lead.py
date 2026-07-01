from sqlalchemy import Column, String, DateTime, JSON, func, Text, ForeignKey, Integer
import uuid
from app.database import Base, GUID

class Lead(Base):
    __tablename__ = "leads"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(GUID(), nullable=False, index=True)
    campaign_id = Column(GUID(), ForeignKey("campaigns.id"), nullable=True)
    
    company_name = Column(String, nullable=False)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    status = Column(String, default="new") # new, contacted, qualified, converted, lost
    notes = Column(Text, nullable=True)
    
    # Store the full enriched data from LeadGenerationAgent
    data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
