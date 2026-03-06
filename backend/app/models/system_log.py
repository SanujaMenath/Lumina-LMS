from typing import Optional
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.models.object_id import PyObjectId


class SystemLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    actor_id: str | None
    actor_name: str | None = None  
    role: str             
    action: str          
    details: str         
    ip_address: str | None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SystemLogCreate(SystemLog):
    user_id: PyObjectId


class SystemLogResponse(BaseModel):
    user_id: PyObjectId
    action: str
    details: Optional[str]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {PyObjectId: str},
    }
