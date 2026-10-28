import json
from typing import Dict, Any, List
from app.rag.retriever import retrieve_fitness_knowledge

class RecommendationEngine:
    """
    Central Sports Performance Recommendation Engine for KRIDA.
    Integrates user biometrics, available equipment, schedule, sports interest,
    and RAG scientific documents into tailored plans.
    """

    def generate_workout_split(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        goal = profile_data.get("primary_goal", "Muscle Gain")
        level = profile_data.get("fitness_level", "Intermediate")
        frequency = int(profile_data.get("training_frequency", 4))
        equipment = profile_data.get("available_equipment", ["Dumbbells", "Barbell", "Bench"])
        preference = profile_data.get("training_preference", "Gym")
        sports = profile_data.get("sports_interests", ["General Fitness"])
        schedule_days = profile_data.get("schedule_days", ["Monday", "Tuesday", "Thursday", "Friday"])

        # Determine split name
        if preference == "Hyrox" or "Hyrox" in sports:
            split_name = "HYROX Hybrid Performance Split"
        elif preference == "Calisthenics" or "Calisthenics" in sports:
            split_name = "Calisthenics & Gymnastic Strength Split"
        elif preference == "Running" or "Running" in sports or preference == "Triathlon":
            split_name = "Polarized Endurance & Strength Split"
        elif frequency <= 3:
            split_name = "Full Body Comprehensive Split"
        elif frequency == 4:
            split_name = "Upper / Lower Athletic Split"
        elif frequency == 5:
            split_name = "Push / Pull / Legs / Upper / Lower Split"
        else:
            split_name = "Push / Pull / Legs Adaptive Split"

        # Days of the week in standard order
        all_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        sessions = []

        # RAG context for workout design
        rag_context = retrieve_fitness_knowledge(f"{goal} {preference} {level} workout programming", top_k=2)

        for day in all_days:
            is_training_day = day in schedule_days
            if not is_training_day:
                # Active recovery or rest day
                sessions.append({
                    "day_name": day,
                    "training_type": "Active Recovery & Mobility",
                    "target_duration_mins": 30,
                    "target_intensity": "Low (Zone 1)",
                    "notes": "Autonomic nervous restoration. 20-30 min walk + hip/thoracic mobility flow.",
                    "exercises": [
                        {
                            "exercise_name": "Thoracic Spine Foam Rolling & Rotations",
                            "sets": 2,
                            "reps": "10 each side",
                            "rest_seconds": 45,
                            "intensity": "Gentle",
                            "equipment_needed": "Bodyweight"
                        },
                        {
                            "exercise_name": "World's Greatest Stretch",
                            "sets": 2,
                            "reps": "8 each leg",
                            "rest_seconds": 45,
                            "intensity": "Gentle",
                            "equipment_needed": "Bodyweight"
                        },
                        {
                            "exercise_name": "Zone 1 Recovery Walk",
                            "sets": 1,
                            "reps": "25 mins",
                            "rest_seconds": 0,
                            "intensity": "50% HR Max",
                            "equipment_needed": "Bodyweight"
                        }
                    ]
                })
            else:
                # Training day
                session_detail = self._build_training_session(day, split_name, preference, goal, equipment, level, sports)
                sessions.append(session_detail)

        return {
            "name": f"KRIDA {split_name} ({frequency}d)",
            "goal": goal,
            "split_name": split_name,
            "sessions": sessions
        }

    def _build_training_session(
        self,
        day_name: str,
        split_name: str,
        preference: str,
        goal: str,
        equipment: List[str],
        level: str,
        sports: List[str]
    ) -> Dict[str, Any]:
        """Generate structured exercises respecting equipment availability."""
        has_barbell = any("barbell" in e.lower() for e in equipment) or any("full gym" in e.lower() for e in equipment)
        has_dumbbells = any("dumbbell" in e.lower() for e in equipment) or any("full gym" in e.lower() for e in equipment)
        bodyweight_only = not has_barbell and not has_dumbbells

        # Hyrox specific
        if "Hyrox" in split_name or "Hyrox" in preference:
            if day_name in ["Monday", "Thursday"]:
                return {
                    "day_name": day_name,
                    "training_type": "HYROX Power & Compromised Running",
                    "target_duration_mins": 60,
                    "target_intensity": "High (Lactate Threshold)",
                    "notes": "Simulates race-day compromised running. Maintain pace after leg fatigue.",
                    "exercises": [
                        {"exercise_name": "Sled Push (or Heavy Dumbbell Lunges)", "sets": 4, "reps": "25m / 16 reps", "rest_seconds": 90, "intensity": "RPE 8.5", "equipment_needed": "Full Gym"},
                        {"exercise_name": "Interval Run (Compromised Pace)", "sets": 4, "reps": "800m at 5K pace", "rest_seconds": 90, "intensity": "Zone 4", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "Wall Balls (or Thrusters)", "sets": 4, "reps": "18-20 reps", "rest_seconds": 60, "intensity": "RPE 8", "equipment_needed": "Dumbbells"},
                        {"exercise_name": "Farmers Carry", "sets": 3, "reps": "50m", "rest_seconds": 75, "intensity": "Heavy", "equipment_needed": "Dumbbells"}
                    ]
                }
            else:
                return {
                    "day_name": day_name,
                    "training_type": "HYROX Aerobic Engine & SkiErg / Row",
                    "target_duration_mins": 55,
                    "target_intensity": "Moderate-High (Zone 3-4)",
                    "notes": "Pacing endurance and mitochondrial density focus.",
                    "exercises": [
                        {"exercise_name": "Rowing Machine Intervals", "sets": 5, "reps": "500m", "rest_seconds": 60, "intensity": "Target Pace", "equipment_needed": "Machines"},
                        {"exercise_name": "Burpee Broad Jumps", "sets": 3, "reps": "12 reps", "rest_seconds": 60, "intensity": "Explosive", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "Dumbbell Goblet Squats", "sets": 3, "reps": "12-15 reps", "rest_seconds": 75, "intensity": "RPE 8", "equipment_needed": "Dumbbells"},
                        {"exercise_name": "Sandbag / Dumbbell Lunges", "sets": 3, "reps": "12 each leg", "rest_seconds": 60, "intensity": "RPE 8", "equipment_needed": "Dumbbells"}
                    ]
                }

        # Calisthenics specific
        if "Calisthenics" in split_name or "Calisthenics" in preference or bodyweight_only:
            if day_name in ["Monday", "Thursday"]:
                return {
                    "day_name": day_name,
                    "training_type": "Calisthenics Upper Body & Skill Progressions",
                    "target_duration_mins": 50,
                    "target_intensity": "RPE 8-9",
                    "notes": "Focus on rigid core posture and scapular retraction.",
                    "exercises": [
                        {"exercise_name": "Strict Pull-ups (or Band-Assisted)", "sets": 4, "reps": "6-10", "rest_seconds": 90, "intensity": "RPE 8.5", "equipment_needed": "Pull-up Bar"},
                        {"exercise_name": "Parallel Bar Dips", "sets": 4, "reps": "8-12", "rest_seconds": 90, "intensity": "RPE 8", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "Pseudo Planche Push-ups", "sets": 3, "reps": "8-10", "rest_seconds": 75, "intensity": "RPE 8", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "Hollow Body Core Hold", "sets": 3, "reps": "45-60 sec", "rest_seconds": 60, "intensity": "Isometric", "equipment_needed": "Bodyweight"}
                    ]
                }
            else:
                return {
                    "day_name": day_name,
                    "training_type": "Calisthenics Lower Body & Handstand Balance",
                    "target_duration_mins": 45,
                    "target_intensity": "RPE 7.5-8.5",
                    "notes": "Unilateral leg strength combined with inverted spatial balance.",
                    "exercises": [
                        {"exercise_name": "Pistol Squats (or Box Assisted)", "sets": 3, "reps": "6-8 each leg", "rest_seconds": 90, "intensity": "RPE 8", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "Nordic Hamstring Curls (or Single-Leg Glute Bridge)", "sets": 3, "reps": "6-8 reps", "rest_seconds": 90, "intensity": "RPE 8.5", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "Wall Handstand Hold", "sets": 4, "reps": "30-45 sec", "rest_seconds": 60, "intensity": "Technical", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "Walking Lunges", "sets": 3, "reps": "15 each leg", "rest_seconds": 60, "intensity": "RPE 7.5", "equipment_needed": "Bodyweight"}
                    ]
                }

        # Running / Endurance specific
        if "Running" in preference or "Running" in sports:
            if day_name in ["Tuesday", "Friday"]:
                return {
                    "day_name": day_name,
                    "training_type": "Running Threshold & Aerobic VO2 Max",
                    "target_duration_mins": 50,
                    "target_intensity": "Zone 4 / Threshold",
                    "notes": "Target cadence 175-180 spm. Polarized training methodology.",
                    "exercises": [
                        {"exercise_name": "Dynamic Warm-up & Strides", "sets": 1, "reps": "10 mins", "rest_seconds": 60, "intensity": "Progressive", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "Tempo Run (Lactate Threshold)", "sets": 1, "reps": "25 mins at Zone 3-4", "rest_seconds": 120, "intensity": "RPE 8", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "VO2 Max 400m Repeats", "sets": 4, "reps": "400m at 5k pace", "rest_seconds": 90, "intensity": "Zone 5", "equipment_needed": "Bodyweight"},
                        {"exercise_name": "Cool-down Jog & Calf Stretches", "sets": 1, "reps": "8 mins", "rest_seconds": 0, "intensity": "Zone 1", "equipment_needed": "Bodyweight"}
                    ]
                }

        # Standard Gym / Dumbbell / Barbell Split (Upper / Lower or Push / Pull)
        if day_name in ["Monday", "Thursday"]:
            # Upper Body
            bench_exercise = "Barbell Bench Press" if has_barbell else "Flat Dumbbell Chest Press"
            overhead_exercise = "Overhead Barbell Press" if has_barbell else "Seated Dumbbell Shoulder Press"
            row_exercise = "Barbell Bent-Over Row" if has_barbell else "Dumbbell Bent-Over Row"
            return {
                "day_name": day_name,
                "training_type": "Upper Body Strength & Hypertrophy",
                "target_duration_mins": 55,
                "target_intensity": "RPE 8-8.5",
                "notes": "Primary compound focus on chest, upper back, and deltoids.",
                "exercises": [
                    {"exercise_name": bench_exercise, "sets": 4, "reps": "8-10", "rest_seconds": 90, "intensity": "RPE 8", "equipment_needed": "Barbell" if has_barbell else "Dumbbells"},
                    {"exercise_name": row_exercise, "sets": 4, "reps": "8-12", "rest_seconds": 90, "intensity": "RPE 8", "equipment_needed": "Barbell" if has_barbell else "Dumbbells"},
                    {"exercise_name": overhead_exercise, "sets": 3, "reps": "8-10", "rest_seconds": 75, "intensity": "RPE 8", "equipment_needed": "Dumbbells"},
                    {"exercise_name": "Incline Dumbbell Bicep Curls", "sets": 3, "reps": "10-12", "rest_seconds": 60, "intensity": "RPE 8.5", "equipment_needed": "Dumbbells"},
                    {"exercise_name": "Overhead Triceps Extension", "sets": 3, "reps": "12-15", "rest_seconds": 60, "intensity": "RPE 8.5", "equipment_needed": "Dumbbells"}
                ]
            }
        else:
            # Lower Body & Core
            squat_exercise = "Barbell Back Squat" if has_barbell else "Dumbbell Goblet Squat"
            rdl_exercise = "Barbell Romanian Deadlift" if has_barbell else "Dumbbell Romanian Deadlift"
            return {
                "day_name": day_name,
                "training_type": "Lower Body Power & Posterior Chain",
                "target_duration_mins": 55,
                "target_intensity": "RPE 8-9",
                "notes": "Deep knee flexion and hip hinge execution with controlled eccentric tempo.",
                "exercises": [
                    {"exercise_name": squat_exercise, "sets": 4, "reps": "8-10", "rest_seconds": 120, "intensity": "RPE 8.5", "equipment_needed": "Barbell" if has_barbell else "Dumbbells"},
                    {"exercise_name": rdl_exercise, "sets": 3, "reps": "8-12", "rest_seconds": 90, "intensity": "RPE 8", "equipment_needed": "Dumbbells"},
                    {"exercise_name": "Bulgarian Split Squats", "sets": 3, "reps": "10-12 each leg", "rest_seconds": 75, "intensity": "RPE 8.5", "equipment_needed": "Dumbbells"},
                    {"exercise_name": "Standing Calf Raises", "sets": 4, "reps": "15-20", "rest_seconds": 45, "intensity": "RPE 9", "equipment_needed": "Dumbbells"},
                    {"exercise_name": "Hanging Leg Raises / Plank", "sets": 3, "reps": "12-15", "rest_seconds": 60, "intensity": "RPE 8", "equipment_needed": "Bodyweight"}
                ]
            }

    def generate_nutrition_plan(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        age = profile_data.get("age", 25)
        weight_kg = profile_data.get("weight_kg", 75.0)
        height_cm = profile_data.get("height_cm", 175.0)
        gender = profile_data.get("gender", "Male")
        goal = profile_data.get("primary_goal", "Muscle Gain")
        frequency = profile_data.get("training_frequency", 4)
        diet = profile_data.get("dietary_preference", "Non-Vegetarian")

        # Mifflin-St Jeor BMR
        if "female" in str(gender).lower():
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
        else:
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5

        # Activity multiplier
        if frequency <= 2:
            activity_mult = 1.35
        elif frequency <= 4:
            activity_mult = 1.55
        else:
            activity_mult = 1.725

        tdee = bmr * activity_mult

        # Goal adjustments
        if "muscle" in goal.lower() or "strength" in goal.lower():
            target_calories = int(tdee + 280)
            protein_factor = 2.0
            fat_factor = 0.9
        elif "loss" in goal.lower() or "fat" in goal.lower():
            target_calories = int(tdee - 450)
            protein_factor = 2.2 # higher protein to spare muscle in deficit
            fat_factor = 0.75
        elif "endurance" in goal.lower() or "sports" in goal.lower() or "hyrox" in goal.lower():
            target_calories = int(tdee + 200)
            protein_factor = 1.8
            fat_factor = 0.85
        else:
            target_calories = int(tdee)
            protein_factor = 1.9
            fat_factor = 0.85

        protein_g = int(weight_kg * protein_factor)
        fat_g = int(weight_kg * fat_factor)
        # Carbohydrates fill remainder
        carb_cals = max(target_calories - (protein_g * 4 + fat_g * 9), 400)
        carbs_g = int(carb_cals / 4)
        water_liters = round(weight_kg * 0.042, 1)

        # Build meals tailored to diet
        meals = self._build_meal_suggestions(diet, target_calories, protein_g, carbs_g, fat_g)

        return {
            "daily_calories": target_calories,
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g,
            "water_liters": water_liters,
            "meal_breakdown": meals,
            "pre_workout": f"Complex carbs (40-50g) + 25g protein {90} mins prior to session. Drink 500ml water with pinch of electrolytes.",
            "post_workout": f"30-40g high-quality protein + 45-60g carbs within 60 mins of workout completion to stimulate muscle protein synthesis via mTOR."
        }

    def _build_meal_suggestions(self, diet: str, total_cals: int, p: int, c: int, f: int) -> Dict[str, Any]:
        is_veg = "veg" in diet.lower() and "non" not in diet.lower()
        is_vegan = "vegan" in diet.lower()

        if is_vegan:
            return {
                "breakfast": {
                    "name": "Steel-Cut Oats with Chia Seeds, Berries, and Soy Protein",
                    "calories": int(total_cals * 0.28),
                    "protein_g": int(p * 0.25),
                    "carbs_g": int(c * 0.35),
                    "fat_g": int(f * 0.25),
                    "notes": "Rich in beta-glucan fiber, omega-3 ALA, and complete plant protein."
                },
                "lunch": {
                    "name": "Spiced Tempeh & Quinoa Power Bowl with Steamed Broccoli",
                    "calories": int(total_cals * 0.35),
                    "protein_g": int(p * 0.35),
                    "carbs_g": int(c * 0.35),
                    "fat_g": int(f * 0.35),
                    "notes": "Fermented tempeh provides gut microbiome support and high bioavailable protein."
                },
                "dinner": {
                    "name": "Lentil Dal with Brown Basmati Rice, Tofu, and Sautéed Spinach",
                    "calories": int(total_cals * 0.27),
                    "protein_g": int(p * 0.30),
                    "carbs_g": int(c * 0.25),
                    "fat_g": int(f * 0.25),
                    "notes": "Rich in dietary iron, magnesium, and slow-digesting complex carbs."
                },
                "snacks": {
                    "name": "Almonds, Pumpkin Seeds, and Roasted Edamame",
                    "calories": int(total_cals * 0.10),
                    "protein_g": int(p * 0.10),
                    "carbs_g": int(c * 0.05),
                    "fat_g": int(f * 0.15),
                    "notes": "Portable micro-nutrient dense fueling."
                }
            }
        elif is_veg:
            return {
                "breakfast": {
                    "name": "Greek Yogurt Bowl with Honey, Walnuts, Whey/Plant Protein & Banana",
                    "calories": int(total_cals * 0.28),
                    "protein_g": int(p * 0.30),
                    "carbs_g": int(c * 0.30),
                    "fat_g": int(f * 0.25),
                    "notes": "Provides high leucine casein and whey fractions for sustained amino acid release."
                },
                "lunch": {
                    "name": "Paneer / Tofu Bhurji with Whole Wheat Rotis and Mixed Salad",
                    "calories": int(total_cals * 0.35),
                    "protein_g": int(p * 0.35),
                    "carbs_g": int(c * 0.35),
                    "fat_g": int(f * 0.35),
                    "notes": "High calcium, healthy fats, and sustained satiety."
                },
                "dinner": {
                    "name": "Moong Sprouts & Vegetable Khichdi with Low-Fat Cottage Cheese",
                    "calories": int(total_cals * 0.27),
                    "protein_g": int(p * 0.25),
                    "carbs_g": int(c * 0.25),
                    "fat_g": int(f * 0.25),
                    "notes": "Easily digestible evening meal facilitating restful sleep and recovery."
                },
                "snacks": {
                    "name": "Roasted Makhana (Fox Nuts) & Peanut Butter Apple Slices",
                    "calories": int(total_cals * 0.10),
                    "protein_g": int(p * 0.10),
                    "carbs_g": int(c * 0.10),
                    "fat_g": int(f * 0.15),
                    "notes": "Low glycemic index and sustained energy."
                }
            }
        else: # Non-Vegetarian
            return {
                "breakfast": {
                    "name": "Scrambled Eggs with Avocado, Sourdough Toast & Fresh Berries",
                    "calories": int(total_cals * 0.28),
                    "protein_g": int(p * 0.28),
                    "carbs_g": int(c * 0.28),
                    "fat_g": int(f * 0.30),
                    "notes": "Bioavailable choline from egg yolks with slow-burning complex carbohydrates."
                },
                "lunch": {
                    "name": "Grilled Chicken Breast, Sweet Potato Mash, and Asparagus",
                    "calories": int(total_cals * 0.35),
                    "protein_g": int(p * 0.38),
                    "carbs_g": int(c * 0.38),
                    "fat_g": int(f * 0.30),
                    "notes": "Lean complete protein delivering 3.2g leucine to optimize muscle protein synthesis."
                },
                "dinner": {
                    "name": "Wild Salmon Fillet with Jasmine Rice and Roasted Green Beans",
                    "calories": int(total_cals * 0.27),
                    "protein_g": int(p * 0.26),
                    "carbs_g": int(c * 0.26),
                    "fat_g": int(f * 0.30),
                    "notes": "Rich in EPA/DHA Omega-3 fatty acids, mitigating exercise-induced inflammation."
                },
                "snacks": {
                    "name": "Whey Protein Shake with Blueberries & Handful of Almonds",
                    "calories": int(total_cals * 0.10),
                    "protein_g": int(p * 0.08),
                    "carbs_g": int(c * 0.08),
                    "fat_g": int(f * 0.10),
                    "notes": "Rapid amino acid delivery and antioxidant polyphenol support."
                }
            }

    def compute_recovery_metrics(
        self,
        sleep_hours: float = 7.5,
        fatigue_level: int = 4,
        recent_workout_count: int = 3
    ) -> Dict[str, Any]:
        """Compute WHOOP/Oura-style recovery score (0-100) and readiness."""
        # Baseline 100
        score = 88.0
        
        # Sleep impact (ideal 7.5 - 9 hrs)
        if sleep_hours < 6.0:
            score -= 22.0
        elif sleep_hours < 7.0:
            score -= 10.0
        elif sleep_hours >= 8.0:
            score += 5.0

        # Fatigue impact (1-10)
        score -= (fatigue_level - 3) * 4.5

        # Volume load
        if recent_workout_count >= 5:
            score -= 8.0

        final_score = max(min(int(round(score)), 98), 35)

        if final_score >= 80:
            status_text = "Optimal Performance State. Parasympathetic nervous system fully restored."
            recommendation = "You are cleared for high-intensity compound lifts and threshold sports training. Aim for progressive overload."
            readiness = "Prime"
        elif final_score >= 60:
            status_text = "Moderate Recovery Capacity. Steady state cardiovascular equilibrium."
            recommendation = "Maintain planned training volume, but avoid pushing to failure (keep 2-3 Reps in Reserve). Hydrate thoroughly."
            readiness = "Moderate"
        else:
            status_text = "High Systemic Strain Detected. Autonomic recovery depressed."
            recommendation = "KRIDA recommends active recovery, light mobility, or reducing today's sets by 40% to prevent overtraining."
            readiness = "Deload / Rest"

        return {
            "recovery_score": final_score,
            "fatigue_level": fatigue_level,
            "sleep_hours": sleep_hours,
            "strain_score": round(10.5 + (fatigue_level * 0.8), 1),
            "status_text": status_text,
            "recommendation": recommendation,
            "readiness_level": readiness
        }

recommendation_engine = RecommendationEngine()
