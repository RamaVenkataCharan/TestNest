from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models import User
from app.schemas import UserCreate
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin,
    get_current_student
)

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# -------------------------
# Register User
# -------------------------
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "id": new_user.id,
        "full_name": new_user.full_name,
        "email": new_user.email,
        "role": new_user.role
    }


# -------------------------
# Login User
# -------------------------
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        db_user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "id": db_user.id,
            "sub": db_user.email,
            "role": db_user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# -------------------------
# Protected Profile Route
# -------------------------
@router.get("/profile")
def get_profile(
    current_user=Depends(get_current_user)
):
    return {
        "message": "Protected Route",
        "user": current_user
    }

@router.get("/admin")
def admin_dashboard(
    current_admin=Depends(get_current_admin)
):
    return {
        "message": "Welcome Admin",
        "user": current_admin
    }

@router.get("/student")
def student_dashboard(
    current_student=Depends(get_current_student)
):
    return {
        "message": "Welcome Student",
        "user": current_student
    }

# -------------------------
# Get All Users (Admin Only)
# -------------------------
@router.get("/")
def get_all_users(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    users = db.query(User).all()

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": "student"
        }
        for user in users
    ]


# -------------------------
# Delete User (Admin Only)
# -------------------------
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }

@router.post(
    "/create-admin",
    status_code=status.HTTP_201_CREATED
)
def create_admin(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    existing_user = (
        db.query(User)
        .filter(User.email == user.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_admin = User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role="admin"
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return {
        "message": "Admin created successfully",
        "id": new_admin.id,
        "full_name": new_admin.full_name,
        "email": new_admin.email,
        "role": new_admin.role,
    }