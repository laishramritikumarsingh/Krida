import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, ConditioningSession
from app.schemas.schemas import ConditioningSessionCreate, ConditioningSessionResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/hyrox", tags=["HYROX & Conditioning Engine"])

@router.get("/sessions", response_model=List[ConditioningSessionResponse])
def get_conditioning_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ConditioningSession).filter(
        ConditioningSession.user_id == current_user.id
    ).order_by(ConditioningSession.completed_at.desc()).all()
    return sessions

@router.post("/session", response_model=ConditioningSessionResponse)
def log_conditioning_session(
    sess_in: ConditioningSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_sess = ConditioningSession(
        user_id=current_user.id,
        session_type=sess_in.session_type,
        title=sess_in.title,
        distance_meters=sess_in.distance_meters,
        duration_seconds=sess_in.duration_seconds,
        rounds_completed=sess_in.rounds_completed,
        rest_seconds=sess_in.rest_seconds,
        stations_data_json=sess_in.stations_data_json,
        notes=sess_in.notes or "",
        completed_at=datetime.datetime.utcnow()
    )
    db.add(new_sess)
    db.commit()
    db.refresh(new_sess)
    return new_sess
