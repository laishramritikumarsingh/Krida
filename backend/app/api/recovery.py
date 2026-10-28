import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, RecoveryRecord, WorkoutLog
from app.schemas.schemas import RecoveryStatusResponse, RecoveryRecordCreate
from app.utils.auth import get_current_user
from app.recommendations.engine import recommendation_engine

router = APIRouter(prefix="/recovery", tags=["Recovery & Readiness"])

@router.get("", response_model=RecoveryStatusResponse)
def get_recovery_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    latest = db.query(RecoveryRecord).filter(
        RecoveryRecord.user_id == current_user.id
    ).order_by(RecoveryRecord.recorded_at.desc()).first()

    if not latest:
        # Default fresh state
        metrics = recommendation_engine.compute_recovery_metrics(sleep_hours=7.8, fatigue_level=3)
        return {
            "recovery_score": metrics["recovery_score"],
            "fatigue_level": metrics["fatigue_level"],
            "sleep_hours": metrics["sleep_hours"],
            "strain_score": metrics["strain_score"],
            "status_text": metrics["status_text"],
            "recommendation": metrics["recommendation"],
            "readiness_level": metrics["readiness_level"]
        }

    readiness = "Prime" if latest.recovery_score >= 80 else ("Moderate" if latest.recovery_score >= 60 else "Deload Recommended")

    return {
        "recovery_score": latest.recovery_score,
        "fatigue_level": latest.fatigue_level,
        "sleep_hours": latest.sleep_hours,
        "strain_score": latest.strain_score,
        "status_text": latest.status_text,
        "recommendation": latest.recommendation,
        "readiness_level": readiness
    }

@router.post("/check-in", response_model=RecoveryStatusResponse)
def submit_recovery_checkin(
    checkin: RecoveryRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Count recent workouts in past 7 days
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    recent_workouts = db.query(WorkoutLog).filter(
        WorkoutLog.user_id == current_user.id,
        WorkoutLog.completed_at >= seven_days_ago
    ).count()

    metrics = recommendation_engine.compute_recovery_metrics(
        sleep_hours=checkin.sleep_hours,
        fatigue_level=checkin.fatigue_level,
        recent_workout_count=recent_workouts
    )

    rec = RecoveryRecord(
        user_id=current_user.id,
        recorded_at=datetime.datetime.utcnow(),
        recovery_score=metrics["recovery_score"],
        fatigue_level=metrics["fatigue_level"],
        sleep_hours=metrics["sleep_hours"],
        strain_score=metrics["strain_score"],
        status_text=metrics["status_text"],
        recommendation=metrics["recommendation"]
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)

    return {
        "recovery_score": rec.recovery_score,
        "fatigue_level": rec.fatigue_level,
        "sleep_hours": rec.sleep_hours,
        "strain_score": rec.strain_score,
        "status_text": rec.status_text,
        "recommendation": rec.recommendation,
        "readiness_level": metrics["readiness_level"]
    }
