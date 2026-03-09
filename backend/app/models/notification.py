import uuid
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.object_id import PyObjectId


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    recipient_id: str | None  
    target_role: str | None  
    title: str                
    message: str              
    link: str | None          
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {PyObjectId: str},
    }
