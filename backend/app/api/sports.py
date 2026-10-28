from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.models.models import User, Profile
from app.utils.auth import get_current_user
from sqlalchemy.orm import Session
from app.database.connection import get_db

router = APIRouter(prefix="/sports", tags=["Sports Performance Protocols"])

SPORTS_CATALOG = {
    "HYROX": {
        "title": "HYROX Race Conditioning",
        "badge": "Hybrid Engine",
        "description": "8 × 1km running intervals paired with 8 functional test stations. Builds compromised running stamina.",
        "stations": [
            {"station": "1000m SkiErg", "target": "3:40 - 4:10 pace", "focus": "Lat engagement & hip hinge power"},
            {"station": "50m Sled Push (102-152kg)", "target": "Low driving body angle", "focus": "Quadriceps & calf propulsion"},
            {"station": "50m Sled Pull (78-103kg)", "target": "Hand over hand rhythm", "focus": "Posterior chain & forearm grip"},
            {"station": "80m Burpee Broad Jumps", "target": "Continuous steady rhythm", "focus": "Cardiovascular stamina"},
            {"station": "1000m Rowing Ergometer", "target": "1:55 - 2:05 / 500m split", "focus": "Mitochondrial endurance"},
            {"station": "200m Farmers Carry (2x24kg)", "target": "Zero stop progression", "focus": "Traps & anti-lateral flexion"},
            {"station": "100m Sandbag Lunges (20kg)", "target": "Controlled knee touch", "focus": "Glute and quad endurance"},
            {"station": "100 Wall Balls (6kg)", "target": "Unbroken sets of 25", "focus": "Thruster power & breathing cycle"}
        ],
        "training_blocks": [
            {"name": "Compromised 1km Repeats", "detail": "4 rounds: 1000m run at 10k pace + 20 Burpee Broad Jumps + 200m Farmers Carry"},
            {"name": "Leg Fatigue Lactate Flush", "detail": "4 rounds: 50m Heavy Sled Push followed immediately by 800m run"}
        ]
    },
    "CALISTHENICS": {
        "title": "Gymnastic Strength & Leverage",
        "badge": "Bodyweight Mastery",
        "description": "Progressive manipulation of moment arms, hollow-body stability, and straight-arm tendon conditioning.",
        "stations": [
            {"station": "Strict Pull-ups", "target": "3 × 8-12 reps", "focus": "Hollow body, full ROM chest-to-bar"},
            {"station": "Parallel Bar Dips", "target": "3 × 10-15 reps", "focus": "Forward lean, triceps & pecs lockout"},
            {"station": "Muscle-up Progression", "target": "5 × 2-4 reps", "focus": "Explosive high pull & fast transition"},
            {"station": "Freestanding Handstand", "target": "5 attempts × 30s", "focus": "Fingertip camber pressure & shoulder elevation"},
            {"station": "Front Lever Tuck / Straddle", "target": "4 × 10s holds", "focus": "Straight-arm scapular depression"},
            {"station": "Pseudo Planche Push-ups", "target": "3 × 8-10 reps", "focus": "Extreme forward lean & protracted scapulae"}
        ],
        "training_blocks": [
            {"name": "Upper Kinetic Chain Flow", "detail": "Bar Muscle-ups -> Straight Bar Dips -> Pull-ups with 90s rest"},
            {"name": "Inverted Balance & Core", "detail": "Wall Handstand shoulder taps + 60s Hollow Body Hold + Hanging leg raises"}
        ]
    },
    "RUNNING": {
        "title": "Aerobic Capacity & Polarized Running",
        "badge": "80/20 Polarized",
        "description": "Mitochondrial expansion through low-heart-rate Zone 2 base runs paired with VO2 Max intervals.",
        "stations": [
            {"station": "Easy Zone 2 Run", "target": "45-60 mins", "focus": "Conversational pace, HR < 75% max"},
            {"station": "Lactate Threshold Tempo", "target": "25-30 mins", "focus": "Sustained comfortably hard pace (LT2)"},
            {"station": "VO2 Max Intervals", "target": "5 × 800m repeats", "focus": "Run at 5K pace with 90s jog recovery"},
            {"station": "Cadence Drills", "target": "10 × 100m strides", "focus": "Targeting 175-185 strides per minute"},
            {"station": "Weekly Long Run", "target": "75-90 mins", "focus": "Glycogen depletion & mental stamina"},
            {"station": "Recovery Shake-out Run", "target": "25 mins", "focus": "Active blood circulation without stress"}
        ],
        "training_blocks": [
            {"name": "5K Speed Sharpener", "detail": "15 min warmup + 6 × 400m at goal 5k pace (60s rest) + 10 min cooldown"},
            {"name": "Long Aerobic Sunday", "detail": "12-14km steady Zone 2 run keeping heart rate consistently within 135-148 bpm"}
        ]
    },
    "STRENGTH": {
        "title": "Maximal Neuromuscular Force",
        "badge": "1RM Power",
        "description": "High-intensity (80-92% 1RM) compound lifting stimulating high-threshold motor unit synchronization.",
        "stations": [
            {"station": "Competition Squat", "target": "4 × 3-5 reps (RPE 8.5)", "focus": "Midfoot balance & intra-abdominal pressure"},
            {"station": "Flat Bench Press", "target": "4 × 3-5 reps (RPE 8.5)", "focus": "Leg drive & scapular retraction"},
            {"station": "Conventional Deadlift", "target": "3 × 3 reps (RPE 8)", "focus": "Slack pull & hip wedge mechanics"},
            {"station": "Overhead Press", "target": "3 × 5 reps (RPE 8)", "focus": "Glute squeeze & vertical bar path"}
        ],
        "training_blocks": [
            {"name": "Heavy Triples Protocol", "detail": "Warmup to 85% 1RM for 4 sets of 3 reps. Rest 3-4 minutes between sets."},
            {"name": "Post-Activation Potentiation", "detail": "Heavy 1-rep single at 90% followed by 3 back-off sets of 5 at 75% for velocity"}
        ]
    },
    "ENDURANCE": {
        "title": "Metabolic Efficiency & Hybrid Volume",
        "badge": "Ultra Endurance",
        "description": "Sustained multi-hour output, fat oxidation optimization, and hydration/electrolyte management.",
        "stations": [
            {"station": "Zone 2 Mixed Ergometer", "target": "60 mins (Row / Bike / Ski)", "focus": "Continuous low-lactate aerobic engine"},
            {"station": "Threshold Over-Unders", "target": "3 × (2m Over / 2m Under)", "focus": "Lactate clearance capacity"},
            {"station": "Core Postural Endurance", "target": "3 rounds × 4 mins", "focus": "Plank, bird-dog, side-planks under fatigue"}
        ],
        "training_blocks": [
            {"name": "Aerobic Glycogen Spacing", "detail": "2 hours low-intensity cycling or running fueled with 60g carbs/hour and electrolyte water"}
        ]
    },
    "TRIATHLON": {
        "title": "Triathlon Multisport Conditioning",
        "badge": "Swim-Bike-Run",
        "description": "Seamless transition dynamics, biomechanical efficiency, and brick workouts.",
        "stations": [
            {"station": "Swim Stroke Mechanics", "target": "1500m (Drills + 100m repeats)", "focus": "High elbow catch & bilateral breathing"},
            {"station": "Cycling Cadence Work", "target": "60 mins at 90-95 RPM", "focus": "Smooth pedal stroke & aerodynamic position"},
            {"station": "Brick Workout (Bike to Run)", "target": "40km Bike -> 5km Run", "focus": "Immediate transition without heavy legs cramping"}
        ],
        "training_blocks": [
            {"name": "Bike-to-Run Brick Session", "detail": "45 min Zone 3 bike ride followed immediately by 20 min tempo run"}
        ]
    }
}

@router.get("/modules")
def get_sports_modules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    fitness_level = profile.fitness_level if profile else "Intermediate"

    return {
        "sports": SPORTS_CATALOG,
        "athlete_level": fitness_level,
        "recommendation": f"As an {fitness_level} athlete, synchronize 1 to 2 sports performance modules alongside your weekly compound foundation."
    }
