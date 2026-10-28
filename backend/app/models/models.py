import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    workout_plans = relationship("WorkoutPlan", back_populates="user", cascade="all, delete-orphan")
    workout_logs = relationship("WorkoutLog", back_populates="user", cascade="all, delete-orphan")
    nutrition_plan = relationship("NutritionPlan", back_populates="user", uselist=False, cascade="all, delete-orphan")
    progress_records = relationship("ProgressRecord", back_populates="user", cascade="all, delete-orphan")
    recovery_records = relationship("RecoveryRecord", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")
    fitness_goals = relationship("FitnessGoal", back_populates="user", cascade="all, delete-orphan")
    nutrition_entries = relationship("NutritionEntry", back_populates="user", cascade="all, delete-orphan")
    skill_progress = relationship("SkillProgress", back_populates="user", cascade="all, delete-orphan")
    conditioning_sessions = relationship("ConditioningSession", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    age = Column(Integer, default=25)
    gender = Column(String(50), default="Not specified")
    height_cm = Column(Float, default=175.0)
    weight_kg = Column(Float, default=75.0)
    fitness_level = Column(String(50), default="Intermediate") # Beginner, Intermediate, Advanced
    primary_goal = Column(String(100), default="Muscle Gain") # Fat Loss, Muscle Gain, Body Recomposition, Strength, Endurance, General Fitness, Sports Performance
    training_experience = Column(String(50), default="1–3 years") # < 3 months, 3–12 months, 1–3 years, 3+ years
    training_frequency = Column(Integer, default=4) # 2 - 7 days
    available_equipment = Column(Text, default='["Dumbbells", "Barbell", "Bench"]') # JSON list string
    training_preference = Column(String(100), default="Gym") # Gym, Calisthenics, Running, Hyrox, Cycling, Swimming, Mixed Training
    dietary_preference = Column(String(50), default="Non-Vegetarian") # Vegetarian, Non-Vegetarian, Vegan, Eggetarian, No Preference
    sports_interests = Column(Text, default='["General Fitness"]') # JSON list string
    schedule_days = Column(Text, default='["Monday", "Tuesday", "Thursday", "Friday"]') # JSON list string
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True) # Chest, Back, Legs, Shoulders, Arms, Core, Full Body, Cardio, Hyrox
    target_muscles = Column(Text, default="[]") # JSON list
    equipment_needed = Column(String(100), default="Bodyweight") # Bodyweight, Dumbbells, Barbell, Cable, Machine, etc.
    difficulty = Column(String(50), default="Intermediate") # Beginner, Intermediate, Advanced
    movement_type = Column(String(50), default="Compound") # Compound, Isolation, Conditioning, Calisthenics
    instructions = Column(Text, default="")
    sets_reps_recommendation = Column(String(100), default="3-4 sets x 8-12 reps")


class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(150), default="Custom Adaptive Split")
    goal = Column(String(100), default="Muscle Gain")
    split_name = Column(String(100), default="Upper / Lower")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="workout_plans")
    sessions = relationship("WorkoutSession", back_populates="workout_plan", cascade="all, delete-orphan")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    workout_plan_id = Column(Integer, ForeignKey("workout_plans.id"), nullable=False)
    day_name = Column(String(50), nullable=False) # Monday, Tuesday, etc.
    training_type = Column(String(100), nullable=False) # e.g., "Upper Body Hypertrophy", "Hyrox Engine", "Legs & Core"
    target_duration_mins = Column(Integer, default=55)
    target_intensity = Column(String(50), default="Moderate-High")
    notes = Column(Text, default="")
    order_index = Column(Integer, default=0)

    workout_plan = relationship("WorkoutPlan", back_populates="sessions")
    exercises = relationship("WorkoutExercise", back_populates="workout_session", cascade="all, delete-orphan")


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=True)
    exercise_name = Column(String(150), nullable=False)
    sets = Column(Integer, default=3)
    reps = Column(String(50), default="8-12")
    rest_seconds = Column(Integer, default=90)
    intensity = Column(String(50), default="RPE 8")
    order_index = Column(Integer, default=0)

    workout_session = relationship("WorkoutSession", back_populates="exercises")
    exercise = relationship("Exercise")


class WorkoutLog(Base):
    __tablename__ = "workout_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=True)
    exercise_name = Column(String(150), nullable=False)
    sets_completed = Column(Integer, default=3)
    reps_completed = Column(Text, default="[10, 10, 10]") # JSON list
    weight_kg = Column(Text, default="[50.0, 50.0, 50.0]") # JSON list
    notes = Column(Text, default="")
    rpe = Column(Float, default=8.0) # Rate of Perceived Exertion (1-10)
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="workout_logs")


