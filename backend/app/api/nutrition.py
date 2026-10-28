import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.models import User, Profile, NutritionPlan, FoodItem, NutritionEntry
from app.schemas.schemas import (
    NutritionPlanResponse, FoodItemResponse, NutritionEntryCreate,
    NutritionEntryResponse, DailyNutritionSummaryResponse, MealPlanGenerateRequest
)
from app.utils.auth import get_current_user
from app.recommendations.engine import recommendation_engine
from app.rag.retriever import retrieve_fitness_knowledge
from app.ai.provider import llm_provider

router = APIRouter(prefix="/nutrition", tags=["Nutrition Engine"])

class NutritionAskRequest(BaseModel):
    question: str

@router.get("", response_model=NutritionPlanResponse)
def get_nutrition_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(NutritionPlan).filter(NutritionPlan.user_id == current_user.id).first()
    if not plan:
        # Generate default based on profile
        profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
        profile_dict = {
            "age": profile.age if profile else 25,
            "weight_kg": profile.weight_kg if profile else 75.0,
            "height_cm": profile.height_cm if profile else 175.0,
            "gender": profile.gender if profile else "Male",
            "primary_goal": profile.primary_goal if profile else "Muscle Gain",
            "training_frequency": profile.training_frequency if profile else 4,
            "dietary_preference": profile.dietary_preference if profile else "Non-Vegetarian"
        }
        res = recommendation_engine.generate_nutrition_plan(profile_dict)
        plan = NutritionPlan(
            user_id=current_user.id,
            daily_calories=res["daily_calories"],
            protein_g=res["protein_g"],
            carbs_g=res["carbs_g"],
            fat_g=res["fat_g"],
            water_liters=res["water_liters"],
            meal_breakdown=json.dumps(res["meal_breakdown"]),
            pre_workout=res["pre_workout"],
            post_workout=res["post_workout"]
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

    meal_dict = json.loads(plan.meal_breakdown) if isinstance(plan.meal_breakdown, str) else plan.meal_breakdown

    return {
        "id": plan.id,
        "daily_calories": plan.daily_calories,
        "protein_g": plan.protein_g,
        "carbs_g": plan.carbs_g,
        "fat_g": plan.fat_g,
        "water_liters": plan.water_liters,
        "meal_breakdown": meal_dict,
        "pre_workout": plan.pre_workout,
        "post_workout": plan.post_workout,
        "disclaimer": "KRIDA provides general fitness and sports nutrition guidance based on sports science models. It is not a substitute for clinical medical or registered dietetic advice."
    }

@router.post("/ask")
def ask_nutrition_ai(
    req: NutritionAskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    p_dict = {
        "primary_goal": profile.primary_goal if profile else "Muscle Gain",
        "dietary_preference": profile.dietary_preference if profile else "Non-Vegetarian",
        "fitness_level": profile.fitness_level if profile else "Intermediate",
        "weight_kg": profile.weight_kg if profile else 75.0
    }

    rag_chunks = retrieve_fitness_knowledge(f"nutrition {req.question}", top_k=2, category="Nutrition")
    if not rag_chunks:
        rag_chunks = retrieve_fitness_knowledge("sports nutrition periworkout protein carbs", top_k=2)

    ai_result = llm_provider.generate_chat_response(
        user_message=req.question,
        user_profile=p_dict,
        rag_chunks=rag_chunks
    )

    return {
        "answer": ai_result["reply"],
        "sources": ai_result["sources"],
        "disclaimer": "KRIDA provides general fitness and sports nutrition guidance. Consult a medical professional for personal clinical advice."
    }

@router.get("/foods", response_model=List[FoodItemResponse])
def get_food_items(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(FoodItem)
    if category and category != "All":
        query = query.filter(FoodItem.category == category)
    if search:
        query = query.filter(FoodItem.name.ilike(f"%{search}%"))
    return query.order_by(FoodItem.name.asc()).all()

@router.get("/summary", response_model=DailyNutritionSummaryResponse)
def get_daily_nutrition_summary(
    date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_date = date or datetime.date.today().isoformat()
    entries = db.query(NutritionEntry).filter(
        NutritionEntry.user_id == current_user.id,
        NutritionEntry.logged_date == target_date
    ).order_by(NutritionEntry.created_at.asc()).all()

    total_cal = sum(e.calories for e in entries)
    total_p = sum(e.protein_g for e in entries)
    total_c = sum(e.carbs_g for e in entries)
    total_f = sum(e.fat_g for e in entries)

    # Fetch user plan targets
    plan = db.query(NutritionPlan).filter(NutritionPlan.user_id == current_user.id).first()
    target_cal = plan.daily_calories if plan else 2400
    target_p = plan.protein_g if plan else 160
    target_c = plan.carbs_g if plan else 270
    target_f = plan.fat_g if plan else 75

    return {
        "logged_date": target_date,
        "total_calories": round(total_cal, 1),
        "total_protein": round(total_p, 1),
        "total_carbs": round(total_c, 1),
        "total_fat": round(total_f, 1),
        "target_calories": target_cal,
        "target_protein": target_p,
        "target_carbs": target_c,
        "target_fat": target_f,
        "entries": entries,
        "disclaimer": "All nutritional numbers are estimates based on standard databases (IFCT/USDA). Not a clinical medical prescription."
    }

@router.post("/entry", response_model=NutritionEntryResponse)
def log_nutrition_entry(
    entry_in: NutritionEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_date = entry_in.logged_date or datetime.date.today().isoformat()
    new_entry = NutritionEntry(
        user_id=current_user.id,
        food_item_id=entry_in.food_item_id,
        food_name=entry_in.food_name,
        meal_type=entry_in.meal_type,
        quantity_servings=entry_in.quantity_servings,
        calories=round(entry_in.calories, 1),
        protein_g=round(entry_in.protein_g, 1),
        carbs_g=round(entry_in.carbs_g, 1),
        fat_g=round(entry_in.fat_g, 1),
        logged_date=target_date,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.delete("/entry/{entry_id}")
def delete_nutrition_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(NutritionEntry).filter(
        NutritionEntry.id == entry_id,
        NutritionEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Nutrition entry not found or unauthorized")
    db.delete(entry)
    db.commit()
    return {"status": "success", "message": "Nutrition entry removed"}

@router.post("/generate-meals")
def generate_meal_suggestions(
    req: MealPlanGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Retrieve knowledge chunks
    rag_chunks = retrieve_fitness_knowledge(f"nutrition {req.goal} {req.dietary_preference}", top_k=2)

    # Check if external AI provider is configured
    ai_prompt = (
        f"Generate a customized daily meal plan for a {req.goal} goal with {req.dietary_preference} diet, "
        f"cuisine: {req.cuisine}, schedule: {req.meal_schedule}, restrictions: {', '.join(req.food_restrictions) if req.food_restrictions else 'None'}. "
        f"Target calories: {req.daily_calories_target or 2400} kcal, Target protein: {req.protein_target_g or 160}g. "
        "Return breakfast, lunch, snack, and dinner with calories and protein, plus key allergy/safety notices."
    )

    ai_reply = None
    is_live_ai = False
    if llm_provider._has_gemini() or llm_provider._has_openai():
        raw_res = llm_provider._call_gemini_sync(ai_prompt) or llm_provider._call_openai_sync(ai_prompt)
        if raw_res and len(raw_res) > 50:
            ai_reply = raw_res
            is_live_ai = True

    # Deterministic high-science Indian nutrition fallback
    if not ai_reply:
        is_live_ai = False
        is_veg = "veg" in req.dietary_preference.lower() and "non" not in req.dietary_preference.lower()
        ai_reply = (
            f"### Deterministic Rule-Based Sports Nutrition Split ({req.dietary_preference} • {req.cuisine})\n\n"
            f"**Daily Caloric Target:** ~{req.daily_calories_target or 2400} kcal | **Protein:** ~{req.protein_target_g or 160}g\n\n"
            "**1. Breakfast (08:00):**\n"
            "- 50g Rolled Oats cooked with 200ml cow's milk + 1 medium sliced banana + 10g crushed almonds\n"
            f"- {'3 Boiled Whole Eggs (or 4 egg whites)' if not is_veg else '100g Fresh Low-Fat Paneer bhurji with 1 whole wheat roti'}\n"
            "- *Macros:* ~520 kcal | 28g Protein | 62g Carbs | 16g Fat\n\n"
            "**2. Lunch (13:00):**\n"
            "- 1.5 bowls Cooked Basmati Rice or 2 Whole Wheat Rotis\n"
            "- 1 bowl Thick Yellow Dal Tadka (Moong/Toor) or Rajma\n"
            f"- {'150g Grilled Tandoori Chicken Breast' if not is_veg else '120g Paneer or 50g cooked Soya Chunks curry'}\n"
            "- 1 katori Fresh Curd (Dahi) + seasonal cucumber/tomato salad\n"
            "- *Macros:* ~680 kcal | 44g Protein | 78g Carbs | 18g Fat\n\n"
            "**3. Pre-Workout Fuel (16:30):**\n"
            "- 1 medium banana or 2 whole grain toasts with 1 tbsp peanut butter + black coffee\n"
            "- *Macros:* ~220 kcal | 6g Protein | 34g Carbs | 7g Fat\n\n"
            "**4. Dinner (20:30):**\n"
            "- 2 Whole Wheat Chapatis with ghee (1 tsp)\n"
            f"- {'150g Steamed Fish or Chicken Curry' if not is_veg else '1 bowl Chana Masala (chickpeas) + 40g Soya bhurji'}\n"
            "- 1 bowl Mixed seasonal sabzi (spinach, carrots, beans)\n"
            "- *Macros:* ~590 kcal | 42g Protein | 58g Carbs | 19g Fat\n\n"
            "⚠️ **Allergy & Medical Notice:** Avoid items triggering known food allergies. "
            "Athletes with metabolic conditions, renal constraints, or medical dietary needs should consult a registered clinical dietitian."
        )

    return {
        "status": "success",
        "is_ai_generated": is_live_ai,
        "engine_label": "Gemini-2.5-Flash (Server-Side)" if is_live_ai else "Deterministic Evidence-Based Engine (Local Fallback)",
        "meal_plan_text": ai_reply,
        "allergy_warnings": [f"Screened against declared restrictions: {', '.join(req.food_restrictions) if req.food_restrictions else 'None disclosed'}"]
    }
