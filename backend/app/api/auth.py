from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, Profile
from app.schemas.schemas import UserCreate, UserLogin, Token, UserResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.auth import get_current_user
from app.database.seed_data import seed_demo_user
import json

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    new_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
        is_demo=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create empty default profile
    default_profile = Profile(
        user_id=new_user.id,
        available_equipment=json.dumps(["Dumbbells", "Bodyweight"]),
        sports_interests=json.dumps(["General Fitness"]),
        schedule_days=json.dumps(["Monday", "Wednesday", "Friday"])
    )
    db.add(default_profile)
    db.commit()

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username,
            "is_demo": False,
            "has_plan": False
        }
    }

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password combination."
        )

    has_plan = len(user.workout_plans) > 0
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "is_demo": user.is_demo,
            "has_plan": has_plan
        }
    }

@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """One-click instant login to demo account with 4 weeks of preloaded sports science data."""
    demo_user = seed_demo_user(db)
    token = create_access_token({"sub": str(demo_user.id), "email": demo_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": demo_user.id,
            "email": demo_user.email,
            "username": demo_user.username,
            "is_demo": True,
            "has_plan": True
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    has_plan = True if current_user.is_demo else len(current_user.workout_plans) > 0
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "is_demo": current_user.is_demo,
        "has_plan": has_plan,
        "created_at": current_user.created_at
    }
