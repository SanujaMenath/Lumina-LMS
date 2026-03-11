from typing import List
from fastapi import APIRouter, HTTPException, Depends, Query, Path
from app.models.user import UserUpdate, UserResponse, ChangePasswordPayload
from app.services.user_service import UserService
from app.models.user import LecturerCreate, StudentCreate, AdminCreate
from app.dependencies.auth_dependencies import require_role, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/create")
async def create_user(payload: dict):
    role = payload.get("role")

    if role == "lecturer":
        data = LecturerCreate(**payload)

    elif role == "student":
        data = StudentCreate(**payload)

    elif role == "admin":
        data = AdminCreate(**payload)

    else:
        raise HTTPException(status_code=400, detail="Invalid role")

    return await UserService.create_user(data)


@router.get(
    "/",
    response_model=List[UserResponse],
    dependencies=[Depends(require_role("admin"))],
)
def list_users(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=1000)):
    return UserService.list_users(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str = Path(...), current_user=Depends(get_current_user)):

    if current_user["role"] != "admin" and current_user["id"] != user_id:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    return UserService.get_user_public(user_id)


@router.put("/me", response_model=UserResponse)
def update_me(payload: UserUpdate, current_user=Depends(get_current_user)):
    return UserService.update_user(current_user["id"], payload)


@router.put("/me/change-password")
def change_password(
    payload: ChangePasswordPayload, current_user=Depends(get_current_user)
):
    return UserService.change_password(
        user_id=current_user["id"],
        current_password=payload.current_password,
        new_password=payload.new_password,
    )


@router.delete("/{user_id}", dependencies=[Depends(require_role("admin"))])
def delete_user(user_id: str):
    return UserService.delete_user(user_id)
