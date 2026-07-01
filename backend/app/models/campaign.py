from sqlalchemy import Column, String, DateTime, JSON, func
import uuid
from app.database import Base, GUID

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(GUID(), nullable=False, index=True)
    name = Column(String, nullable=False)
    keywords = Column(JSON, nullable=True)  # list of strings or dict
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
