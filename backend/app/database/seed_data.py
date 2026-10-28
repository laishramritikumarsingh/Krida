import json
import datetime
from sqlalchemy.orm import Session
from app.models.models import (
    User, Profile, Exercise, WorkoutPlan, WorkoutSession, WorkoutExercise,
    WorkoutLog, NutritionPlan, ProgressRecord, RecoveryRecord, Recommendation,
    FoodItem, FitnessGoal, SkillProgress, NutritionEntry
)
from app.utils.security import hash_password
from app.recommendations.engine import recommendation_engine

EXERCISES_DATA = [
    # Chest
    {"name": "Barbell Bench Press", "category": "Chest", "target_muscles": ["Pectoralis Major", "Triceps", "Anterior Deltoid"], "equipment_needed": "Barbell", "difficulty": "Intermediate", "movement_type": "Compound", "instructions": "Retract scapulae, maintain arched back with feet planted, lower bar to mid-chest with elbows at 45 degrees, press explosively.", "sets_reps_recommendation": "4 sets × 6-10 reps"},
    {"name": "Flat Dumbbell Press", "category": "Chest", "target_muscles": ["Pectoralis Major", "Triceps", "Anterior Deltoid"], "equipment_needed": "Dumbbells", "difficulty": "Intermediate", "movement_type": "Compound", "instructions": "Lie on bench, press dumbbells with semi-neutral grip, feeling full stretch at bottom without flaring shoulders.", "sets_reps_recommendation": "3-4 sets × 8-12 reps"},
    {"name": "Incline Dumbbell Press", "category": "Chest", "target_muscles": ["Clavicular Pectoral", "Anterior Deltoid", "Triceps"], "equipment_needed": "Dumbbells", "difficulty": "Intermediate", "movement_type": "Compound", "instructions": "Set bench at 30 degrees, press dumbbells overhead keeping wrist stacked above elbows, slow 3s eccentric.", "sets_reps_recommendation": "3-4 sets × 8-12 reps"},
    {"name": "Push-ups", "category": "Chest", "target_muscles": ["Pectoralis Major", "Core", "Triceps"], "equipment_needed": "Bodyweight", "difficulty": "Beginner", "movement_type": "Calisthenics", "instructions": "Hands slightly wider than shoulder width, lock core, lower chest until 1 inch from ground, push up through palms.", "sets_reps_recommendation": "3 sets × 15-25 reps"},
    {"name": "Cable Chest Flyes", "category": "Chest", "target_muscles": ["Pectoralis Major (Sternal & Clavicular)"], "equipment_needed": "Cable Machine", "difficulty": "Intermediate", "movement_type": "Isolation", "instructions": "Slight forward lean, bring hands together in wide hugging arc, squeeze pecs for 1 second at peak contraction.", "sets_reps_recommendation": "3 sets × 12-15 reps"},

    # Back
    {"name": "Barbell Bent-Over Row", "category": "Back", "target_muscles": ["Latissimus Dorsi", "Rhomboids", "Trapezius", "Biceps"], "equipment_needed": "Barbell", "difficulty": "Intermediate", "movement_type": "Compound", "instructions": "Hinge at hips to 45 degrees, pull barbell to lower ribcage keeping elbows tucked, squeeze scapulae.", "sets_reps_recommendation": "4 sets × 8-10 reps"},
    {"name": "Dumbbell Bent-Over Row", "category": "Back", "target_muscles": ["Latissimus Dorsi", "Rear Deltoid", "Rhomboids"], "equipment_needed": "Dumbbells", "difficulty": "Intermediate", "movement_type": "Compound", "instructions": "Hinge forward with flat spine, pull dumbbells towards hips with neutral grip, controlled descent.", "sets_reps_recommendation": "3-4 sets × 10-12 reps"},
    {"name": "Strict Pull-ups", "category": "Back", "target_muscles": ["Latissimus Dorsi", "Teres Major", "Biceps", "Core"], "equipment_needed": "Pull-up Bar", "difficulty": "Advanced", "movement_type": "Calisthenics", "instructions": "Overhand grip, initiate pull with scapular depression, drive chest toward bar without kicking legs.", "sets_reps_recommendation": "4 sets × 6-10 reps"},
    {"name": "Lat Pulldown", "category": "Back", "target_muscles": ["Latissimus Dorsi", "Biceps"], "equipment_needed": "Cable Machine", "difficulty": "Beginner", "movement_type": "Compound", "instructions": "Grip wide bar, pull down smoothly to upper chest, avoid excessive backward swinging.", "sets_reps_recommendation": "3 sets × 10-12 reps"},
    {"name": "Chest-Supported Row", "category": "Back", "target_muscles": ["Upper Back", "Rhomboids", "Mid Trapezius"], "equipment_needed": "Dumbbells", "difficulty": "Beginner", "movement_type": "Isolation", "instructions": "Set incline bench, rest chest on pad to eliminate lumbar strain, pull dumbbells upward with flared elbows.", "sets_reps_recommendation": "3 sets × 12-15 reps"},

    # Legs
    {"name": "Barbell Back Squat", "category": "Legs", "target_muscles": ["Quadriceps", "Gluteus Maximus", "Adductors", "Core"], "equipment_needed": "Barbell", "difficulty": "Advanced", "movement_type": "Compound", "instructions": "Bar rested on upper traps, brace core 360 degrees, sit hips down and back past parallel, drive up evenly through midfoot.", "sets_reps_recommendation": "4 sets × 6-8 reps"},
    {"name": "Dumbbell Goblet Squat", "category": "Legs", "target_muscles": ["Quadriceps", "Gluteus Maximus", "Core"], "equipment_needed": "Dumbbells", "difficulty": "Beginner", "movement_type": "Compound", "instructions": "Hold single dumbbell vertically at sternum, squat deep between knees, chest tall.", "sets_reps_recommendation": "3-4 sets × 10-12 reps"},
    {"name": "Barbell Romanian Deadlift", "category": "Legs", "target_muscles": ["Hamstrings", "Gluteus Maximus", "Erector Spinae"], "equipment_needed": "Barbell", "difficulty": "Intermediate", "movement_type": "Compound", "instructions": "Slight knee bend, push hips directly back while shaving barbell down shins, feel deep hamstring stretch, thrust hips forward.", "sets_reps_recommendation": "3-4 sets × 8-10 reps"},
    {"name": "Dumbbell Romanian Deadlift", "category": "Legs", "target_muscles": ["Hamstrings", "Glutes"], "equipment_needed": "Dumbbells", "difficulty": "Intermediate", "movement_type": "Compound", "instructions": "Hinge at hips holding dumbbells in front of thighs, maintain flat back, squeeze glutes at top.", "sets_reps_recommendation": "3-4 sets × 10-12 reps"},
    {"name": "Bulgarian Split Squats", "category": "Legs", "target_muscles": ["Quadriceps", "Gluteus Medius"], "equipment_needed": "Dumbbells", "difficulty": "Advanced", "movement_type": "Compound", "instructions": "Rear foot elevated on bench, descend front knee down until parallel to floor, maintain vertical shin.", "sets_reps_recommendation": "3 sets × 8-12 each leg"},
    {"name": "Leg Press", "category": "Legs", "target_muscles": ["Quadriceps", "Glutes"], "equipment_needed": "Machines", "difficulty": "Beginner", "movement_type": "Compound", "instructions": "Feet shoulder-width on carriage platform, lower sled with controlled tempo, push through heels without locking knees.", "sets_reps_recommendation": "3-4 sets × 10-15 reps"},
    {"name": "Walking Lunges", "category": "Legs", "target_muscles": ["Quadriceps", "Glutes", "Hamstrings"], "equipment_needed": "Bodyweight", "difficulty": "Beginner", "movement_type": "Conditioning", "instructions": "Step forward with long stride, lower trailing knee to kiss ground softly, drive up into next stride.", "sets_reps_recommendation": "3 sets × 20 strides"},

    # Shoulders & Arms
    {"name": "Overhead Barbell Press", "category": "Shoulders", "target_muscles": ["Anterior Deltoid", "Lateral Deltoid", "Triceps", "Traps"], "equipment_needed": "Barbell", "difficulty": "Intermediate", "movement_type": "Compound", "instructions": "Stand tall, squeeze glutes, press bar straight up over crown of head, shrugging slightly at top.", "sets_reps_recommendation": "3-4 sets × 6-8 reps"},
    {"name": "Seated Dumbbell Shoulder Press", "category": "Shoulders", "target_muscles": ["Anterior Deltoid", "Lateral Deltoid", "Triceps"], "equipment_needed": "Dumbbells", "difficulty": "Beginner", "movement_type": "Compound", "instructions": "Sit upright, press dumbbells vertically without banging them together, control lowering.", "sets_reps_recommendation": "3 sets × 8-12 reps"},
    {"name": "Dumbbell Lateral Raises", "category": "Shoulders", "target_muscles": ["Lateral Deltoid"], "equipment_needed": "Dumbbells", "difficulty": "Beginner", "movement_type": "Isolation", "instructions": "Slight forward torso tilt, raise dumbbells to shoulder height leading with elbows, pause 0.5s.", "sets_reps_recommendation": "4 sets × 12-15 reps"},
    {"name": "Incline Dumbbell Bicep Curls", "category": "Arms", "target_muscles": ["Biceps Brachii (Long Head)"], "equipment_needed": "Dumbbells", "difficulty": "Beginner", "movement_type": "Isolation", "instructions": "Sit back on 45-degree incline, allow arms to hang behind torso for maximum long-head stretch, curl smoothly.", "sets_reps_recommendation": "3 sets × 10-12 reps"},
    {"name": "Overhead Triceps Extension", "category": "Arms", "target_muscles": ["Triceps (Long Head)"], "equipment_needed": "Dumbbells", "difficulty": "Beginner", "movement_type": "Isolation", "instructions": "Hold dumbbell overhead with both hands, bend elbows backward deep behind head, extend upwards.", "sets_reps_recommendation": "3 sets × 12-15 reps"},
    {"name": "Parallel Bar Dips", "category": "Arms", "target_muscles": ["Triceps", "Pectorals", "Anterior Deltoids"], "equipment_needed": "Bodyweight", "difficulty": "Intermediate", "movement_type": "Calisthenics", "instructions": "Lower body until elbows reach 90 degrees, keep torso slightly tilted for chest or upright for triceps.", "sets_reps_recommendation": "3 sets × 8-12 reps"},

    # HYROX & Conditioning
    {"name": "Sled Push", "category": "Hyrox", "target_muscles": ["Quadriceps", "Calves", "Glutes", "Core"], "equipment_needed": "Full Gym", "difficulty": "Advanced", "movement_type": "Conditioning", "instructions": "Arms locked or bent against upright poles, drive toes aggressively into turf in rapid sprint mechanics.", "sets_reps_recommendation": "4 rounds × 25m"},
    {"name": "Sled Pull", "category": "Hyrox", "target_muscles": ["Back", "Hamstrings", "Biceps", "Forearms"], "equipment_needed": "Full Gym", "difficulty": "Advanced", "movement_type": "Conditioning", "instructions": "Stand within lane box, hand-over-hand pull using hip hinge and back extension power.", "sets_reps_recommendation": "4 rounds × 25m"},
    {"name": "Wall Balls", "category": "Hyrox", "target_muscles": ["Quadriceps", "Shoulders", "Core"], "equipment_needed": "Dumbbells", "difficulty": "Intermediate", "movement_type": "Conditioning", "instructions": "Hold medicine ball or dumbbell at chest, perform full deep squat, throw ball aggressively to 9-10ft target on ascent.", "sets_reps_recommendation": "4 sets × 20 reps"},
    {"name": "Burpee Broad Jumps", "category": "Hyrox", "target_muscles": ["Full Body", "Cardiovascular"], "equipment_needed": "Bodyweight", "difficulty": "Intermediate", "movement_type": "Conditioning", "instructions": "Chest to floor burpee, jump forward with two-footed broad jump landing softly in athletic squat.", "sets_reps_recommendation": "3 sets × 15 reps"},
    {"name": "Farmers Carry", "category": "Hyrox", "target_muscles": ["Forearms", "Traps", "Core Stability"], "equipment_needed": "Dumbbells", "difficulty": "Intermediate", "movement_type": "Conditioning", "instructions": "Deadlift heavy dumbbells, walk tall with tight abdominal wall, preventing lateral swaying.", "sets_reps_recommendation": "3 rounds × 50m"},
    {"name": "SkiErg / Rowing Ergometer", "category": "Hyrox", "target_muscles": ["Lats", "Core", "Hamstrings", "Cardiovascular"], "equipment_needed": "Machines", "difficulty": "Intermediate", "movement_type": "Conditioning", "instructions": "Full hip extension and explosive pull, cycling at 28-32 strokes/min for targeted split pacing.", "sets_reps_recommendation": "4 × 500m intervals"},

    # Running & Calisthenics
    {"name": "Zone 2 Base Run", "category": "Cardio", "target_muscles": ["Cardiovascular", "Legs"], "equipment_needed": "Bodyweight", "difficulty": "Beginner", "movement_type": "Conditioning", "instructions": "Maintain comfortable conversational pace below 75% max heart rate for 35-50 minutes.", "sets_reps_recommendation": "1 session × 40 mins"},
    {"name": "5K Threshold Tempo Run", "category": "Cardio", "target_muscles": ["Cardiovascular", "Lactate Buffering"], "equipment_needed": "Bodyweight", "difficulty": "Intermediate", "movement_type": "Conditioning", "instructions": "Run 20 minutes at sustained comfortably hard pace (lactate threshold LT2).", "sets_reps_recommendation": "1 session × 25 mins"},
    {"name": "Hollow Body Hold", "category": "Core", "target_muscles": ["Rectus Abdominis", "Transverse Abdominis"], "equipment_needed": "Bodyweight", "difficulty": "Intermediate", "movement_type": "Calisthenics", "instructions": "Lower back pinned flat to ground, arms extended overhead, legs straight and hovering 6 inches high.", "sets_reps_recommendation": "3 sets × 45-60 sec"},
    {"name": "Handstand Wall Walks", "category": "Core", "target_muscles": ["Shoulders", "Scapular Stabilizers", "Core"], "equipment_needed": "Bodyweight", "difficulty": "Intermediate", "movement_type": "Calisthenics", "instructions": "Start in pushup position against wall, walk feet up while walking hands closer to wall into inverted hold.", "sets_reps_recommendation": "3 sets × 30-45 sec"}
]

