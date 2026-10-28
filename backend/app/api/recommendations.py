from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, Recommendation
from app.utils.auth import get_current_user

router = APIRouter(prefix="/recommendations", tags=["Adaptive Recommendations"])

@router.get("")
def get_user_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recs = db.query(Recommendation).filter(
        Recommendation.user_id == current_user.id
    ).order_by(Recommendation.created_at.desc()).limit(10).all()

    results = []
    for r in recs:
        results.append({
            "id": r.id,
            "type": r.type,
            "title": r.title,
            "message": r.message,
            "why_explanation": r.why_explanation,
            "is_read": r.is_read,
            "created_at": r.created_at.strftime("%b %d, %H:%M")
        })

    return {"recommendations": results}

@router.post("/mark-read/{rec_id}")
def mark_recommendation_read(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rec = db.query(Recommendation).filter(
        Recommendation.id == rec_id,
        Recommendation.user_id == current_user.id
    ).first()

    if rec:
        rec.is_read = True
        db.commit()

    return {"status": "success"}
