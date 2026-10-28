import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, SkillProgress
from app.schemas.schemas import SkillProgressCreate, SkillProgressResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/calisthenics", tags=["Calisthenics Engine"])

DEFAULT_SKILLS = [
    {"name": "Push-ups", "level": "Diamond & Archer Push-ups", "level_num": 3, "default_reps": 15, "default_hold": 0.0},
    {"name": "Pull-ups", "level": "Strict Dead-Hang Pull-ups", "level_num": 2, "default_reps": 10, "default_hold": 0.0},
    {"name": "Dips", "level": "Parallel Bar Dips", "level_num": 2, "default_reps": 12, "default_hold": 0.0},
    {"name": "Handstands", "level": "Chest-to-Wall Handstand Hold", "level_num": 2, "default_reps": 0, "default_hold": 45.0},
    {"name": "L-sits", "level": "Tuck L-Sit on Floor / Parallettes", "level_num": 1, "default_reps": 0, "default_hold": 20.0},
    {"name": "Front Lever", "level": "Advanced Tuck Front Lever", "level_num": 2, "default_reps": 0, "default_hold": 12.0},
    {"name": "Muscle-Up", "level": "Deep Straight-Bar Dips & Banded Transition", "level_num": 2, "default_reps": 6, "default_hold": 0.0},
]

@router.get("/skills", response_model=List[SkillProgressResponse])
def get_user_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_skills = db.query(SkillProgress).filter(
        SkillProgress.user_id == current_user.id
    ).all()

    # Map existing
    skills_by_name = {s.skill_name: s for s in user_skills}
    result = []

    for def_s in DEFAULT_SKILLS:
        s_name = def_s["name"]
        if s_name in skills_by_name:
            result.append(skills_by_name[s_name])
        else:
            # Baseline entry
            rec = SkillProgress(
                user_id=current_user.id,
                skill_name=s_name,
                progression_level=def_s["level"],
                level_number=def_s["level_num"],
                hold_duration_sec=def_s["default_hold"],
                repetitions=def_s["default_reps"],
                milestone_status="In Training",
                notes="Baseline calibration milestone",
                updated_at=datetime.datetime.utcnow()
            )
            db.add(rec)
            db.commit()
            db.refresh(rec)
            result.append(rec)

    return result

@router.post("/skill", response_model=SkillProgressResponse)
def log_skill_progress(
    skill_in: SkillProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(SkillProgress).filter(
        SkillProgress.user_id == current_user.id,
        SkillProgress.skill_name == skill_in.skill_name
    ).first()

    if existing:
        existing.progression_level = skill_in.progression_level
        existing.level_number = skill_in.level_number
        existing.hold_duration_sec = skill_in.hold_duration_sec
        existing.repetitions = skill_in.repetitions
        existing.milestone_status = skill_in.milestone_status
        existing.notes = skill_in.notes or existing.notes
        existing.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_skill = SkillProgress(
            user_id=current_user.id,
            skill_name=skill_in.skill_name,
            progression_level=skill_in.progression_level,
            level_number=skill_in.level_number,
            hold_duration_sec=skill_in.hold_duration_sec,
            repetitions=skill_in.repetitions,
            milestone_status=skill_in.milestone_status,
            notes=skill_in.notes or "",
            updated_at=datetime.datetime.utcnow()
        )
        db.add(new_skill)
        db.commit()
        db.refresh(new_skill)
        return new_skill
