// Netlify Serverless Function for KRIDA AI Engine
// Handles all /api/* requests with sports science intelligence, RAG chatbot, and adaptive recommendations

const EXERCISES_DATABASE = [
  { id: 1, name: 'Barbell Bench Press', category: 'Chest', target_muscles: ['Pectoralis Major', 'Anterior Deltoid', 'Triceps'], equipment_needed: 'Barbell', difficulty: 'Intermediate', movement_type: 'Compound', instructions: 'Retract scapulae, maintain arched back with feet planted, lower bar with elbows at 45 degrees, press explosively to lockout.', sets_reps_recommendation: '4 sets × 6-10 reps' },
  { id: 2, name: 'Flat Dumbbell Press', category: 'Chest', target_muscles: ['Pectoralis Major', 'Triceps'], equipment_needed: 'Dumbbells', difficulty: 'Intermediate', movement_type: 'Compound', instructions: 'Press dumbbells with semi-neutral grip feeling full stretch at bottom without allowing shoulders to roll forward.', sets_reps_recommendation: '3-4 sets × 8-12 reps' },
  { id: 3, name: 'Incline Dumbbell Press', category: 'Chest', target_muscles: ['Clavicular Pectoralis', 'Anterior Deltoid'], equipment_needed: 'Dumbbells', difficulty: 'Intermediate', movement_type: 'Compound', instructions: 'Set bench to 30 degrees, lower dumbbells slowly to upper chest, drive upward converging slightly at top.', sets_reps_recommendation: '3-4 sets × 8-10 reps' },
  { id: 4, name: 'Barbell Back Squat', category: 'Legs', target_muscles: ['Quadriceps', 'Gluteus Maximus', 'Core'], equipment_needed: 'Barbell', difficulty: 'Advanced', movement_type: 'Compound', instructions: 'Bar rested on upper traps, brace core 360 degrees, sit hips down and back past parallel, drive up evenly through midfoot.', sets_reps_recommendation: '4 sets × 6-8 reps' },
  { id: 5, name: 'Barbell Romanian Deadlift', category: 'Legs', target_muscles: ['Hamstrings', 'Glutes', 'Erector Spinae'], equipment_needed: 'Barbell', difficulty: 'Intermediate', movement_type: 'Compound', instructions: 'Slight knee bend, push hips directly back while shaving barbell down shins, feel deep hamstring stretch, thrust hips forward.', sets_reps_recommendation: '3-4 sets × 8-10 reps' },
  { id: 6, name: 'Barbell Bent-Over Row', category: 'Back', target_muscles: ['Latissimus Dorsi', 'Rhomboids', 'Trapezius'], equipment_needed: 'Barbell', difficulty: 'Intermediate', movement_type: 'Compound', instructions: 'Hinge at hips to 45 degrees, pull barbell to lower ribcage keeping elbows tucked, squeeze scapulae.', sets_reps_recommendation: '4 sets × 8-10 reps' },
  { id: 7, name: 'Strict Pull-ups', category: 'Back', target_muscles: ['Latissimus Dorsi', 'Teres Major', 'Biceps'], equipment_needed: 'Pull-up Bar', difficulty: 'Advanced', movement_type: 'Calisthenics', instructions: 'Overhand grip, initiate pull with scapular depression, drive chest toward bar without kicking legs.', sets_reps_recommendation: '4 sets × 6-10 reps' },
  { id: 8, name: 'Overhead Barbell Press', category: 'Shoulders', target_muscles: ['Anterior Deltoid', 'Lateral Deltoid', 'Triceps'], equipment_needed: 'Barbell', difficulty: 'Intermediate', movement_type: 'Compound', instructions: 'Stand tall, squeeze glutes, press bar straight up over crown of head, shrugging slightly at top.', sets_reps_recommendation: '3-4 sets × 6-8 reps' },
  { id: 9, name: 'Dumbbell Lateral Raises', category: 'Shoulders', target_muscles: ['Lateral Deltoid'], equipment_needed: 'Dumbbells', difficulty: 'Beginner', movement_type: 'Isolation', instructions: 'Slight forward torso tilt, raise dumbbells to shoulder height leading with elbows, pause 0.5s.', sets_reps_recommendation: '4 sets × 12-15 reps' },
  { id: 10, name: 'Parallel Bar Dips', category: 'Arms', target_muscles: ['Triceps', 'Pectorals', 'Anterior Deltoids'], equipment_needed: 'Bodyweight', difficulty: 'Intermediate', movement_type: 'Calisthenics', instructions: 'Lower body until elbows reach 90 degrees, keep torso slightly tilted forward, press up to strong lockout.', sets_reps_recommendation: '3 sets × 8-12 reps' },
  { id: 11, name: 'Sled Push', category: 'Hyrox', target_muscles: ['Quadriceps', 'Calves', 'Cardiovascular'], equipment_needed: 'Full Gym', difficulty: 'Advanced', movement_type: 'Conditioning', instructions: 'Keep arms rigid, body at 45 degree driving angle, push with rapid marching cadence.', sets_reps_recommendation: '4 rounds × 25m' },
  { id: 12, name: 'SkiErg Intervals', category: 'Hyrox', target_muscles: ['Lats', 'Core', 'Posterior Chain'], equipment_needed: 'Full Gym', difficulty: 'Intermediate', movement_type: 'Conditioning', instructions: 'Hinge hips backwards, pull handles down through lats, snap hips through at finish.', sets_reps_recommendation: '5 × 250m sprints' },
];