FOOD_ITEMS_DATA = [
    # Grains & Breads
    {"name": "Cooked Basmati Rice", "category": "Grains", "serving_size": "1 bowl (150g)", "calories": 195.0, "protein_g": 4.1, "carbs_g": 42.0, "fat_g": 0.5, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "None"},
    {"name": "Whole Wheat Roti / Chapati", "category": "Grains", "serving_size": "1 medium (40g)", "calories": 104.0, "protein_g": 3.4, "carbs_g": 22.0, "fat_g": 0.5, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "Gluten"},
    {"name": "Brown Rice (Cooked)", "category": "Grains", "serving_size": "1 bowl (150g)", "calories": 168.0, "protein_g": 3.8, "carbs_g": 35.0, "fat_g": 1.4, "is_indian_staple": True, "provenance": "IFCT / USDA Database", "allergens": "None"},
    {"name": "Rolled Oats (Dry)", "category": "Grains", "serving_size": "40g serving", "calories": 156.0, "protein_g": 5.3, "carbs_g": 27.0, "fat_g": 2.8, "is_indian_staple": True, "provenance": "USDA Food Data Central", "allergens": "Gluten (unless certified GF)"},
    
    # Pulses & Legumes
    {"name": "Yellow Moong / Toor Dal (Cooked Tadka)", "category": "Pulses", "serving_size": "1 katori / bowl (150g)", "calories": 150.0, "protein_g": 9.0, "carbs_g": 22.5, "fat_g": 3.2, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "None"},
    {"name": "Rajma / Kidney Bean Curry", "category": "Pulses", "serving_size": "1 bowl (150g)", "calories": 180.0, "protein_g": 10.5, "carbs_g": 28.0, "fat_g": 2.5, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "None"},
    {"name": "Chana Masala (Chickpeas)", "category": "Pulses", "serving_size": "1 bowl (150g)", "calories": 195.0, "protein_g": 10.2, "carbs_g": 31.0, "fat_g": 3.8, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "None"},
    {"name": "Sprouted Moong Salad", "category": "Pulses", "serving_size": "1 bowl (100g)", "calories": 105.0, "protein_g": 7.5, "carbs_g": 18.0, "fat_g": 0.8, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "None"},

    # Dairy & Vegetarian Protein
    {"name": "Fresh Paneer (Cottage Cheese)", "category": "Dairy", "serving_size": "100g", "calories": 265.0, "protein_g": 18.3, "carbs_g": 3.6, "fat_g": 20.8, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "Dairy / Lactose"},
    {"name": "Low-Fat Paneer", "category": "Dairy", "serving_size": "100g", "calories": 160.0, "protein_g": 25.0, "carbs_g": 4.0, "fat_g": 5.0, "is_indian_staple": True, "provenance": "Verified Dairy Composition Data", "allergens": "Dairy / Lactose"},
    {"name": "Fresh Curd / Dahi", "category": "Dairy", "serving_size": "1 katori (100g)", "calories": 61.0, "protein_g": 3.5, "carbs_g": 4.7, "fat_g": 3.1, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "Dairy / Lactose"},
    {"name": "Cow's Milk (Toned)", "category": "Dairy", "serving_size": "1 glass (200ml)", "calories": 122.0, "protein_g": 6.2, "carbs_g": 9.6, "fat_g": 6.0, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "Dairy / Lactose"},
    {"name": "Soya Chunks (Nutrela / Raw)", "category": "Soya/Protein", "serving_size": "50g dry", "calories": 172.0, "protein_g": 26.0, "carbs_g": 16.5, "fat_g": 0.5, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "Soy"},
    {"name": "Tofu (Firm)", "category": "Soya/Protein", "serving_size": "100g", "calories": 144.0, "protein_g": 15.5, "carbs_g": 2.5, "fat_g": 8.0, "is_indian_staple": True, "provenance": "USDA Food Data Central", "allergens": "Soy"},

    # Meat & Eggs
    {"name": "Whole Boiled Egg", "category": "Meat/Eggs", "serving_size": "1 large egg (50g)", "calories": 74.0, "protein_g": 6.3, "carbs_g": 0.4, "fat_g": 5.0, "is_indian_staple": True, "provenance": "USDA Food Data Central", "allergens": "Egg"},
    {"name": "Egg Whites", "category": "Meat/Eggs", "serving_size": "3 egg whites (100g)", "calories": 52.0, "protein_g": 10.9, "carbs_g": 0.7, "fat_g": 0.2, "is_indian_staple": True, "provenance": "USDA Food Data Central", "allergens": "Egg"},
    {"name": "Chicken Breast (Tandoori / Grilled)", "category": "Meat/Eggs", "serving_size": "100g cooked", "calories": 165.0, "protein_g": 31.0, "carbs_g": 0.0, "fat_g": 3.6, "is_indian_staple": True, "provenance": "USDA Food Data Central", "allergens": "None"},
    {"name": "Fish Curry (Rohu / Katla)", "category": "Meat/Eggs", "serving_size": "1 bowl (150g)", "calories": 185.0, "protein_g": 22.0, "carbs_g": 4.5, "fat_g": 8.5, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "Fish"},

    # Fruits & Vegetables
    {"name": "Banana", "category": "Fruits/Veg", "serving_size": "1 medium (118g)", "calories": 105.0, "protein_g": 1.3, "carbs_g": 27.0, "fat_g": 0.3, "is_indian_staple": True, "provenance": "USDA Food Data Central", "allergens": "None"},
    {"name": "Apple", "category": "Fruits/Veg", "serving_size": "1 medium (150g)", "calories": 78.0, "protein_g": 0.4, "carbs_g": 21.0, "fat_g": 0.3, "is_indian_staple": True, "provenance": "USDA Food Data Central", "allergens": "None"},
    {"name": "Mixed Sabzi (Seasonal Veg)", "category": "Fruits/Veg", "serving_size": "1 bowl (150g)", "calories": 110.0, "protein_g": 2.8, "carbs_g": 14.0, "fat_g": 5.0, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "None"},
    {"name": "Roasted Chana / Peanuts", "category": "Soya/Protein", "serving_size": "30g handful", "calories": 165.0, "protein_g": 7.5, "carbs_g": 14.0, "fat_g": 8.5, "is_indian_staple": True, "provenance": "Indian Food Composition Tables (IFCT)", "allergens": "Peanuts (if containing peanuts)"}
]

