from fastapi import APIRouter, Depends, Query
from app.database.connection import get_database
from app.dependencies.auth_dependencies import require_role
from typing import Dict, Any

router = APIRouter(prefix="/system-logs", tags=["System Logs"])

# ADMIN ONLY
@router.get("/")
async def get_system_logs(
    limit: int = Query(50, ge=1, le=200, description="How many logs to return"),
    skip: int = Query(0, ge=0, description="How many logs to skip for pagination"),
    current_user=Depends(require_role("admin")) 
) -> Dict[str, Any]:
    
    db = get_database()
    
    cursor = db["system_logs"].find().sort("timestamp", -1).skip(skip).limit(limit)
    
    # Convert the MongoDB cursor to a list of dictionaries
    logs = []
    for log in cursor:
        log["_id"] = str(log["_id"])
        logs.append(log)
        
    total_logs = db["system_logs"].count_documents({})
    
    return {
        "total": total_logs,
        "page": (skip // limit) + 1,
        "logs": logs
    }