from fastapi import APIRouter, Depends, HTTPException, status
from app.database.connection import get_database
from app.dependencies.auth_dependencies import get_current_user 

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/")
def get_user_notifications(current_user: dict = Depends(get_current_user)):
    """Synchronous PyMongo fetch for notifications"""
    db = get_database()
    user_id = str(current_user.get("id") or current_user.get("_id"))
    
    cursor = db["notifications"].find({"recipient_id": user_id}).sort("created_at", -1).limit(50)
    
    notifications_docs = []
    for notif in cursor:
        notif["_id"] = str(notif["_id"]) 
        notifications_docs.append(notif)
        
    return notifications_docs

@router.put("/{notification_id}/read")
def mark_notification_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Synchronous PyMongo update"""
    db = get_database()
    user_id = str(current_user.get("id") or current_user.get("_id"))
    
    result = db["notifications"].update_one(
        {"id": notification_id, "recipient_id": user_id},
        {"$set": {"is_read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    return {"message": "Notification marked as read"}