def seed_food_items(db: Session):
    existing_count = db.query(FoodItem).count()
    if existing_count >= len(FOOD_ITEMS_DATA):
        return

    for item in FOOD_ITEMS_DATA:
        food = db.query(FoodItem).filter(FoodItem.name == item["name"]).first()
        if not food:
            new_food = FoodItem(
                name=item["name"],
                category=item["category"],
                serving_size=item["serving_size"],
                calories=item["calories"],
                protein_g=item["protein_g"],
                carbs_g=item["carbs_g"],
                fat_g=item["fat_g"],
                is_indian_staple=item["is_indian_staple"],
                provenance=item["provenance"],
                allergens=item["allergens"]
            )
            db.add(new_food)
    db.commit()

def seed_exercises(db: Session):
    existing_count = db.query(Exercise).count()
    if existing_count >= len(EXERCISES_DATA):
        return

    for item in EXERCISES_DATA:
        ex = db.query(Exercise).filter(Exercise.name == item["name"]).first()
        if not ex:
            new_ex = Exercise(
                name=item["name"],
                category=item["category"],
                target_muscles=json.dumps(item["target_muscles"]),
                equipment_needed=item["equipment_needed"],
                difficulty=item["difficulty"],
                movement_type=item["movement_type"],
                instructions=item["instructions"],
                sets_reps_recommendation=item["sets_reps_recommendation"]
            )
            db.add(new_ex)
    db.commit()

