from app.utils.websocket_manager import manager
from app.models.notification import Notification
from app.models.system_log import SystemLog
from app.database.connection import get_database

db = get_database()

async def log_action(actor_id: str, role: str, action: str, details: str, ip_address: str | None = None,actor_name: str | None = None):
    """Saves a background log of an action to MongoDB."""
    new_log = SystemLog(
        actor_id=actor_id, 
        actor_name=actor_name,
        role=role, 
        action=action, 
        details=details,
        ip_address=ip_address
    )
    
    db["system_logs"].insert_one(new_log.model_dump())

async def notify_user(recipient_id: str, target_role: str | None, title: str, message: str, link: str | None = None):
    """Saves a notification to MongoDB and pushes it to the React frontend instantly."""
    new_notif = Notification(
        recipient_id=recipient_id, 
        target_role=target_role,
        title=title, 
        message=message, 
        link=link
    )
    
    # Save it to the database so it persists if they are offline
    db["notifications"].insert_one(new_notif.model_dump())

    # Convert the Pydantic model to a dictionary with stringified dates for JSON
    notif_data = new_notif.model_dump()
    notif_data["created_at"] = notif_data["created_at"].isoformat()
    
    # Push it instantly to the specific user via WebSockets
    if recipient_id:
        await manager.send_personal_message(notif_data, recipient_id)