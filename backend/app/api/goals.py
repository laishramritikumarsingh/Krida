import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, FitnessGoal
from app.schemas.schemas import FitnessGoalCreate, FitnessGoalUpdate, FitnessGoalResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/goals", tags=["Fitness Goals"])

@router.get("", response_model=List[FitnessGoalResponse])
def get_user_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = db.query(FitnessGoal).filter(
        FitnessGoal.user_id == current_user.id
    ).order_by(FitnessGoal.created_at.desc()).all()

    result = []
    for g in goals:
        pct = 0.0
        if g.target_value and g.target_value > 0:
            pct = min(round((g.current_value / g.target_value) * 100.0, 1), 100.0)
        result.append({
            "id": g.id,
            "user_id": g.user_id,
            "category": g.category,
            "title": g.title,
            "current_value": g.current_value,
            "target_value": g.target_value,
            "unit": g.unit,
            "deadline": g.deadline,
            "status": g.status,
            "notes": g.notes,
            "progress_percentage": pct,
            "created_at": g.created_at,
            "updated_at": g.updated_at
        })
    return result

@router.post("", response_model=FitnessGoalResponse)
def create_user_goal(
    goal_in: FitnessGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_goal = FitnessGoal(
        user_id=current_user.id,
        category=goal_in.category,
        title=goal_in.title,
        current_value=goal_in.current_value or 0.0,
        target_value=goal_in.target_value,
        unit=goal_in.unit,
        deadline=goal_in.deadline,
        status="in_progress",
        notes=goal_in.notes or "",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    pct = 0.0
    if new_goal.target_value > 0:
        pct = min(round((new_goal.current_value / new_goal.target_value) * 100.0, 1), 100.0)

    return {
        "id": new_goal.id,
        "user_id": new_goal.user_id,
        "category": new_goal.category,
        "title": new_goal.title,
        "current_value": new_goal.current_value,
        "target_value": new_goal.target_value,
        "unit": new_goal.unit,
        "deadline": new_goal.deadline,
        "status": new_goal.status,
        "notes": new_goal.notes,
        "progress_percentage": pct,
        "created_at": new_goal.created_at,
        "updated_at": new_goal.updated_at
    }

@router.put("/{goal_id}", response_model=FitnessGoalResponse)
def update_user_goal(
    goal_id: int,
    goal_up: FitnessGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(FitnessGoal).filter(
        FitnessGoal.id == goal_id,
        FitnessGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found or unauthorized")

    if goal_up.title is not None: goal.title = goal_up.title
    if goal_up.target_value is not None: goal.target_value = goal_up.target_value
    if goal_up.current_value is not None: goal.current_value = goal_up.current_value
    if goal_up.unit is not None: goal.unit = goal_up.unit
    if goal_up.deadline is not None: goal.deadline = goal_up.deadline
    if goal_up.status is not None: goal.status = goal_up.status
    if goal_up.notes is not None: goal.notes = goal_up.notes

    if goal.current_value >= goal.target_value:
        goal.status = "achieved"

    goal.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(goal)

    pct = min(round((goal.current_value / goal.target_value) * 100.0, 1), 100.0) if goal.target_value > 0 else 0.0

    return {
        "id": goal.id,
        "user_id": goal.user_id,
        "category": goal.category,
        "title": goal.title,
        "current_value": goal.current_value,
        "target_value": goal.target_value,
        "unit": goal.unit,
        "deadline": goal.deadline,
        "status": goal.status,
        "notes": goal.notes,
        "progress_percentage": pct,
        "created_at": goal.created_at,
        "updated_at": goal.updated_at
    }

@router.delete("/{goal_id}")
def delete_user_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(FitnessGoal).filter(
        FitnessGoal.id == goal_id,
        FitnessGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"status": "success", "message": "Goal deleted successfully"}