def seed_demo_user(db: Session):
    demo_email = "demo@krida.ai"
    existing_user = db.query(User).filter(User.email == demo_email).first()
    if existing_user:
        return existing_user

    # Create demo user
    demo_user = User(
        email=demo_email,
        username="Alex Vance",
        hashed_password=hash_password("kridademo"),
        is_demo=True,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=28)
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)

    # Create demo profile
    demo_profile = Profile(
        user_id=demo_user.id,
        age=27,
        gender="Male",
        height_cm=180.0,
        weight_kg=78.2,
        fitness_level="Intermediate",
        primary_goal="Muscle Gain & Sports Performance",
        training_experience="1–3 years",
        training_frequency=4,
        available_equipment=json.dumps(["Dumbbells", "Barbell", "Bench", "Pull-up Bar"]),
        training_preference="Mixed Training",
        dietary_preference="Non-Vegetarian",
        sports_interests=json.dumps(["HYROX", "Running", "General Fitness"]),
        schedule_days=json.dumps(["Monday", "Tuesday", "Thursday", "Friday"]),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(demo_profile)
    db.commit()

    # Generate workout plan for demo user
    plan_dict = recommendation_engine.generate_workout_split({
        "primary_goal": "Muscle Gain & Sports Performance",
        "fitness_level": "Intermediate",
        "training_frequency": 4,
        "available_equipment": ["Dumbbells", "Barbell", "Bench", "Pull-up Bar"],
        "training_preference": "Mixed Training",
        "sports_interests": ["HYROX", "Running", "General Fitness"],
        "schedule_days": ["Monday", "Tuesday", "Thursday", "Friday"]
    })

    workout_plan = WorkoutPlan(
        user_id=demo_user.id,
        name=plan_dict["name"],
        goal=plan_dict["goal"],
        split_name=plan_dict["split_name"],
        is_active=True
    )
    db.add(workout_plan)
    db.commit()
    db.refresh(workout_plan)

    for idx, sess_data in enumerate(plan_dict["sessions"]):
        session = WorkoutSession(
            workout_plan_id=workout_plan.id,
            day_name=sess_data["day_name"],
            training_type=sess_data["training_type"],
            target_duration_mins=sess_data["target_duration_mins"],
            target_intensity=sess_data["target_intensity"],
            notes=sess_data["notes"],
            order_index=idx
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        for e_idx, ex_data in enumerate(sess_data["exercises"]):
            we = WorkoutExercise(
                workout_session_id=session.id,
                exercise_name=ex_data["exercise_name"],
                sets=ex_data["sets"],
                reps=str(ex_data["reps"]),
                rest_seconds=ex_data["rest_seconds"],
                intensity=ex_data["intensity"],
                order_index=e_idx
            )
            db.add(we)
    db.commit()

    # Create nutrition plan
    nutrition_dict = recommendation_engine.generate_nutrition_plan({
        "age": 27,
        "weight_kg": 78.2,
        "height_cm": 180.0,
        "gender": "Male",
        "primary_goal": "Muscle Gain",
        "training_frequency": 4,
        "dietary_preference": "Non-Vegetarian"
    })
    nutrition_plan = NutritionPlan(
        user_id=demo_user.id,
        daily_calories=nutrition_dict["daily_calories"],
        protein_g=nutrition_dict["protein_g"],
        carbs_g=nutrition_dict["carbs_g"],
        fat_g=nutrition_dict["fat_g"],
        water_liters=nutrition_dict["water_liters"],
        meal_breakdown=json.dumps(nutrition_dict["meal_breakdown"]),
        pre_workout=nutrition_dict["pre_workout"],
        post_workout=nutrition_dict["post_workout"]
    )
    db.add(nutrition_plan)

    # Seed 3 weeks of historical workout logs showing progression!
    base_time = datetime.datetime.utcnow()
    historical_logs = [
        # Session 1 (3 weeks ago)
        {"exercise": "Flat Dumbbell Press", "reps": [10, 10, 8], "weights": [22.5, 22.5, 22.5], "days_ago": 21, "rpe": 8.0},
        {"exercise": "Barbell Bent-Over Row", "reps": [10, 10, 10], "weights": [60.0, 60.0, 60.0], "days_ago": 21, "rpe": 7.5},
        # Session 2 (2 weeks ago)
        {"exercise": "Flat Dumbbell Press", "reps": [10, 10, 10], "weights": [25.0, 25.0, 25.0], "days_ago": 14, "rpe": 8.0},
        {"exercise": "Barbell Bent-Over Row", "reps": [10, 10, 9], "weights": [62.5, 62.5, 62.5], "days_ago": 14, "rpe": 8.0},
        # Session 3 (1 week ago)
        {"exercise": "Flat Dumbbell Press", "reps": [10, 10, 10], "weights": [27.5, 27.5, 27.5], "days_ago": 7, "rpe": 8.5},
        {"exercise": "Barbell Bent-Over Row", "reps": [10, 10, 10], "weights": [65.0, 65.0, 65.0], "days_ago": 7, "rpe": 8.0},
        # Session 4 (2 days ago)
        {"exercise": "Barbell Back Squat", "reps": [8, 8, 8], "weights": [90.0, 90.0, 90.0], "days_ago": 2, "rpe": 8.0},
        {"exercise": "Bulgarian Split Squats", "reps": [10, 10, 10], "weights": [16.0, 16.0, 16.0], "days_ago": 2, "rpe": 8.5}
    ]

    for log_item in historical_logs:
        log = WorkoutLog(
            user_id=demo_user.id,
            exercise_name=log_item["exercise"],
            sets_completed=len(log_item["reps"]),
            reps_completed=json.dumps(log_item["reps"]),
            weight_kg=json.dumps(log_item["weights"]),
            notes="Felt explosive and controlled. Clean eccentric tempo.",
            rpe=log_item["rpe"],
            completed_at=base_time - datetime.timedelta(days=log_item["days_ago"])
        )
        db.add(log)

    # Seed progress records
    progress_dates = [
        {"days_ago": 28, "weight": 80.5, "bench_1rm": 77.5, "volume": 3200, "run_5k": 26.5},
        {"days_ago": 21, "weight": 79.8, "bench_1rm": 80.0, "volume": 3450, "run_5k": 25.8},
        {"days_ago": 14, "weight": 79.1, "bench_1rm": 82.5, "volume": 3700, "run_5k": 25.2},
        {"days_ago": 7,  "weight": 78.6, "bench_1rm": 85.0, "volume": 3950, "run_5k": 24.8},
        {"days_ago": 0,  "weight": 78.2, "bench_1rm": 87.5, "volume": 4200, "run_5k": 24.2}
    ]

    for p in progress_dates:
        record = ProgressRecord(
            user_id=demo_user.id,
            recorded_at=base_time - datetime.timedelta(days=p["days_ago"]),
            weight_kg=p["weight"],
            estimated_1rm=json.dumps({"Bench Press": p["bench_1rm"], "Squat": p["bench_1rm"] * 1.35, "Deadlift": p["bench_1rm"] * 1.6}),
            volume_kg=p["volume"],
            running_5k_mins=p["run_5k"],
            consistency_score=92.0,
            notes="Lean mass recomp progressing steadily according to plan."
        )
        db.add(record)

    # Seed recovery record
    rec_record = RecoveryRecord(
        user_id=demo_user.id,
        recorded_at=base_time,
        recovery_score=86,
        fatigue_level=3,
        sleep_hours=7.8,
        strain_score=11.2,
        status_text="Primed for athletic performance. Parasympathetic tone elevated.",
        recommendation="High nervous readiness today. Ideal window for progressive overload on compound lifts."
    )
    db.add(rec_record)

    # Seed initial adaptive recommendations
    rec1 = Recommendation(
        user_id=demo_user.id,
        type="overload",
        title="Progressive Overload: Dumbbell Press Target Increase",
        message="Your Flat Dumbbell Press improved from 25.0 kg × 10 reps to 27.5 kg × 10 reps at RPE 8.5. KRIDA recommends increasing your target load to 30.0 kg for 8–10 reps.",
        why_explanation="You satisfied the double-progression threshold for two consecutive sessions. Incrementing load by 2.5 kg ensures continuous mechanical tension without technical breakdown.",
        created_at=base_time - datetime.timedelta(days=1)
    )
    rec2 = Recommendation(
        user_id=demo_user.id,
        type="nutrition",
        title="Peri-Workout Glycogen Top-Up",
        message="Upcoming session requires high anaerobic glycolytic output. Consume 45g complex carbs + 25g protein 90 mins prior.",
        why_explanation="Retrieved from sports nutrition science: Pre-saturating glycogen stores prevents premature muscle fatigue and blunts cortisol production.",
        created_at=base_time
    )
    db.add(rec1)
    db.add(rec2)

    # Seed demo fitness goals
    g1 = FitnessGoal(
        user_id=demo_user.id,
        category="strength",
        title="Compound Power Total (Bench + Squat + Deadlift)",
        current_value=340.0,
        target_value=400.0,
        unit="kg",
        deadline="Q4 Target",
        status="in_progress",
        notes="Epley 1RM calculated from validated training logs"
    )
    g2 = FitnessGoal(
        user_id=demo_user.id,
        category="endurance",
        title="Sub-75 Minute HYROX Conditioning Simulation",
        current_value=78.5,
        target_value=74.0,
        unit="mins",
        deadline="6 Weeks",
        status="in_progress",
        notes="Compromised running pace + 8 stations"
    )
    g3 = FitnessGoal(
        user_id=demo_user.id,
        category="skill",
        title="Strict Bar Muscle-Up Unbroken Set",
        current_value=2.0,
        target_value=5.0,
        unit="reps",
        deadline="4 Weeks",
        status="in_progress",
        notes="Clean false-grip transition without leg kick"
    )
    db.add(g1)
    db.add(g2)
    db.add(g3)

    # Seed demo calisthenics skills progress
    sp1 = SkillProgress(
        user_id=demo_user.id,
        skill_name="Muscle-Up",
        progression_level="Deep Straight-Bar Dips & Banded Turnover",
        level_number=2,
        hold_duration_sec=0.0,
        repetitions=8,
        milestone_status="In Training",
        notes="15 strict dips completed; grooving false-grip turnover"
    )
    sp2 = SkillProgress(
        user_id=demo_user.id,
        skill_name="Front Lever",
        progression_level="Advanced Tuck Front Lever",
        level_number=2,
        hold_duration_sec=14.0,
        repetitions=0,
        milestone_status="In Training",
        notes="Flat lower back parallel to floor; solid scapular depression"
    )
    sp3 = SkillProgress(
        user_id=demo_user.id,
        skill_name="Handstands",
        progression_level="Chest-to-Wall Handstand Hold",
        level_number=2,
        hold_duration_sec=45.0,
        repetitions=0,
        milestone_status="Mastered",
        notes="Clean straight hollow line alignment with active trap push"
    )
    db.add(sp1)
    db.add(sp2)
    db.add(sp3)

    # Seed demo nutrition entries for today
    today_str = datetime.date.today().isoformat()
    ne1 = NutritionEntry(
        user_id=demo_user.id,
        food_name="Rolled Oats with Milk & Banana",
        meal_type="Breakfast",
        quantity_servings=1.0,
        calories=383.0,
        protein_g=12.8,
        carbs_g=63.6,
        fat_g=9.1,
        logged_date=today_str
    )
    ne2 = NutritionEntry(
        user_id=demo_user.id,
        food_name="Whole Boiled Egg",
        meal_type="Breakfast",
        quantity_servings=2.0,
        calories=148.0,
        protein_g=12.6,
        carbs_g=0.8,
        fat_g=10.0,
        logged_date=today_str
    )
    ne3 = NutritionEntry(
        user_id=demo_user.id,
        food_name="Cooked Basmati Rice with Dal Tadka & Paneer",
        meal_type="Lunch",
        quantity_servings=1.0,
        calories=610.0,
        protein_g=31.4,
        carbs_g=68.1,
        fat_g=24.5,
        logged_date=today_str
    )
    db.add(ne1)
    db.add(ne2)
    db.add(ne3)

    # Seed demo conditioning / HYROX sessions
    cs1 = ConditioningSession(
        user_id=demo_user.id,
        session_type="HYROX Simulation / Race Prep",
        title="HYROX Race Simulation (4 Stations + 4km Run)",
        distance_meters=4000.0,
        duration_seconds=3120,
        rounds_completed=4,
        rest_seconds=60,
        stations_data_json=json.dumps({
            "SkiErg": "1000m (3:45 pace)",
            "Sled Push": "50m @ 125kg",
            "Rowing": "1000m (3:50 pace)",
            "Burpee Broad Jumps": "80m"
        }),
        notes="Maintained sub-4:40/km pace on 1km transition running segments.",
        completed_at=base_time - datetime.timedelta(days=2)
    )
    cs2 = ConditioningSession(
        user_id=demo_user.id,
        session_type="Station Strength Endurance",
        title="Station Strength Endurance & Sled Capacity",
        distance_meters=2000.0,
        duration_seconds=2280,
        rounds_completed=3,
        rest_seconds=90,
        stations_data_json=json.dumps({
            "Farmer's Carry": "200m @ 2x24kg",
            "Sandbag Lunges": "100m @ 20kg",
            "Wall Balls": "75 reps @ 6kg"
        }),
        notes="Strong unbroken sets on farmer's walk. Grip held steady.",
        completed_at=base_time - datetime.timedelta(days=5)
    )
    db.add(cs1)
    db.add(cs2)

    db.commit()
    return demo_user
