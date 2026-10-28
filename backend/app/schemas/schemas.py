import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# Auth schemas
class UserCreate(BaseModel):
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_demo: bool
    has_plan: Optional[bool] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Profile schemas
class ProfileCreate(BaseModel):
    age: int = 25
    gender: Optional[str] = "Not specified"
    height_cm: float = 175.0
    weight_kg: float = 75.0
    fitness_level: str = "Intermediate"
    primary_goal: str = "Muscle Gain"
    training_experience: str = "1–3 years"
    training_frequency: int = 4
    available_equipment: List[str] = ["Dumbbells", "Barbell", "Bench"]
    training_preference: str = "Gym"
    dietary_preference: str = "Non-Vegetarian"
    sports_interests: List[str] = ["General Fitness"]
    schedule_days: List[str] = ["Monday", "Tuesday", "Thursday", "Friday"]

class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    fitness_level: Optional[str] = None
    primary_goal: Optional[str] = None
    training_experience: Optional[str] = None
    training_frequency: Optional[int] = None
    available_equipment: Optional[List[str]] = None
    training_preference: Optional[str] = None
    dietary_preference: Optional[str] = None
    sports_interests: Optional[List[str]] = None
    schedule_days: Optional[List[str]] = None

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    fitness_level: str
    primary_goal: str
    training_experience: str
    training_frequency: int
    available_equipment: List[str]
    training_preference: str
    dietary_preference: str
    sports_interests: List[str]
    schedule_days: List[str]
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Exercise schemas
class ExerciseResponse(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    target_muscles: List[str] = []
    equipment_needed: str
    difficulty: str
    movement_type: str
    instructions: str
    sets_reps_recommendation: str

    class Config:
        from_attributes = True

# Workout schemas
class WorkoutExerciseResponse(BaseModel):
    id: int
    exercise_id: Optional[int] = None
    exercise_name: str
    sets: int
    reps: str
    rest_seconds: int
    intensity: str
    order_index: int
    equipment_needed: Optional[str] = "Dumbbells"

    class Config:
        from_attributes = True

class WorkoutSessionResponse(BaseModel):
    id: int
    day_name: str
    training_type: str
    target_duration_mins: int
    target_intensity: str
    notes: Optional[str] = ""
    order_index: int
    exercises: List[WorkoutExerciseResponse] = []

    class Config:
        from_attributes = True

class WorkoutPlanResponse(BaseModel):
    id: int
    name: str
    goal: str
    split_name: str
    is_active: bool
    created_at: datetime.datetime
    sessions: List[WorkoutSessionResponse] = []

    class Config:
        from_attributes = True

class WorkoutLogCreate(BaseModel):
    workout_session_id: Optional[int] = None
    exercise_id: Optional[int] = None
    exercise_name: str
    sets_completed: int = 3
    reps_completed: List[int] = [10, 10, 10]
    weight_kg: List[float] = [20.0, 20.0, 20.0]
    notes: Optional[str] = ""
    rpe: Optional[float] = 8.0

class WorkoutLogResponse(BaseModel):
    id: int
    exercise_name: str
    sets_completed: int
    reps_completed: List[int]
    weight_kg: List[float]
    notes: Optional[str]
    rpe: float
    completed_at: datetime.datetime

    class Config:
        from_attributes = True

class ExerciseReplaceRequest(BaseModel):
    workout_session_id: int
    current_exercise_name: str
    reason: Optional[str] = "Equipment unavailable or variation requested"

class ExerciseReplaceResponse(BaseModel):
    original_exercise: str
    recommended_replacement: str
    alternative_options: List[str]
    why_explanation: str
    adjusted_sets: int
    adjusted_reps: str

# Nutrition schemas
class MealItem(BaseModel):
    name: str
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    notes: Optional[str] = ""

class NutritionPlanResponse(BaseModel):
    id: int
    daily_calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    water_liters: float
    meal_breakdown: Dict[str, Any]
    pre_workout: str
    post_workout: str
    disclaimer: str = "KRIDA provides general fitness and sports nutrition guidance based on sports science models. It is not a substitute for clinical medical or registered dietetic advice."

# Progress schemas
class ProgressRecordCreate(BaseModel):
    weight_kg: float
    bench_press_1rm: Optional[float] = None
    squat_1rm: Optional[float] = None
    deadlift_1rm: Optional[float] = None
    running_5k_mins: Optional[float] = None
    notes: Optional[str] = ""

class ProgressRecordResponse(BaseModel):
    id: int
    recorded_at: datetime.datetime
    weight_kg: float
    estimated_1rm: Dict[str, float]
    volume_kg: float
    running_5k_mins: Optional[float]
    consistency_score: float
    notes: Optional[str]

    class Config:
        from_attributes = True

class ProgressAnalyticsResponse(BaseModel):
    weight_history: List[Dict[str, Any]]
    strength_history: List[Dict[str, Any]]
    volume_history: List[Dict[str, Any]]
    consistency_rate: float
    total_workouts_completed: int
    personal_records: Dict[str, Any]

# Recovery schemas
class RecoveryStatusResponse(BaseModel):
    recovery_score: int
    fatigue_level: int
    sleep_hours: float
    strain_score: float
    status_text: str
    recommendation: str
    readiness_level: str # Optimal, Moderate, Deload Recommended

class RecoveryRecordCreate(BaseModel):
    fatigue_level: int = 4
    sleep_hours: float = 7.5
    soreness_level: Optional[int] = 3

# Chat schemas
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    sources: List[Dict[str, str]] = []
    suggested_followups: List[str] = []

class ChatMessageItem(BaseModel):
    id: int
    role: str
    content: str
    sources: List[Dict[str, str]] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Overload recommendation schemas
class RecommendationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    why_explanation: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# Goals & Reports Schemas
class FitnessGoalCreate(BaseModel):
    category: str = "strength"  # strength, endurance, physique, skill, consistency
    title: str
    target_value: float
    current_value: Optional[float] = 0.0
    unit: str = "kg"
    deadline: str = "8 Weeks"
    notes: Optional[str] = ""

class FitnessGoalUpdate(BaseModel):
    title: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None  # in_progress, achieved
    notes: Optional[str] = None

class FitnessGoalResponse(BaseModel):
    id: int
    user_id: int
    category: str
    title: str
    current_value: float
    target_value: float
    unit: str
    deadline: str
    status: str
    notes: Optional[str]
    progress_percentage: float = 0.0
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# Food & Nutrition Logging Schemas
class FoodItemResponse(BaseModel):
    id: int
    name: str
    category: str
    serving_size: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    is_indian_staple: bool
    provenance: str
    allergens: str

    class Config:
        from_attributes = True

class NutritionEntryCreate(BaseModel):
    food_item_id: Optional[int] = None
    food_name: str
    meal_type: str  # Breakfast, Lunch, Dinner, Snack
    quantity_servings: float = 1.0
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    logged_date: Optional[str] = None  # YYYY-MM-DD

class NutritionEntryResponse(BaseModel):
    id: int
    user_id: int
    food_item_id: Optional[int]
    food_name: str
    meal_type: str
    quantity_servings: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    logged_date: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class DailyNutritionSummaryResponse(BaseModel):
    logged_date: str
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    target_calories: int
    target_protein: int
    target_carbs: int
    target_fat: int
    entries: List[NutritionEntryResponse]
    disclaimer: str = "All macronutrient and caloric values are estimates based on standard nutritional databases (IFCT/USDA). Not a clinical medical prescription."

class MealPlanGenerateRequest(BaseModel):
    dietary_preference: str = "Vegetarian"  # Vegetarian, Non-Vegetarian, Vegan, Eggetarian
    food_restrictions: List[str] = []  # e.g. ["Lactose Intolerant", "Nut Allergy", "Gluten Sensitive"]
    cuisine: str = "Indian"  # Indian, Mediterranean, High-Protein Global
    meal_schedule: str = "4 meals (Breakfast, Lunch, Pre-Workout, Dinner)"
    daily_calories_target: Optional[int] = None
    protein_target_g: Optional[int] = None
    goal: str = "Muscle Gain"


# Calisthenics Skill Schemas
class SkillProgressCreate(BaseModel):
    skill_name: str
    progression_level: str
    level_number: int = 1
    hold_duration_sec: float = 0.0
    repetitions: int = 0
    milestone_status: str = "In Training"  # In Training, Mastered
    notes: Optional[str] = ""

class SkillProgressResponse(BaseModel):
    id: int
    user_id: int
    skill_name: str
    progression_level: str
    level_number: int
    hold_duration_sec: float
    repetitions: int
    milestone_status: str
    notes: Optional[str]
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


# HYROX / Conditioning Schemas
class ConditioningSessionCreate(BaseModel):
    session_type: str = "HYROX Conditioning Simulation"
    title: str
    distance_meters: float = 0.0
    duration_seconds: int = 0
    rounds_completed: int = 1
    rest_seconds: int = 60
    stations_data_json: str = "[]"
    notes: Optional[str] = ""

class ConditioningSessionResponse(BaseModel):
    id: int
    user_id: int
    session_type: str
    title: str
    distance_meters: float
    duration_seconds: int
    rounds_completed: int
    rest_seconds: int
    stations_data_json: str
    notes: Optional[str]
    completed_at: datetime.datetime

    class Config:
        from_attributes = True


# Detailed AI Workout Plan Generation Request Schema (Page 06)
class AIPlanGenerateRequest(BaseModel):
    age: int = Field(default=26, ge=16, le=90)
    fitness_experience: str = "1–3 years"  # < 3 months, 3–12 months, 1–3 years, 3+ years
    goals: str = "Hypertrophy & Strength"
    training_type: str = "Hybrid Gym & Conditioning"  # Gym, Calisthenics, HYROX, Running, Hybrid
    days_per_week: int = Field(default=4, ge=2, le=7)
    session_duration_mins: int = Field(default=60, ge=20, le=120)
    available_equipment: List[str] = ["Dumbbells", "Barbell", "Bench", "Pull-up Bar"]
    injuries_limitations: Optional[str] = "None"
    preferences: Optional[str] = "Focus on compound movements and progressive overload"
    recovery_capacity: str = "Good (7-8 hours sleep)"

