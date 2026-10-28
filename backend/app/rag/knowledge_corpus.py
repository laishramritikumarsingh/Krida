"""
KRIDA Scientific Knowledge Base Corpus
Comprehensive, peer-reviewed sports science, exercise physiology, periodization, and nutrition corpus.
"""

DOCUMENTS = [
    {
        "id": "doc_hypertrophy_mechanisms",
        "title": "Mechanisms of Muscular Hypertrophy and Exercise Prescription",
        "category": "Hypertrophy",
        "text": """Muscular hypertrophy is stimulated through three primary physiological mechanisms: mechanical tension, metabolic stress, and muscle damage (Schoenfeld, 2010; 2021). 
Mechanical tension is the most critical driver of skeletal muscle growth. It occurs when a muscle contracts against resistance through a full active range of motion, activating mechanosensors (costameres and titin kinase) which trigger the mTORC1 signaling pathway.
Optimal hypertrophy parameters:
- Repetition range: 6 to 15 reps per set, although 5 to 30 reps stimulate comparable hypertrophy when sets are taken within 1 to 3 Reps In Reserve (RIR).
- Volume: 10 to 20 weekly hard sets per muscle group for intermediate-to-advanced athletes, with novice athletes making robust progress on 6 to 10 weekly sets.
- Rest intervals: 2 to 3 minutes for compound multi-joint movements (allowing full phosphocreatine replenishment) and 60 to 90 seconds for single-joint isolation exercises.
- Frequency: Training each muscle group 2 times per week produces superior hypertrophic outcomes compared to once-per-week splits when weekly volume is equated."""
    },
    {
        "id": "doc_progressive_overload",
        "title": "Principles of Progressive Overload & Adaptive Resistance",
        "category": "Progressive Overload",
        "text": """Progressive overload is the gradual increase of stress placed upon the musculoskeletal and nervous system during athletic training (Kraemer & Ratamess, 2004).
Without progressive overload, neuromuscular adaptation plateaus within 4 to 6 weeks.
Methods of applying progressive overload:
1. Load progression: Increasing weight by 2.0% to 5.0% (e.g., +2.5 kg) once target reps can be completed with RPE <= 8 across all prescribed sets.
2. Volume progression: Adding sets or increasing repetitions within the prescribed rep bracket before adding external resistance.
3. Density progression: Reducing rest periods while maintaining absolute work output and movement mechanical execution.
4. Range of motion & tempo: Accentuating the eccentric phase (3-second lowering) to increase time under tension at long muscle lengths.
Deload Protocols:
When an athlete fails to hit minimum target reps for two consecutive microcycles, or reports subjective fatigue score > 7/10 accompanied by systemic HRV drop, volume should be reduced by 40-50% and load reduced by 10-15% for 5 to 7 days to facilitate supercompensation."""
    },
    {
        "id": "doc_hyrox_performance",
        "title": "HYROX Race Architecture and Energy System Demands",
        "category": "HYROX",
        "text": """HYROX is a global functional fitness competition comprising 8 × 1 km running intervals interspersed with 8 distinct functional workout stations:
1. 1000m SkiErg
2. 50m Sled Push (102kg to 152kg)
3. 50m Sled Pull (78kg to 103kg)
4. 80m Burpee Broad Jumps
5. 1000m Rowing
6. 200m Farmers Carry (2 × 16kg to 2 × 24kg)
7. 100m Sandbag Lunges (10kg to 20kg)
8. 75 to 100 Wall Balls (4kg to 6kg)

Physiological demands:
HYROX relies approximately 85% on aerobic oxidative phosphorylation and 15% on glycolytic lactate buffering.
Key training strategy:
- Compromised running: Practicing running intervals immediately following heavy lower-body lactic fatigue (e.g., sled push or lunges).
- Pacing: Avoid opening the first 1km run at 5K race pace. The optimal pacing strategy is 10k pace plus 15-20 seconds per km to preserve mitochondrial efficiency.
- Grip endurance: Sled pull, farmers carry, and burpees place heavy cumulative strain on finger flexors and forearm musculature."""
    },
    {
        "id": "doc_calisthenics_progressions",
        "title": "Bodyweight Strength and Gymnastic Movement Progressions",
        "category": "Calisthenics",
        "text": """Calisthenics relies on manipulating mechanical leverage, moment arms, and center of mass rather than adding external iron plates (Low, 2016).
Key skill progressions:
1. Pull-up to Muscle-up: Scapular pull-ups -> Hollow-body pull-ups -> Chest-to-bar pull-ups -> High explosive pull-ups -> False grip bar dips -> Strict bar muscle-up.
2. Push-up to Planche: Standard push-up -> Pseudo planche push-ups -> Frog stand -> Tuck planche -> Advanced tuck -> Straddle planche -> Full planche.
3. Inverted skills & Handstand: Wall handstand walks -> Belly-to-wall handstand holds (60s) -> Freestanding kick-ups -> Handstand push-ups (HSPU).
4. Core stability: Hollow body hold (60s) and Arch body hold establish the rigid anterior and posterior pelvic kinetic chain required for all advanced gymnastic maneuvers.
Connective tissue adaptation:
Tendons and ligaments adapt approximately 3 to 5 times slower than muscle fibers due to limited blood supply. Straight-arm strength requires 8 to 12 weeks of low-intensity tendon conditioning before attempting maximum leverage holds."""
    },
    {
        "id": "doc_running_physiology",
        "title": "Endurance Running: Zone 2 Aerobic Base and VO2 Max Development",
        "category": "Running",
        "text": """Long-term endurance performance is governed by VO2 Max, Lactate Threshold (LT2), and Running Economy (Joyner & Coyle, 2008).
The Polarized 80/20 Training Model:
- 80% of weekly mileage must be spent in Zone 2 (below aerobic threshold, blood lactate < 2.0 mmol/L, conversational pace, 65-75% max heart rate). Zone 2 expands mitochondrial capillary density and cardiac stroke volume.
- 20% of weekly volume should consist of high-intensity threshold or VO2 Max interval work (Zone 4-5, e.g., 5 × 1000m at 5K pace with 90s recovery).
Improving 5K & 10K times:
- Cadence: Optimal cadence is typically between 170 to 185 strides per minute to minimize heel-striking ground reaction braking forces.
- Weekly Long Run: Builds glycogen storage capacity and psychological stamina. Should comprise 25% to 30% of total weekly mileage."""
    },
    {
        "id": "doc_strength_neuromuscular",
        "title": "Maximal Strength and Neuromuscular Rate of Force Development",
        "category": "Strength",
        "text": """Maximal strength is mediated by neural factors (motor unit recruitment, rate coding, motor unit synchronization, and reduction of antagonist coactivation) and muscular cross-sectional area (Suchomel et al., 2018).
Programming guidelines for pure strength:
- Intensity: 80% to 92.5% of 1-Repetition Maximum (1RM), corresponding to 1 to 5 repetitions per set.
- Proximity to failure: Stopping 1 to 3 reps shy of concentric failure (RPE 7.5 to 9.0) optimizes neural adaptation while minimizing central nervous system exhaustion.
- Movement selection: Closed-chain compound fundamentals—Squat, Conventional Deadlift, Bench Press, and Overhead Military Press.
- Rest duration: 3 to 5 minutes between heavy sets is imperative to allow full resynthesis of intramuscular adenosine triphosphate (ATP) and phosphocreatine (PCr)."""
    },
    {
        "id": "doc_sports_nutrition",
        "title": "Macronutrient Partitioning, TDEE, and Performance Fueling",
        "category": "Nutrition",
        "text": """Total Daily Energy Expenditure (TDEE) is comprised of Basal Metabolic Rate (BMR ~60-70%), Non-Exercise Activity Thermogenesis (NEAT ~15%), Thermic Effect of Food (TEF ~10%), and Exercise Energy Expenditure (EEE ~5-15%) (Morton et al., 2018; Aragon & Schoenfeld).
Macronutrient targets for athletic populations:
- Protein: 1.6 to 2.2 grams per kilogram of total body weight per day. For athletes in a caloric deficit, 2.2 to 2.6 g/kg preserves lean tissue. Distribute across 3 to 5 meals with at least 2.5 to 3.0g of leucine per meal to trigger muscle protein synthesis via mTOR.
- Carbohydrates: 3 to 5 g/kg/day for moderate resistance training; 5 to 8 g/kg/day for hybrid/endurance/HYROX athletes to sustain liver and muscle glycogen reserves.
- Dietary Fats: 0.7 to 1.2 g/kg/day (20% to 30% of daily calories) to maintain hormonal homeostasis and cellular membrane integrity.
Energy Balance:
- Fat Loss: Caloric deficit of 15% to 20% below maintenance TDEE (aiming for 0.5% to 1.0% bodyweight loss per week).
- Lean Hypertrophy: Caloric surplus of 5% to 10% (200-350 kcal surplus) above maintenance."""
    },
    {
        "id": "doc_periworkout_fueling",
        "title": "Peri-Workout Nutrition, Electrolyte Balance, and Hydration",
        "category": "Nutrition",
        "text": """Strategic nutrient timing enhances performance and accelerates post-exercise recovery:
Pre-Workout Nutrition (1.5 to 2.5 hours prior):
- 1.0 to 1.5 g/kg easily digestible carbohydrates (e.g., oatmeal with banana or rice cakes) + 25-35g lean protein. Low in fat and fiber to prevent gastrointestinal distress.
- 500ml water with 300-500mg sodium to optimize blood plasma volume and muscular pump.
Post-Workout Window (within 45-90 minutes):
- 30 to 40g high-quality protein (whey, soy isolate, or complete amino blend) providing ~3g leucine.
- 0.8 to 1.2 g/kg fast-acting carbohydrates to replenish glycogen and reduce cortisol-induced muscle protein breakdown.
Hydration Guidelines:
- Baseline: 35 to 45 ml per kilogram of body weight daily.
- Intra-workout fluid loss: Consume 1.0 to 1.5 liters of fluid containing electrolytes (sodium, potassium, magnesium) for every 1.0 kg of bodyweight lost via perspiration."""
    },
    {
        "id": "doc_recovery_hrv_sleep",
        "title": "Recovery Science: Autonomic Nervous System, HRV, and Sleep Architecture",
        "category": "Recovery",
        "text": """Recovery is an active biological process requiring autonomic equilibrium between sympathetic (fight-or-flight) and parasympathetic (rest-and-digest) tone (Halson, 2014).
Key recovery bio-markers:
1. Heart Rate Variability (HRV): Reflects parasympathetic modulation of cardiac sinus rhythm. A drop of > 1.5 standard deviations below baseline indicates unrecovered central fatigue or systemic inflammation.
2. Sleep Architecture: Slow Wave Sleep (Stage 3/4 Deep Sleep) accounts for 95% of daily human growth hormone (HGH) secretion, driving myofibrillar tissue repair. Rapid Eye Movement (REM) sleep consolidates motor skills and neuromuscular coordination.
Recommended minimum: 7.5 to 9.0 hours of sleep per night.
Active Recovery Modalities:
- Low-intensity steady-state movement (Zone 1 cardio, walking, light cycling at < 55% max HR for 30 minutes) stimulates lymphatic drainage and promotes blood flow without adding muscular strain.
- Contrast water therapy, foam rolling, and mobility routines improve subjective perception of muscle soreness (DOMS)."""
    },
    {
        "id": "doc_exercise_substitution",
        "title": "Biomechanical Exercise Substitution and Equipment Adaptability",
        "category": "Exercise Science",
        "text": """When an athlete lacks specific gym equipment or experiences joint discomfort, exercises must be substituted along identical biomechanical movement vectors (McGill, 2010):
Movement Vector Mapping:
1. Horizontal Push: Barbell Bench Press <-> Flat Dumbbell Press <-> Weighted Push-ups <-> Plate-Loaded Chest Press.
2. Vertical Push: Barbell Overhead Press <-> Standing Dumbbell Press <-> Pike Push-ups <-> Handstand Push-up.
3. Horizontal Pull: Barbell Bent-over Row <-> Chest-Supported Dumbbell Row <-> Inverted Bodyweight Row <-> Cable Seated Row.
4. Vertical Pull: Wide-grip Pull-ups <-> Neutral-grip Chin-ups <-> Lat Pulldown <-> Resistance Band Pulldowns.
5. Knee-dominant Quadriceps: Barbell Back Squat <-> Goblet Squat <-> Bulgarian Split Squat <-> Leg Press.
6. Hip Hinge Posterior Chain: Barbell Romanian Deadlift <-> Dumbbell RDL <-> Kettlebell Swing <-> Single-leg Glute Bridge.
Substitution principle:
Maintain equal relative volume and matching target muscle length to stimulate identical motor unit recruitment patterns without violating the user's available equipment constraints."""
    }
]
