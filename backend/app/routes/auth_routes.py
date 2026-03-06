from fastapi import APIRouter, Depends, HTTPException, Request
from app.services.audit import log_action
from pydantic import BaseModel, EmailStr
from app.services.auth_service import AuthService
from app.database.connection import get_database
from app.dependencies.auth_dependencies import get_current_user, require_role
from app.models.user import UserResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    full_name: str
    user_id: str


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, request: Request):
    db = get_database()

    user = db["users"].find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not AuthService.verify_password(data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = AuthService.create_access_token(
        {
            "sub": str(user["_id"]),
            "role": user["role"],
            "email": user["email"],
            "full_name": user["full_name"],
        }
    )

    client_ip = request.client.host if request.client else "Unknown"

    await log_action(
        actor_id=str(user["_id"]),
        role=user["role"],       
        action="USER_LOGIN",
        details=f"{user['role'].capitalize()} logged in successfully.",
        ip_address=client_ip,
        actor_name=user["full_name"]
    )

    return LoginResponse(
        access_token=token,
        role=user["role"],
        user_id=str(user["_id"]),
        email=user["email"],
        full_name=user["full_name"],
    )


# Temporary Admin Seeder (for testing)
class AdminCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


@router.post("/create-admin")
def create_admin(data: AdminCreate):
    db = get_database()

    # Check email exists
    if db["users"].find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed = AuthService.hash_password(data.password)

    new_admin = {
        "full_name": data.full_name,
        "email": data.email,
        "password": hashed,
        "role": "admin",
    }

    result = db["users"].insert_one(new_admin)

    return {"message": "Admin created", "admin_id": str(result.inserted_id)}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.get("/admin-only")
async def admin_only(current_user=Depends(require_role("admin"))):
    return {"message": "Admin access granted"}