class NutritionPlan(Base):
    __tablename__ = "nutrition_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    daily_calories = Column(Integer, default=2400)
    protein_g = Column(Integer, default=160)
    carbs_g = Column(Integer, default=270)
    fat_g = Column(Integer, default=75)
    water_liters = Column(Float, default=3.2)
    meal_breakdown = Column(Text, default="{}") # JSON details: breakfast, lunch, dinner, snacks
    pre_workout = Column(Text, default="")
    post_workout = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="nutrition_plan")


class ProgressRecord(Base):
    __tablename__ = "progress_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    weight_kg = Column(Float, nullable=False)
    estimated_1rm = Column(Text, default="{}") # JSON: {"Bench Press": 80.0, "Squat": 110.0, "Deadlift": 140.0}
    volume_kg = Column(Float, default=0.0) # total tonnage lifted
    running_5k_mins = Column(Float, nullable=True) # optional 5k PR in mins
    consistency_score = Column(Float, default=85.0) # 0-100%
    notes = Column(Text, default="")

    user = relationship("User", back_populates="progress_records")


class RecoveryRecord(Base):
    __tablename__ = "recovery_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    recovery_score = Column(Integer, default=82) # 0-100
    fatigue_level = Column(Integer, default=4) # 1-10
    sleep_hours = Column(Float, default=7.5)
    strain_score = Column(Float, default=12.5) # 0-21 (WHOOP-style day strain)
    status_text = Column(String(200), default="Primed for performance. Optimal nervous system recovery.")
    recommendation = Column(Text, default="Maintain planned workout intensity. Hydrate with 500ml electrolyte water pre-session.")

    user = relationship("User", back_populates="recovery_records")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False) # user or assistant
    content = Column(Text, nullable=False)
    sources = Column(Text, default="[]") # JSON list of cited RAG knowledge chunks
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(100), index=True) # Hypertrophy, Overload, Hyrox, Running, Calisthenics, Nutrition, Recovery
    chunk_text = Column(Text, nullable=False)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), default="workout") # workout, overload, nutrition, recovery, sports
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    why_explanation = Column(Text, default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="recommendations")


class FitnessGoal(Base):
    __tablename__ = "fitness_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), default="strength")  # strength, endurance, physique, skill, consistency
    title = Column(String(200), nullable=False)
    current_value = Column(Float, default=0.0)
    target_value = Column(Float, nullable=False)
    unit = Column(String(50), default="kg")
    deadline = Column(String(100), default="8 Weeks")
    status = Column(String(50), default="in_progress")  # in_progress, achieved
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="fitness_goals")


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True)  # Grains, Pulses, Dairy, Meat/Eggs, Fruits/Veg, Soya/Protein
    serving_size = Column(String(100), nullable=False)  # e.g. "1 bowl (150g)", "1 medium (40g)", "100g"
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)
    is_indian_staple = Column(Boolean, default=True)
    provenance = Column(String(150), default="IFCT / USDA National Nutrient Database")
    allergens = Column(String(150), default="None")


class NutritionEntry(Base):
    __tablename__ = "nutrition_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id"), nullable=True)
    food_name = Column(String(150), nullable=False)
    meal_type = Column(String(50), nullable=False)  # Breakfast, Lunch, Dinner, Snack
    quantity_servings = Column(Float, default=1.0)
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    carbs_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)
    logged_date = Column(String(20), nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="nutrition_entries")
    food_item = relationship("FoodItem")


class SkillProgress(Base):
    __tablename__ = "skill_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_name = Column(String(100), nullable=False)  # Push-ups, Pull-ups, Dips, Handstands, L-sits, Front Lever, Muscle-up
    progression_level = Column(String(100), nullable=False)  # e.g. "Tuck Front Lever", "Strict Bar Muscle-Up"
    level_number = Column(Integer, default=1)
    hold_duration_sec = Column(Float, default=0.0)
    repetitions = Column(Integer, default=0)
    milestone_status = Column(String(50), default="In Training")  # In Training, Mastered
    notes = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="skill_progress")


class ConditioningSession(Base):
    __tablename__ = "conditioning_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_type = Column(String(100), nullable=False)  # HYROX Station Simulation, 5K Threshold, Intervals, Aerobic Base
    title = Column(String(200), nullable=False)
    distance_meters = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    rounds_completed = Column(Integer, default=1)
    rest_seconds = Column(Integer, default=60)
    stations_data_json = Column(Text, default="[]")  # JSON details of stations
    notes = Column(Text, default="")
    completed_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="conditioning_sessions")
