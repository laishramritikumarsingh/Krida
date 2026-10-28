import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import Exercise
from app.schemas.schemas import ExerciseResponse

router = APIRouter(prefix="/exercises", tags=["Exercise Library"])

@router.get("", response_model=List[ExerciseResponse])
def get_exercises(
    search: Optional[str] = Query(None, description="Search by exercise name"),
    category: Optional[str] = Query(None, description="Filter by body category"),
    equipment: Optional[str] = Query(None, description="Filter by equipment"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    movement_type: Optional[str] = Query(None, description="Filter by movement type"),
    db: Session = Depends(get_db)
):
    query = db.query(Exercise)

    if search:
        query = query.filter(Exercise.name.ilike(f"%{search}%"))
    if category and category.lower() != "all":
        query = query.filter(Exercise.category.ilike(f"%{category}%"))
    if equipment and equipment.lower() != "all":
        query = query.filter(Exercise.equipment_needed.ilike(f"%{equipment}%"))
    if difficulty and difficulty.lower() != "all":
        query = query.filter(Exercise.difficulty.ilike(f"%{difficulty}%"))
    if movement_type and movement_type.lower() != "all":
        query = query.filter(Exercise.movement_type.ilike(f"%{movement_type}%"))

    exercises = query.order_by(Exercise.category.asc(), Exercise.name.asc()).all()

    results = []
    for ex in exercises:
        try:
            muscles = json.loads(ex.target_muscles) if isinstance(ex.target_muscles, str) else ex.target_muscles
        except Exception:
            muscles = []

        results.append({
            "id": ex.id,
            "name": ex.name,
            "category": ex.category,
            "target_muscles": muscles,
            "equipment_needed": ex.equipment_needed,
            "difficulty": ex.difficulty,
            "movement_type": ex.movement_type,
            "instructions": ex.instructions,
            "sets_reps_recommendation": ex.sets_reps_recommendation
        })

    return results
