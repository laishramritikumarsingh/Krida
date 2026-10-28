import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, Profile, WorkoutPlan, WorkoutSession, WorkoutExercise, NutritionPlan, RecoveryRecord, Recommendation
from app.schemas.schemas import ProfileCreate, ProfileUpdate, ProfileResponse
from app.utils.auth import get_current_user
from app.recommendations.engine import recommendation_engine

router = APIRouter(prefix="/profile", tags=["User Profile & Plan Generation"])

@router.get("", response_model=ProfileResponse)
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "age": profile.age,
        "gender": profile.gender,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "fitness_level": profile.fitness_level,
        "primary_goal": profile.primary_goal,
        "training_experience": profile.training_experience,
        "training_frequency": profile.training_frequency,
        "available_equipment": json.loads(profile.available_equipment) if profile.available_equipment else [],
        "training_preference": profile.training_preference,
        "dietary_preference": profile.dietary_preference,
        "sports_interests": json.loads(profile.sports_interests) if profile.sports_interests else [],
        "schedule_days": json.loads(profile.schedule_days) if profile.schedule_days else [],
        "updated_at": profile.updated_at
    }

@router.put("", response_model=ProfileResponse)
def update_user_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ["available_equipment", "sports_interests", "schedule_days"]:
            setattr(profile, field, json.dumps(value))
        else:
            setattr(profile, field, value)

    profile.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(profile)

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "age": profile.age,
        "gender": profile.gender,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "fitness_level": profile.fitness_level,
        "primary_goal": profile.primary_goal,
        "training_experience": profile.training_experience,
        "training_frequency": profile.training_frequency,
        "available_equipment": json.loads(profile.available_equipment) if profile.available_equipment else [],
        "training_preference": profile.training_preference,
        "dietary_preference": profile.dietary_preference,
        "sports_interests": json.loads(profile.sports_interests) if profile.sports_interests else [],
        "schedule_days": json.loads(profile.schedule_days) if profile.schedule_days else [],
        "updated_at": profile.updated_at
    }

@router.post("/generate-plan")
def generate_krida_plan(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    RAG-driven plan generator triggered upon completing Onboarding.
    Synthesizes scientific periodization, equipment, and sports interests.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    profile.age = profile_data.age
    profile.gender = profile_data.gender or "Not specified"
    profile.height_cm = profile_data.height_cm
    profile.weight_kg = profile_data.weight_kg
    profile.fitness_level = profile_data.fitness_level
    profile.primary_goal = profile_data.primary_goal
    profile.training_experience = profile_data.training_experience
    profile.training_frequency = profile_data.training_frequency
    profile.available_equipment = json.dumps(profile_data.available_equipment)
    profile.training_preference = profile_data.training_preference
    profile.dietary_preference = profile_data.dietary_preference
    profile.sports_interests = json.dumps(profile_data.sports_interests)
    profile.schedule_days = json.dumps(profile_data.schedule_days)
    profile.updated_at = datetime.datetime.utcnow()
    db.commit()

    # Generate workout structure
    plan_dict = recommendation_engine.generate_workout_split({
        "primary_goal": profile_data.primary_goal,
        "fitness_level": profile_data.fitness_level,
        "training_frequency": profile_data.training_frequency,
        "available_equipment": profile_data.available_equipment,
        "training_preference": profile_data.training_preference,
        "sports_interests": profile_data.sports_interests,
        "schedule_days": profile_data.schedule_days
    })

    # Deactivate or delete old workout plans for this user
    old_plans = db.query(WorkoutPlan).filter(WorkoutPlan.user_id == current_user.id).all()
    for p in old_plans:
        p.is_active = False

    new_plan = WorkoutPlan(
        user_id=current_user.id,
        name=plan_dict["name"],
        goal=plan_dict["goal"],
        split_name=plan_dict["split_name"],
        is_active=True
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    for idx, s_data in enumerate(plan_dict["sessions"]):
        session = WorkoutSession(
            workout_plan_id=new_plan.id,
            day_name=s_data["day_name"],
            training_type=s_data["training_type"],
            target_duration_mins=s_data["target_duration_mins"],
            target_intensity=s_data["target_intensity"],
            notes=s_data["notes"],
            order_index=idx
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        for e_idx, ex in enumerate(s_data["exercises"]):
            we = WorkoutExercise(
                workout_session_id=session.id,
                exercise_name=ex["exercise_name"],
                sets=ex["sets"],
                reps=str(ex["reps"]),
                rest_seconds=ex["rest_seconds"],
                intensity=ex["intensity"],
                order_index=e_idx
            )
            db.add(we)
    db.commit()

    # Generate nutrition plan
    nut_dict = recommendation_engine.generate_nutrition_plan({
        "age": profile_data.age,
        "weight_kg": profile_data.weight_kg,
        "height_cm": profile_data.height_cm,
        "gender": profile_data.gender,
        "primary_goal": profile_data.primary_goal,
        "training_frequency": profile_data.training_frequency,
        "dietary_preference": profile_data.dietary_preference
    })

    nut_plan = db.query(NutritionPlan).filter(NutritionPlan.user_id == current_user.id).first()
    if not nut_plan:
        nut_plan = NutritionPlan(user_id=current_user.id)
        db.add(nut_plan)

    nut_plan.daily_calories = nut_dict["daily_calories"]
    nut_plan.protein_g = nut_dict["protein_g"]
    nut_plan.carbs_g = nut_dict["carbs_g"]
    nut_plan.fat_g = nut_dict["fat_g"]
    nut_plan.water_liters = nut_dict["water_liters"]
    nut_plan.meal_breakdown = json.dumps(nut_dict["meal_breakdown"])
    nut_plan.pre_workout = nut_dict["pre_workout"]
    nut_plan.post_workout = nut_dict["post_workout"]
    nut_plan.updated_at = datetime.datetime.utcnow()

    # Create welcome recommendation
    welcome_rec = Recommendation(
        user_id=current_user.id,
        type="workout",
        title=f"Welcome to KRIDA: {plan_dict['split_name']} Active",
        message=f"Your {profile_data.fitness_level} {profile_data.primary_goal} protocol is primed across {profile_data.training_frequency} weekly sessions.",
        why_explanation="Tailored to your equipment and schedule using scientific periodization principles. Progressive overload tracking is now engaged.",
        created_at=datetime.datetime.utcnow()
    )
    db.add(welcome_rec)
    db.commit()

    return {
        "status": "success",
        "message": "Personalized KRIDA plan successfully generated",
        "plan_id": new_plan.id,
        "split_name": plan_dict["split_name"],
        "daily_calories": nut_dict["daily_calories"]
    }