const DEFAULT_USER = {
  id: 1,
  email: 'demo@krida.ai',
  username: 'Alex Vance',
  is_demo: true,
  has_plan: true,
};

exports.handler = async function (event, context) {
  // Enable CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Normalize path
  const path = event.path
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '');

  const method = event.httpMethod;
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      body = {};
    }
  }

  try {
    // 1. AUTH
    if (path === '/auth/demo-login' || path === '/auth/login' || path === '/auth/register') {
      const user = {
        id: path === '/auth/demo-login' ? 1 : Date.now(),
        email: body.email || 'athlete@krida.ai',
        username: body.username || (body.email ? body.email.split('@')[0] : 'Alex Vance'),
        is_demo: path === '/auth/demo-login',
        has_plan: true,
      };
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          access_token: 'krida_jwt_live_' + Date.now(),
          token_type: 'bearer',
          user,
        }),
      };
    }

    if (path === '/auth/me') {
      return { statusCode: 200, headers, body: JSON.stringify(DEFAULT_USER) };
    }

    // 2. PROFILE & PLAN GENERATION
    if (path === '/profile/generate-plan' || path === '/profile') {
      const weight = Number(body.weight_kg) || 78.2;
      const goal = body.primary_goal || 'Muscle Gain';
      const cals = goal.includes('Fat') ? Math.round(weight * 28 - 350) : Math.round(weight * 33 + 350);
      const protein = Math.round(weight * 2.1);
      const fat = Math.round(weight * 0.9);
      const carbs = Math.round((cals - (protein * 4 + fat * 9)) / 4);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: 1,
          user_id: 1,
          age: body.age || 27,
          gender: body.gender || 'Male',
          height_cm: body.height_cm || 180,
          weight_kg: weight,
          fitness_level: body.fitness_level || 'Intermediate',
          primary_goal: goal,
          training_frequency: body.training_frequency || 4,
          available_equipment: body.available_equipment || ['Dumbbells', 'Barbell', 'Pull-up Bar'],
          schedule_days: body.schedule_days || ['Monday', 'Tuesday', 'Thursday', 'Friday'],
          sports_interests: body.sports_interests || ['HYROX', 'Running'],
          nutrition: {
            daily_calories: cals,
            protein_g: protein,
            carbs_g: carbs,
            fat_g: fat,
            water_liters: 3.2,
          },
        }),
      };
    }

    // 3. WORKOUTS
    if (path === '/workouts/today') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          session: {
            id: 1,
            day_name: 'Today',
            training_type: 'Upper Body Heavy Compound & Hypertrophy',
            target_duration_mins: 55,
            target_intensity: 'RPE 8.0 - 8.5',
            notes: 'Progressive overload protocol: focus on 2s controlled eccentric tempo on all presses.',
            exercises: [
              { id: 1, exercise_name: 'Barbell Bench Press', sets: 4, reps: '6-8', rest_seconds: 120, intensity: 'RPE 8.5', order_index: 0 },
              { id: 2, exercise_name: 'Barbell Bent-Over Row', sets: 4, reps: '8-10', rest_seconds: 90, intensity: 'RPE 8.0', order_index: 1 },
              { id: 3, exercise_name: 'Incline Dumbbell Press', sets: 3, reps: '8-12', rest_seconds: 90, intensity: 'RPE 8.0', order_index: 2 },
              { id: 4, exercise_name: 'Strict Pull-ups', sets: 3, reps: '6-10', rest_seconds: 90, intensity: 'RPE 8.0', order_index: 3 },
              { id: 5, exercise_name: 'Dumbbell Lateral Raises', sets: 3, reps: '12-15', rest_seconds: 60, intensity: 'RPE 8.5', order_index: 4 },
            ],
          },
          plan_name: 'KRIDA Adaptive Performance Split',
          is_training_day: true,
        }),
      };
    }

    if (path === '/workouts/week') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          plan: {
            id: 1,
            name: 'KRIDA Adaptive Performance Split (4-Day Periodized)',
            goal: 'Muscle Gain & Athletic Power',
            split_name: 'Upper / Lower / HYROX Hybrid',
          },
          sessions: days.map((d, i) => ({
            id: i + 1,
            day_name: d,
            training_type: i % 2 === 0 ? 'Upper Strength & Mechanical Tension' : (i === 1 ? 'HYROX Compromised Engine' : 'Autonomic Active Recovery'),
            target_duration_mins: i % 2 === 0 ? 55 : (i === 1 ? 50 : 30),
            target_intensity: i % 2 === 0 ? 'RPE 8.0' : (i === 1 ? 'Zone 3-4' : 'Zone 1'),
            exercises: [
              { id: 10 + i, exercise_name: 'Barbell Bench Press', sets: 4, reps: '6-8', rest_seconds: 120, intensity: 'RPE 8.5', order_index: 0 },
              { id: 20 + i, exercise_name: 'Barbell Romanian Deadlift', sets: 4, reps: '8-10', rest_seconds: 90, intensity: 'RPE 8.0', order_index: 1 },
            ],
          })),
        }),
      };
    }

    if (path === '/workouts/log') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          message: `Logged session for ${body.exercise_name || 'Exercise'}`,
          log_id: Date.now(),
          progressive_overload_adaptation: {
            title: `Adaptive Overload: ${body.exercise_name || 'Exercise'}`,
            message: `Double-progression threshold satisfied at RPE 8. KRIDA increases target load by +2.5 kg next session.`,
            why_explanation: 'Stimulates high-threshold motor unit recruitment without technique breakdown.',
            status: 'increased',
          },
        }),
      };
    }

    if (path === '/workouts/replace-exercise') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          original_exercise: body.current_exercise_name || 'Barbell Bench Press',
          recommended_replacement: 'Flat Dumbbell Press',
          alternative_options: ['Weighted Push-ups', 'Cable Chest Flyes', 'Incline Dumbbell Press'],
          why_explanation: 'Biomechanical Vector Equivalence: Flat Dumbbell Press matches the horizontal pressing plane and pectoral fiber angle while eliminating shoulder impingement.',
          adjusted_sets: 3,
          adjusted_reps: '8-12 reps at RPE 8',
        }),
      };
    }

    // 4. NUTRITION
    if (path === '/nutrition') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: 1,
          daily_calories: 2550,
          protein_g: 170,
          carbs_g: 285,
          fat_g: 78,
          water_liters: 3.2,
          meal_breakdown: {
            breakfast: { name: 'Scrambled Eggs with Avocado, Sourdough & Fresh Berries', calories: 680, protein_g: 45, carbs_g: 70, fat_g: 22, notes: 'Bioavailable choline with complex low-GI carbs.' },
            lunch: { name: 'Grilled Chicken Breast, Sweet Potato Mash & Asparagus', calories: 850, protein_g: 62, carbs_g: 95, fat_g: 24, notes: 'Delivers 3.2g leucine to trigger muscle protein synthesis.' },
            dinner: { name: 'Wild Salmon Fillet with Jasmine Rice & Roasted Green Beans', calories: 660, protein_g: 42, carbs_g: 65, fat_g: 20, notes: 'Rich in EPA/DHA Omega-3 anti-inflammatory fats.' },
            snacks: { name: 'Whey Protein Shake with Blueberries & Almonds', calories: 260, protein_g: 16, carbs_g: 20, fat_g: 9, notes: 'Rapid amino acid delivery and antioxidant support.' },
          },
          pre_workout: 'Complex carbs (40-50g) + 25g protein 90 mins prior to session. Drink 500ml water with pinch of electrolytes.',
          post_workout: '30-40g high-quality protein + 45-60g carbs within 60 mins of workout completion to stimulate muscle protein synthesis via mTOR.',
          disclaimer: 'KRIDA provides general fitness and sports nutrition guidance based on sports science models. It is not a substitute for clinical medical or registered dietetic advice.',
        }),
      };
    }

    // 5. RECOVERY
    if (path === '/recovery' || path === '/recovery/check-in') {
      const sleep = Number(body.sleep_hours) || 7.8;
      const fatigue = Number(body.fatigue_level) || 3;
      const score = Math.min(98, Math.max(45, Math.round((sleep / 8.5) * 60 + (10 - fatigue) * 4)));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          recovery_score: score,
          fatigue_level: fatigue,
          sleep_hours: sleep,
          strain_score: 11.2,
          readiness_level: score >= 80 ? 'Prime' : (score >= 60 ? 'Moderate' : 'Rest Advised'),
          status_text: score >= 80 ? 'Optimal Performance State. Parasympathetic nervous system fully restored.' : 'Moderate recovery. Moderate intensity recommended.',
          recommendation: 'Cleared for high-intensity compound lifts and threshold sports training. Aim for progressive overload.',
        }),
      };
    }

    // 6. EXERCISES
    if (path.startsWith('/exercises')) {
      return { statusCode: 200, headers, body: JSON.stringify(EXERCISES_DATABASE) };
    }

    // 7. SPORTS MODULES
    if (path === '/sports/modules') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          athlete_level: 'Intermediate',
          sports: {
            HYROX: {
              title: 'HYROX Race Conditioning',
              badge: 'Hybrid Engine',
              description: '8 × 1km running intervals paired with 8 functional test stations. Builds compromised running stamina.',
              stations: [
                { station: '1000m SkiErg', target: '3:40 - 4:10 pace', focus: 'Lat engagement & hip hinge power' },
                { station: '50m Sled Push (102-152kg)', target: 'Low driving body angle', focus: 'Quadriceps & calf propulsion' },
                { station: '50m Sled Pull (78-103kg)', target: 'Hand over hand rhythm', focus: 'Posterior chain & forearm grip' },
                { station: '80m Burpee Broad Jumps', target: 'Continuous steady rhythm', focus: 'Cardiovascular stamina' },
                { station: '1000m Rowing Ergometer', target: '1:55 - 2:05 / 500m split', focus: 'Mitochondrial endurance' },
                { station: '200m Farmers Carry (2x24kg)', target: 'Zero stop progression', focus: 'Traps & anti-lateral flexion' },
                { station: '100m Sandbag Lunges (20kg)', target: 'Controlled knee touch', focus: 'Glute and quad endurance' },
                { station: '100 Wall Balls (6kg)', target: 'Unbroken sets of 25', focus: 'Thruster power & breathing cycle' },
              ],
              training_blocks: [
                { name: 'Compromised 1km Repeats', detail: '4 rounds: 1000m run at 10k pace + 20 Burpee Broad Jumps + 200m Farmers Carry' },
              ],
            },
            CALISTHENICS: {
              title: 'Gymnastic Strength & Leverage',
              badge: 'Bodyweight Mastery',
              description: 'Progressive manipulation of moment arms, hollow-body stability, and straight-arm tendon conditioning.',
              stations: [
                { station: 'Strict Pull-ups', target: '3 × 8-12 reps', focus: 'Hollow body, full ROM chest-to-bar' },
                { station: 'Parallel Bar Dips', target: '3 × 10-15 reps', focus: 'Forward lean, triceps & pecs lockout' },
                { station: 'Muscle-up Progression', target: '5 × 2-4 reps', focus: 'Explosive high pull & fast transition' },
              ],
              training_blocks: [
                { name: 'Upper Kinetic Chain Flow', detail: 'Bar Muscle-ups -> Straight Bar Dips -> Pull-ups with 90s rest' },
              ],
            },
          },
        }),
      };
    }

    // 8. CHAT (AI FITNESS COACH)
    if (path === '/chat') {
      const rawMsg = (body.message || '').trim();
      const msg = rawMsg.toLowerCase();

      // Check emergency guardrails
      const emergencyWords = ['chest pain', 'fainting', 'fainted', 'passed out', 'severe breathlessness', 'heart attack', 'broken bone'];
      if (emergencyWords.some((w) => msg.includes(w))) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            reply: `🚨 **URGENT MEDICAL ALERT:**\n\nThe symptoms you reported (such as chest pain or fainting) are critical warning signs that can indicate a life-threatening medical emergency. **Please immediately cease all exercise and contact emergency medical services (112 / 911) without delay.**\n\n*Disclaimer: KRIDA AI is an educational fitness platform and not an emergency or diagnostic medical provider.*`,
            sources: [],
            suggested_followups: ['What emergency precautions should I take?'],
          }),
        };
      }

      // Check acute injury guardrail
      const injuryWords = ['sharp pain', 'injury', 'torn', 'swollen joint', 'severe pain', 'prescribe medicine'];
      if (injuryWords.some((w) => msg.includes(w))) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            reply: `⚠️ **Safety Boundary Notice:**\n\nAs KRIDA AI, your physical safety is my top priority. I cannot diagnose injuries, provide clinical medical opinions, or prescribe pharmaceutical medications. Because you mentioned acute pain or injury symptoms, **I strongly recommend consulting a qualified physical therapist, orthopedist, or physician** for an in-person assessment before continuing loaded training.`,
            sources: [{ title: 'Sports Medicine & Joint Safety Corpus', category: 'Biomechanics', score: '0.95' }],
            suggested_followups: ['How should I warm up to prevent joint irritation?', 'Can you suggest a low-impact active recovery session?'],
          }),
        };
      }

      // Check greetings
      const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'who are you', 'what can you do'];
      if (greetings.some((g) => msg.startsWith(g) || msg === g)) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            reply: `Hello Athlete! I am **KRIDA AI Coach**, your dedicated personal fitness, sports science, and athletic conditioning mentor.\n\nI specialize in evidence-based guidance across:\n• 🏋️ **Gym & Hypertrophy:** Individualized workout splits, exercise technique & progressive overload\n• 🤸 **Calisthenics:** Strict gymnastic progressions (muscle-ups, planches, levers, handstands)\n• 🏃 **HYROX & Endurance:** Race station pacing, compromised running & Zone 2 aerobic base\n• 🥗 **Sports Nutrition:** Target macronutrients, pre/post-workout meal timing & hydration\n• 💤 **Athletic Recovery:** Sleep optimization, autonomic HRV tracking & deload planning\n\nHow can I assist your athletic preparation or workout today?`,
            sources: [{ title: 'KRIDA Sports Science & Exercise Physiology Corpus', category: 'Biomechanics', score: '0.98' }],
            suggested_followups: [
              'Can I substitute barbell bench press with dumbbells?',
              'What should I eat 90 minutes before a heavy workout?',
              'How do I pace the 1km runs between HYROX stations?',
              'How do I calculate progressive overload for my lifts?',
            ],
          }),
        };
      }

      // Check unrelated non-fitness topics
      const unrelatedPatterns = [
        /\b(python|javascript|typescript|java|c\+\+|coding|write a script|programming|syntax|bug|compiler)\b/,
        /\b(election|president|prime minister|parliament|congress|senate|politician|democrat|republican)\b/,
        /\b(movie|movies|film|films|actor|actress|hollywood|bollywood|netflix|cinema|song|music|lyrics)\b/,
        /\b(capital of|largest country|population of|who invented|who discovered|world war|french revolution)\b/,
        /\b(weather in|weather today|temperature today|forecast|horoscope|astrology)\b/,
        /\b(solve this equation|calculus|derivative of|integral of|write an essay|write a poem)\b/,
        /\b(bitcoin|cryptocurrency|crypto|stock market|forex|car repair)\b/,
      ];

      const fitnessKeywords = [
        'workout', 'training', 'train', 'exercise', 'gym', 'lift', 'lifting', 'weight', 'weights', 'barbell',
        'dumbbell', 'kettlebell', 'bench', 'squat', 'deadlift', 'press', 'curl', 'row', 'lunge', 'plank',
        'hypertrophy', 'muscle', 'strength', 'rep', 'reps', 'set', 'sets', 'rpe', 'rir', '1rm', 'split',
        'deload', 'warmup', 'warm-up', 'cooldown', 'cool-down', 'progressive overload', 'overload', 'form',
        'calisthenics', 'bodyweight', 'muscle-up', 'muscle up', 'planche', 'lever', 'handstand', 'pullup',
        'pull-up', 'chinup', 'chin-up', 'pushup', 'push-up', 'dip', 'dips', 'hyrox', 'skierg', 'sled',
        'burpee', 'wall ball', 'farmers carry', 'sandbag', 'running', 'run', '5k', '10k', 'marathon',
        'zone 2', 'cardio', 'endurance', 'stamina', 'pace', 'nutrition', 'diet', 'food', 'eat', 'meal',
        'calorie', 'calories', 'protein', 'carb', 'carbs', 'fat', 'macro', 'macros', 'whey', 'creatine',
        'pre-workout', 'preworkout', 'post-workout', 'postworkout', 'bulk', 'bulking', 'cut', 'cutting',
        'hydration', 'water', 'electrolyte', 'electrolytes', 'sleep', 'fatigue', 'tired', 'sore', 'soreness',
        'recovery', 'fat loss', 'weight loss', 'athlete', 'fitness',
      ];

      const isExplicitlyUnrelated = unrelatedPatterns.some((pattern) => pattern.test(msg));
      const hasFitnessKeywords = fitnessKeywords.some((kw) => msg.includes(kw));

      if (isExplicitlyUnrelated || !hasFitnessKeywords) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            reply: `I am **KRIDA AI Coach**, a specialized sports science and athletic performance mentor. I can only assist with questions strictly related to fitness, athletic training, nutrition, and recovery:\n\n• **Gym & Strength Training:** Workout splits, progressive overload, biomechanics & form cues\n• **Calisthenics & Gymnastics:** Bodyweight skill progressions (muscle-ups, planches, levers, handstands)\n• **HYROX & Endurance:** Race station pacing, compromised running intervals, Zone 2 aerobic base\n• **Sports Nutrition:** Macronutrient partitioning, meal timing, pre/post-workout fueling & hydration\n• **Athletic Recovery:** Sleep optimization, deload planning, HRV, and fatigue management\n\nYour inquiry appears to be outside the domain of fitness and sports performance. Please feel free to ask me a question related to your training routines, exercises, nutrition strategy, or athletic recovery!`,
            sources: [],
            suggested_followups: [
              'How do I calculate progressive overload for my lifts?',
              'What should I eat 90 minutes before a heavy workout?',
              'How do I pace the 1km runs between HYROX stations?',
              'Can I substitute barbell bench press with dumbbells?',
            ],
          }),
        };
      }

      let reply = `Based on your training profile and current recovery metrics, KRIDA recommends prioritizing mechanical tension with 1–2 Reps in Reserve (RIR) on all heavy compound lifts to maximize progressive adaptations without central nervous system burnout.`;
      let sources = [{ title: 'Exercise Physiology & Biomechanics Corpus', category: 'Sports Science', score: '0.94' }];

      if (msg.includes('replace') || msg.includes('dumbbell') || msg.includes('swap') || msg.includes('substitute')) {
        reply = `To substitute barbell pressing with dumbbells:\n\n• **Primary Biomechanical Swap:** **Flat or Incline Dumbbell Press (3–4 sets of 8–10 reps at RPE 8)**.\n• **Biomechanical Rationale:** Dumbbell pressing provides identical sternal pectoralis recruitment and horizontal adduction while permitting natural humerus rotation and converging arm pathways, significantly relieving anterior shoulder capsule strain.\n• **Prescription:** Rest 90–120 seconds between sets with a controlled 3-second eccentric tempo.`;
        sources = [{ title: 'Biomechanical Exercise Substitution and Equipment Adaptability', category: 'Exercise Science', score: '0.96' }];
      } else if (msg.includes('water') || msg.includes('hydration') || msg.includes('hydrate') || msg.includes('electrolyte')) {
        reply = `KRIDA's evidence-based athletic hydration protocol:\n\n• **Intra-Workout Fluid Intake:** Consume **150–250 ml (5–8 oz) every 15–20 minutes** during training (~500–750 ml per workout hour).\n• **Electrolyte Threshold:** If training exceeds 60 minutes or in high ambient heat, add **300–500 mg sodium and potassium** to prevent hyponatremia and sustain muscular contractility.\n• **Post-Workout Rehydration:** Consume 1.25L of fluid per 1.0 kg of body mass lost in perspiration over the next 2 hours.`;
        sources = [{ title: 'Peri-Workout Nutrition, Electrolyte Balance, and Hydration', category: 'Nutrition', score: '0.97' }];
      } else if (msg.includes('pre-workout') || msg.includes('preworkout') || msg.includes('before workout') || msg.includes('eat before')) {
        reply = `Pre-workout fueling strategy for athletic performance:\n\n• **Timing Window:** Consume your meal **90 to 120 minutes prior** to training.\n• **Carbohydrates (40–50g):** Complex, easily digested carbs (oatmeal with banana, sourdough toast, or rice cakes) to saturate glycogen stores.\n• **Protein (20–25g):** Lean, high-quality protein (whey isolate, Greek yogurt, or egg whites) to provide circulating amino acids.\n• **Fats & Fiber (<8g):** Keep fat and fiber minimal to avoid delayed gastric emptying and digestive discomfort.`;
        sources = [{ title: 'Peri-Workout Nutrition, Electrolyte Balance, and Hydration', category: 'Nutrition', score: '0.95' }];
      } else if (msg.includes('post-workout') || msg.includes('postworkout') || msg.includes('after workout') || msg.includes('eat after')) {
        reply = `Post-workout recovery and muscle protein synthesis protocol:\n\n• **Anabolic Window Timing:** Consume within **45 to 90 minutes** post-training.\n• **Protein Target (30–40g):** High-leucine protein (whey/soy isolate, chicken breast, Greek yogurt, or tofu) containing at least **2.7–3.0g leucine** to trigger the intracellular mTORC1 pathway.\n• **Carbohydrate Target (40–60g):** Moderate-to-fast carbs (white rice, bananas, honey) to rapidly replenish muscle glycogen.\n• **Hydration:** Replenish 1.25L of fluid per kg lost in sweat.`;
        sources = [{ title: 'Peri-Workout Nutrition, Electrolyte Balance, and Hydration', category: 'Nutrition', score: '0.94' }];
      } else if (msg.includes('protein') || msg.includes('how much protein')) {
        reply = `Evidence-based daily protein guidelines for athletes:\n\n• **Daily Target:** Target **1.6 to 2.2 grams of protein per kilogram of body weight** (approx. 0.73–1.0 g/lb) to optimize hypertrophy and tissue repair.\n• **If in a Calorie Deficit (Cutting):** Elevate intake to **2.2–2.4 g/kg** to prevent muscle catabolism.\n• **Meal Distribution:** Split into 3–4 meals containing 30–45g of protein spaced 3–4 hours apart, each containing at least 2.7g leucine.`;
        sources = [{ title: 'Macronutrient Partitioning, TDEE, and Performance Fueling', category: 'Nutrition', score: '0.96' }];
      } else if (msg.includes('creatine')) {
        reply = `Creatine Monohydrate evidence-based protocol:\n\n• **Dosage:** 3–5 grams daily taken consistently at any time of day.\n• **Loading Phase:** Not required. Consuming 3–5g daily fully saturates muscle phosphocreatine stores within 28 days without stomach discomfort.\n• **Mechanism:** Rephosphorylates ADP into ATP during maximal anaerobic efforts, yielding a verified 5–10% increase in strength power and work volume.\n• **Hydration:** Increase daily water intake by 500ml as creatine increases intracellular fluid retention.`;
        sources = [{ title: 'Sports Supplementation & Ergogenic Aids', category: 'Nutrition', score: '0.95' }];
      } else if (msg.includes('hyrox') || msg.includes('sled') || msg.includes('run') || msg.includes('skierg') || msg.includes('5k')) {
        reply = `For **HYROX preparation and endurance conditioning**:\n\n• **Compromised Running Intervals:** Train 1,000m running repeats immediately following station fatigue (e.g., 50m Sled Push + 1km run at 10K pace) to train your nervous system to clear lactate under extreme fatigue.\n• **Pacing Discipline:** Keep early stations (SkiErg, Sleds) strictly in **Zone 3 (85–90% max HR)** to preserve glycogen for stations 7 and 8 (Sandbag Lunges and Wall Balls).\n• **Aerobic Base (80/20 Rule):** Ensure 80% of weekly running volume is in conversational **Zone 2 (HR 130–145 bpm)**.`;
        sources = [{ title: 'HYROX Race Architecture and Energy System Demands', category: 'HYROX', score: '0.97' }];
      } else if (msg.includes('calisthenics') || msg.includes('muscle up') || msg.includes('muscle-up') || msg.includes('planche') || msg.includes('handstand')) {
        reply = `For gymnastic leverage mastery and calisthenics skill progressions:\n\n• **Prerequisite Checklist:** Develop a baseline of **10–12 strict chest-to-bar pull-ups** and **15 deep straight-bar dips** before initiating dynamic turnovers.\n• **Straight-Arm Tendon Conditioning:** Prioritize active hollow hangs, false-grip bar work, and scapular depressions to condition the distal biceps tendons and shoulder capsules.\n• **Turnover Mechanics:** Practice explosive pull-ups to the sternum with rapid forward chest transition over the bar into the dip lockout.\n• **Programming:** 3–5 sets of 2–4 high-quality reps with 2–3 minutes full neural rest.`;
        sources = [{ title: 'Bodyweight Strength and Gymnastic Movement Progressions', category: 'Calisthenics', score: '0.98' }];
      } else if (msg.includes('overload') || msg.includes('progressive') || msg.includes('plateau') || msg.includes('increase bench')) {
        reply = `KRIDA's Double-Progression Overload Protocol:\n\n• **Step 1:** Establish a repetition bracket (e.g., 6–8 or 8–12 reps).\n• **Step 2:** Keep working load constant until all sets hit the top rep target at RPE <= 8.5 with clean biomechanical control.\n• **Step 3:** Increase load by **+2.5 kg for upper-body compound lifts** or **+5.0 kg for lower-body compound lifts**, dropping reps back to the bottom of the bracket.`;
        sources = [{ title: 'Principles of Progressive Overload & Adaptive Resistance', category: 'Progressive Overload', score: '0.98' }];
      } else if (msg.includes('deload') || msg.includes('tired') || msg.includes('fatigue') || msg.includes('sleep') || msg.includes('recovery')) {
        reply = `KRIDA recovery and deload science:\n\n• **Deload Trigger:** When lift numbers stall or regress across 2 consecutive microcycles with elevated morning resting HR, take a 1-week deload.\n• **Deload Protocol:** Cut total weekly volume by **40–50%**, keeping working intensity at 70–80% 1RM at RPE 6–7 to preserve motor recruitment.\n• **Sleep Hygiene:** Target 7.5–9 hours of sleep nightly; slow-wave Stage 3–4 sleep facilitates over 80% of daily growth hormone (GH) secretion.`;
        sources = [{ title: 'Recovery Science: Autonomic Nervous System, HRV, and Sleep Architecture', category: 'Recovery', score: '0.97' }];
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reply,
          sources,
          suggested_followups: [
            'How do I calculate progressive overload for my lifts?',
            'What is the optimal HYROX pacing strategy?',
            'Can you recommend a pre-workout meal plan?',
          ],
        }),
      };
    }

    // 9. RECOMMENDATIONS
    if (path === '/recommendations') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          recommendations: [
            {
              id: 1,
              type: 'overload',
              title: 'Adaptive Overload: Barbell Bench Press Target Increase',
              message: 'Your Barbell Bench Press reached 85 kg × 8 reps at RPE 8.0. KRIDA recommends increasing your target load to 87.5 kg for your upcoming heavy session.',
              why_explanation: 'Double-progression threshold satisfied across all working sets with stable barbell velocity. Incrementing load ensures continued progressive overload.',
              created_at: 'Active',
            },
          ],
        }),
      };
    }

    // 10. PROGRESS & ANALYTICS
    if (path === '/progress/analytics') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          weight_history: [
            { date: 'Sep 08', weight: 80.5 },
            { date: 'Sep 15', weight: 79.8 },
            { date: 'Sep 22', weight: 79.1 },
            { date: 'Sep 29', weight: 78.6 },
            { date: 'Oct 06', weight: 78.2 },
          ],
          strength_history: [
            { date: 'Sep 08', bench: 77.5, squat: 105, deadlift: 125 },
            { date: 'Sep 15', bench: 80.0, squat: 108, deadlift: 130 },
            { date: 'Sep 22', bench: 82.5, squat: 110, deadlift: 135 },
            { date: 'Sep 29', bench: 85.0, squat: 112, deadlift: 138 },
            { date: 'Oct 06', bench: 87.5, squat: 115, deadlift: 140 },
          ],
          volume_history: [
            { date: 'W1', volume: 3200 },
            { date: 'W2', volume: 3450 },
            { date: 'W3', volume: 3700 },
            { date: 'W4', volume: 3950 },
            { date: 'W5', volume: 4200 },
          ],
          consistency_rate: 94.2,
          total_workouts_completed: 18,
          personal_records: {
            bench_press_1rm: 87.5,
            squat_1rm: 115.0,
            deadlift_1rm: 140.0,
            running_5k_mins: '24:15',
          },
        }),
      };
    }

    // Default 404
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `Route ${path} not found` }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
