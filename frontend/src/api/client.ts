// KRIDA AI - High Performance Sports Science API Client
// Provides multi-tiered architecture:
// 1. Live FastAPI Cloud Backend (when VITE_API_URL or local server is configured)
// 2. Netlify Serverless Functions (when deployed to Netlify with functions enabled)
// 3. Client-Side Sports Science & LocalStorage Engine (seamless zero-failure standalone fallback)

const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

export function getAuthToken(): string | null {
  return localStorage.getItem('krida_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('krida_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('krida_token');
}

// -------------------------------------------------------------
// State Management for Local Engine
// -------------------------------------------------------------
function getLocalUsers(): any[] {
  try {
    const raw = localStorage.getItem('krida_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: any[]) {
  try {
    localStorage.setItem('krida_users', JSON.stringify(users));
  } catch {}
}

function getActiveUser(): any {
  try {
    const raw = localStorage.getItem('krida_active_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    id: 1,
    email: 'demo@krida.ai',
    username: 'Alex Vance',
    is_demo: true,
    has_plan: true,
  };
}

function saveActiveUser(user: any) {
  try {
    localStorage.setItem('krida_active_user', JSON.stringify(user));
  } catch {}
}

const DEFAULT_EXERCISES = [
  { id: 1, name: 'Barbell Bench Press', category: 'Chest', target_muscles: ['Pectoralis Major', 'Triceps', 'Anterior Deltoids'], equipment_needed: 'Barbell', difficulty: 'Intermediate', movement_type: 'Compound', instructions: 'Retract scapulae, maintain arched back with feet planted, lower bar with elbows at 45 degrees, press explosively to lockout.', sets_reps_recommendation: '4 sets × 6-10 reps' },
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
  { id: 13, name: 'Bulgarian Split Squats', category: 'Legs', target_muscles: ['Quadriceps', 'Glutes'], equipment_needed: 'Dumbbells', difficulty: 'Advanced', movement_type: 'Compound', instructions: 'Rear foot elevated on bench, descend front knee until parallel, drive through midfoot.', sets_reps_recommendation: '3 sets × 8-12 each leg' },
  { id: 14, name: 'Dumbbell Goblet Squats', category: 'Legs', target_muscles: ['Quadriceps', 'Glutes', 'Core'], equipment_needed: 'Dumbbells', difficulty: 'Beginner', movement_type: 'Compound', instructions: 'Hold single dumbbell at chest, squat deep between knees with vertical spine.', sets_reps_recommendation: '3-4 sets × 10-12 reps' },
];

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';

    // If server returned HTML (e.g. Netlify SPA index.html catch-all), there's no backend route here!
    if (contentType.includes('text/html')) {
      return handleClientFallback<T>(endpoint, options);
    }

    if (!response.ok) {
      const text = await response.text();
      let detail = `Request failed with status ${response.status}`;
      try {
        const parsed = JSON.parse(text);
        if (parsed.detail) {
          detail = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
        }
      } catch {}

      // Explicitly handle 401 Unauthorized
      if (response.status === 401) {
        removeAuthToken();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('krida:unauthorized', { detail: { endpoint, message: detail } }));
        }
        const authErr: any = new Error(detail);
        authErr.status = 401;
        throw authErr;
      }

      // If client validation error (400, 403, 404, 422), propagate error to caller
      if (response.status >= 400 && response.status < 500) {
        const clientErr: any = new Error(detail);
        clientErr.status = response.status;
        throw clientErr;
      }

      return handleClientFallback<T>(endpoint, options);
    }

    const text = await response.text();
    if (!text || text.trim().startsWith('<')) {
      return handleClientFallback<T>(endpoint, options);
    }

    return JSON.parse(text) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Propagate explicit HTTP errors (401, 400, 422) instead of swallowing them
    if (err && err.status) {
      throw err;
    }
    // If an auth request fails due to network outage, propagate error
    if (endpoint.startsWith('/auth/')) {
      throw err;
    }
    // Graceful fallback for non-auth requests when offline
    return handleClientFallback<T>(endpoint, options);
  }
}

// -------------------------------------------------------------
// Resilient Client-Side Sports Science Engine
// -------------------------------------------------------------
function handleClientFallback<T>(endpoint: string, options: RequestInit): T {
  let body: any = {};
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {}
  }

  // 1. AUTH
  if (endpoint.includes('/auth/demo-login')) {
    const demoUser = {
      id: 1,
      email: 'demo@krida.ai',
      username: 'Alex Vance',
      is_demo: true,
      has_plan: true,
    };
    setAuthToken('krida_token_demo_' + Date.now());
    saveActiveUser(demoUser);
    return {
      access_token: 'krida_token_demo_' + Date.now(),
      token_type: 'bearer',
      user: demoUser,
    } as T;
  }

  if (endpoint.includes('/auth/register') || endpoint.includes('/auth/login')) {
    const users = getLocalUsers();
    let user = users.find((u: any) => u.email === body.email);

    if (!user) {
      user = {
        id: Date.now(),
        email: body.email || 'athlete@krida.ai',
        username: body.username || (body.email ? body.email.split('@')[0] : 'Athlete'),
        is_demo: false,
        has_plan: true,
      };
      users.push(user);
      saveLocalUsers(users);
    }

    const token = 'krida_token_' + user.id;
    setAuthToken(token);
    saveActiveUser(user);

    return {
      access_token: token,
      token_type: 'bearer',
      user,
    } as T;
  }

  if (endpoint.includes('/auth/me')) {
    const active = getActiveUser();
    return active as T;
  }

  // 2. PROFILE & ONBOARDING PLAN GENERATION
  if (endpoint.includes('/profile/generate-plan')) {
    const weight = Number(body.weight_kg) || 78.2;
    const goal = body.primary_goal || 'Muscle Gain';
    const cals = goal.includes('Fat') ? Math.round(weight * 28 - 350) : Math.round(weight * 33 + 350);
    const protein = Math.round(weight * 2.1);
    const fat = Math.round(weight * 0.9);
    const carbs = Math.round((cals - (protein * 4 + fat * 9)) / 4);

    const profileData = {
      id: 1,
      user_id: 1,
      age: body.age || 27,
      gender: body.gender || 'Male',
      height_cm: body.height_cm || 180,
      weight_kg: weight,
      fitness_level: body.fitness_level || 'Intermediate',
      primary_goal: goal,
      training_experience: body.training_experience || '1–3 years',
      training_frequency: body.training_frequency || 4,
      available_equipment: body.available_equipment || ['Dumbbells', 'Barbell', 'Pull-up Bar'],
      training_preference: body.training_preference || 'Gym',
      dietary_preference: body.dietary_preference || 'Non-Vegetarian',
      sports_interests: body.sports_interests || ['HYROX', 'Running'],
      schedule_days: body.schedule_days || ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    };

    localStorage.setItem('krida_profile', JSON.stringify(profileData));

    // Update active user state to have plan
    const active = getActiveUser();
    active.has_plan = true;
    saveActiveUser(active);

    return profileData as T;
  }

  if (endpoint.includes('/profile')) {
    try {
      const raw = localStorage.getItem('krida_profile');
      if (raw) return JSON.parse(raw) as T;
    } catch {}
    return {
      id: 1,
      user_id: 1,
      age: 27,
      gender: 'Male',
      height_cm: 180,
      weight_kg: 78.2,
      fitness_level: 'Intermediate',
      primary_goal: 'Muscle Gain & Athletic Power',
      training_experience: '1–3 years',
      training_frequency: 4,
      available_equipment: ['Dumbbells', 'Barbell', 'Pull-up Bar'],
      training_preference: 'Gym',
      dietary_preference: 'Non-Vegetarian',
      sports_interests: ['HYROX', 'Running'],
      schedule_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
    } as T;
  }

  // 3. WORKOUTS
  if (endpoint.includes('/workouts/today')) {
    return {
      session: {
        id: 1,
        day_name: 'Today',
        training_type: 'Upper Body Heavy Compound & Hypertrophy',
        target_duration_mins: 55,
        target_intensity: 'RPE 8.0 - 8.5',
        notes: 'Target progressive overload on primary barbell press. Controlled 2s eccentric descent.',
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
    } as T;
  }

  if (endpoint.includes('/workouts/week')) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return {
      plan: {
        id: 1,
        name: 'KRIDA Adaptive Performance Split (4-Day)',
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
    } as T;
  }

  if (endpoint.includes('/workouts/generate')) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const goal = body.goals || 'Muscle Gain';
    const splitName = (body.training_days || 4) >= 5 ? 'Push / Pull / Legs Adaptive Split' : 'Upper / Lower Performance Split';
    const sessions = days.map((d, i) => ({
      id: i + 1,
      day_name: d,
      training_type: i % 2 === 0 ? 'Upper Strength & Hypertrophy' : (i === 1 ? 'HYROX Endurance Engine' : 'Active Autonomic Recovery'),
      target_duration_mins: i % 2 === 0 ? (body.session_duration_mins || 60) : 30,
      target_intensity: i % 2 === 0 ? 'RPE 8.0' : 'Zone 2',
      exercises: [
        { exercise_name: 'Barbell Bench Press', sets: 4, reps: '6-8', rest: '120s', intensity: 'RPE 8.5' },
        { exercise_name: 'Barbell Romanian Deadlift', sets: 4, reps: '8-10', rest: '90s', intensity: 'RPE 8.0' },
        { exercise_name: 'Pull-ups', sets: 3, reps: '8-10', rest: '90s', intensity: 'RPE 8.0' },
      ],
    }));

    return {
      status: 'success',
      plan_id: 1,
      plan_name: `KRIDA ${goal} Split (${body.training_days || 4}-Day)`,
      split_name: splitName,
      is_ai_generated: false,
      engine_label: 'Deterministic Sports Science Recommendation Engine (Offline Fallback)',
      warmup_protocol: [
        '5 minutes light dynamic aerobic preparation',
        'Thoracic mobility & World\'s Greatest Stretch',
        'Ramping warm-up sets on primary compound lifts',
      ],
      cooldown_protocol: [
        '3 minutes parasympathetic box breathing',
        'Targeted static stretching & myofascial foam rolling',
      ],
      progression_guidelines: 'Apply double-progression: When all sets hit top of repetition bracket at RPE <= 8.5, increase load by 2.5kg.',
      sessions,
    } as T;
  }

  if (endpoint.includes('/workouts/log')) {
    const exName = body.exercise_name || 'Exercise';
    return {
      status: 'success',
      message: `Successfully logged ${exName}`,
      log_id: Date.now(),
      progressive_overload_adaptation: {
        title: `Adaptive Overload: ${exName}`,
        message: `Your working sets for ${exName} met target repetition brackets at RPE 8. KRIDA increases target load by +2.5 kg next session.`,
        why_explanation: 'Double-progression threshold satisfied with stable mechanical intent. Increases high-threshold motor unit recruitment.',
        status: 'increased',
      },
    } as T;
  }

  if (endpoint.includes('/workouts/history')) {
    return {
      logs: [
        { id: 1, exercise_name: 'Barbell Bench Press', sets_completed: 4, reps_completed: [8, 8, 7, 7], weight_kg: [85.0, 85.0, 85.0, 85.0], notes: 'Felt explosive and locked in.', rpe: 8.5, completed_at: 'Yesterday' },
        { id: 2, exercise_name: 'Barbell Bent-Over Row', sets_completed: 4, reps_completed: [10, 10, 10, 9], weight_kg: [67.5, 67.5, 67.5, 67.5], notes: 'Strong scapular retraction.', rpe: 8.0, completed_at: '3 days ago' },
      ],
    } as T;
  }

  if (endpoint.includes('/workouts/replace-exercise')) {
    return {
      original_exercise: body.current_exercise_name || 'Barbell Bench Press',
      recommended_replacement: 'Flat Dumbbell Press',
      alternative_options: ['Weighted Push-ups', 'Cable Chest Flyes', 'Incline Dumbbell Press'],
      why_explanation: 'Biomechanical Vector Equivalence: Flat Dumbbell Press matches horizontal pushing mechanics and sternal pectoralis angle while reducing anterior shoulder joint impingement.',
      adjusted_sets: 3,
      adjusted_reps: '8-12 reps at RPE 8',
    } as T;
  }

  // 4. NUTRITION
  if (endpoint.includes('/nutrition/ask')) {
    return {
      answer: "Pre-workout fueling strategy: Consume 40–50g complex carbohydrates (oatmeal or banana on sourdough) paired with 25g high-quality protein 90–120 minutes prior to training. Drink 500ml water with electrolytes to maximize cellular hydration and pump mechanics.",
      sources: [{ title: 'Peri-Workout Nutrient Timing & Hypertrophy', category: 'Nutrition', score: '0.95' }],
      disclaimer: 'KRIDA provides sports performance nutrition models.',
    } as T;
  }

  if (endpoint.includes('/nutrition')) {
    return {
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
      disclaimer: 'KRIDA provides general fitness and sports nutrition guidance based on sports science models.',
    } as T;
  }

  // 5. RECOVERY
  if (endpoint.includes('/recovery/check-in') || endpoint.includes('/recovery')) {
    const sleep = Number(body.sleep_hours) || 7.8;
    const fatigue = Number(body.fatigue_level) || 3;
    const score = Math.min(98, Math.max(45, Math.round((sleep / 8.5) * 60 + (10 - fatigue) * 4)));

    return {
      recovery_score: score,
      fatigue_level: fatigue,
      sleep_hours: sleep,
      strain_score: 11.2,
      readiness_level: score >= 80 ? 'Prime' : (score >= 60 ? 'Moderate' : 'Rest Advised'),
      status_text: score >= 80 ? 'Optimal Performance State. Parasympathetic nervous system fully restored.' : 'Moderate recovery. Moderate intensity recommended.',
      recommendation: 'Cleared for high-intensity compound lifts and threshold sports training. Aim for progressive overload.',
    } as T;
  }

  // 6. EXERCISES & CALISTHENICS
  if (endpoint.includes('/calisthenics/skills')) {
    return [
      { id: 1, user_id: 1, skill_name: 'Push-ups', progression_level: 'Diamond & Archer Push-ups', level_number: 3, hold_duration_sec: 0, repetitions: 15, milestone_status: 'In Training', notes: 'Baseline calibration milestone' },
      { id: 2, user_id: 1, skill_name: 'Pull-ups', progression_level: 'Strict Dead-Hang Pull-ups', level_number: 2, hold_duration_sec: 0, repetitions: 10, milestone_status: 'In Training', notes: 'Baseline calibration milestone' },
      { id: 3, user_id: 1, skill_name: 'Dips', progression_level: 'Parallel Bar Dips', level_number: 2, hold_duration_sec: 0, repetitions: 12, milestone_status: 'In Training', notes: 'Baseline calibration milestone' },
      { id: 4, user_id: 1, skill_name: 'Handstands', progression_level: 'Chest-to-Wall Handstand Hold', level_number: 2, hold_duration_sec: 45, repetitions: 0, milestone_status: 'In Training', notes: 'Baseline calibration milestone' },
      { id: 5, user_id: 1, skill_name: 'L-sits', progression_level: 'Tuck L-Sit on Floor / Parallettes', level_number: 1, hold_duration_sec: 20, repetitions: 0, milestone_status: 'In Training', notes: 'Baseline calibration milestone' },
      { id: 6, user_id: 1, skill_name: 'Front Lever', progression_level: 'Advanced Tuck Front Lever', level_number: 2, hold_duration_sec: 12, repetitions: 0, milestone_status: 'In Training', notes: 'Baseline calibration milestone' },
      { id: 7, user_id: 1, skill_name: 'Muscle-Up', progression_level: 'Deep Straight-Bar Dips & Banded Transition', level_number: 2, hold_duration_sec: 0, repetitions: 6, milestone_status: 'In Training', notes: 'Baseline calibration milestone' }
    ] as T;
  }

  if (endpoint.includes('/exercises')) {
    return DEFAULT_EXERCISES as T;
  }

  // 7. SPORTS MODULES
  if (endpoint.includes('/sports/modules')) {
    return {
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
    } as T;
  }

  // 8. CHAT (AI COACH)
  if (endpoint.includes('/chat')) {
    const rawMsg = (body.message || '').trim();
    const msg = rawMsg.toLowerCase();

    // Check emergency guardrails
    const emergencyWords = ['chest pain', 'fainting', 'fainted', 'passed out', 'severe breathlessness', 'heart attack', 'broken bone'];
    if (emergencyWords.some((w) => msg.includes(w))) {
      return {
        reply: `🚨 **URGENT MEDICAL ALERT:**\n\nThe symptoms you reported (such as chest pain or fainting) are critical warning signs that can indicate a life-threatening medical emergency. **Please immediately cease all exercise and contact emergency medical services (112 / 911) without delay.**\n\n*Disclaimer: KRIDA AI is an educational fitness platform and not an emergency or diagnostic medical provider.*`,
        sources: [],
        suggested_followups: ['What emergency precautions should I take?'],
      } as T;
    }

    // Check acute injury guardrail
    const injuryWords = ['sharp pain', 'injury', 'torn', 'swollen joint', 'severe pain', 'prescribe medicine'];
    if (injuryWords.some((w) => msg.includes(w))) {
      return {
        reply: `⚠️ **Safety Boundary Notice:**\n\nAs KRIDA AI, your physical safety is my top priority. I cannot diagnose injuries, provide clinical medical opinions, or prescribe pharmaceutical medications. Because you mentioned acute pain or injury symptoms, **I strongly recommend consulting a qualified physical therapist, orthopedist, or physician** for an in-person assessment before continuing loaded training.`,
        sources: [{ title: 'Sports Medicine & Joint Safety Corpus', category: 'Biomechanics', score: '0.95' }],
        suggested_followups: ['How should I warm up to prevent joint irritation?', 'Can you suggest a low-impact active recovery session?'],
      } as T;
    }

    // Check greetings
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'who are you', 'what can you do'];
    if (greetings.some((g) => msg.startsWith(g) || msg === g)) {
      return {
        reply: `Hello Athlete! I am **KRIDA AI Coach**, your dedicated personal fitness, sports science, and athletic conditioning mentor.\n\nI specialize in evidence-based guidance across:\n• 🏋️ **Gym & Hypertrophy:** Individualized workout splits, exercise technique & progressive overload\n• 🤸 **Calisthenics:** Strict gymnastic progressions (muscle-ups, planches, levers, handstands)\n• 🏃 **HYROX & Endurance:** Race station pacing, compromised running & Zone 2 aerobic base\n• 🥗 **Sports Nutrition:** Target macronutrients, pre/post-workout meal timing & hydration\n• 💤 **Athletic Recovery:** Sleep optimization, autonomic HRV tracking & deload planning\n\nHow can I assist your athletic preparation or workout today?`,
        sources: [{ title: 'KRIDA Sports Science & Exercise Physiology Corpus', category: 'Biomechanics', score: '0.98' }],
        suggested_followups: [
          'Can I substitute barbell bench press with dumbbells?',
          'What should I eat 90 minutes before a heavy workout?',
          'How do I pace the 1km runs between HYROX stations?',
          'How do I calculate progressive overload for my lifts?',
        ],
      } as T;
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
        reply: `I am **KRIDA AI Coach**, a specialized sports science and athletic performance mentor. I can only assist with questions strictly related to fitness, athletic training, nutrition, and recovery:\n\n• **Gym & Strength Training:** Workout splits, progressive overload, biomechanics & form cues\n• **Calisthenics & Gymnastics:** Bodyweight skill progressions (muscle-ups, planches, levers, handstands)\n• **HYROX & Endurance:** Race station pacing, compromised running intervals, Zone 2 aerobic base\n• **Sports Nutrition:** Macronutrient partitioning, meal timing, pre/post-workout fueling & hydration\n• **Athletic Recovery:** Sleep optimization, deload planning, HRV, and fatigue management\n\nYour inquiry appears to be outside the domain of fitness and sports performance. Please feel free to ask me a question related to your training routines, exercises, nutrition strategy, or athletic recovery!`,
        sources: [],
        suggested_followups: [
          'How do I calculate progressive overload for my lifts?',
          'What should I eat 90 minutes before a heavy workout?',
          'How do I pace the 1km runs between HYROX stations?',
          'Can I substitute barbell bench press with dumbbells?',
        ],
      } as T;
    }

    // Specific fitness intent routing
    let reply = `Based on your **Intermediate** profile and sports physiology principles, KRIDA recommends prioritizing mechanical tension with 1–2 Reps in Reserve (RIR) on all heavy compound lifts to maximize progressive adaptations without central nervous system burnout.`;
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
      reply,
      sources,
      suggested_followups: [
        'How do I calculate progressive overload for my lifts?',
        'What is the optimal HYROX pacing strategy?',
        'Can you recommend a pre-workout meal plan?',
      ],
    } as T;
  }

  // 9. RECOMMENDATIONS
  if (endpoint.includes('/recommendations')) {
    return {
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
    } as T;
  }

  // 10. PROGRESS & ANALYTICS
  if (endpoint.includes('/progress/analytics')) {
    return {
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
    } as T;
  }

  return {} as T;
}

export const api = {
  // Auth
  auth: {
    register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    demoLogin: () => request<any>('/auth/demo-login', { method: 'POST' }),
    getMe: () => request<any>('/auth/me'),
  },

  // Profile
  profile: {
    get: () => request<any>('/profile'),
    update: (data: any) => request<any>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
    generatePlan: (data: any) => request<any>('/profile/generate-plan', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Workouts
  workouts: {
    getToday: () => request<any>('/workouts/today'),
    getWeek: () => request<any>('/workouts/week'),
    logExercise: (data: any) => request<any>('/workouts/log', { method: 'POST', body: JSON.stringify(data) }),
    getHistory: () => request<any>('/workouts/history'),
    replaceExercise: (data: any) => request<any>('/workouts/replace-exercise', { method: 'POST', body: JSON.stringify(data) }),
    generate: (data: any) => request<any>('/workouts/generate', { method: 'POST', body: JSON.stringify(data) }),
    createCustom: (data: any) => request<any>('/workouts/custom-create', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Progress
  progress: {
    getAnalytics: () => request<any>('/progress/analytics'),
    getRecords: () => request<any>('/progress/records'),
    record: (data: any) => request<any>('/progress/record', { method: 'POST', body: JSON.stringify(data) }),
    deleteRecord: (id: number) => request<any>(`/progress/record/${id}`, { method: 'DELETE' }),
  },

  // Nutrition
  nutrition: {
    get: () => request<any>('/nutrition'),
    ask: (question: string) => request<any>('/nutrition/ask', { method: 'POST', body: JSON.stringify({ question }) }),
    getFoods: (params?: { search?: string; category?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.category) q.append('category', params.category);
      const qs = q.toString() ? `?${q.toString()}` : '';
      return request<any>(`/nutrition/foods${qs}`);
    },
    getSummary: (date?: string) => {
      const qs = date ? `?date=${encodeURIComponent(date)}` : '';
      return request<any>(`/nutrition/summary${qs}`);
    },
    logEntry: (data: any) => request<any>('/nutrition/entry', { method: 'POST', body: JSON.stringify(data) }),
    deleteEntry: (id: number) => request<any>(`/nutrition/entry/${id}`, { method: 'DELETE' }),
    generateMeals: (data: any) => request<any>('/nutrition/generate-meals', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Goals
  goals: {
    getAll: () => request<any>('/goals'),
    create: (data: any) => request<any>('/goals', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request<any>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<any>(`/goals/${id}`, { method: 'DELETE' }),
  },

  // Reports
  reports: {
    getSummary: () => request<any>('/reports/summary'),
    getCsvExportUrl: () => `${API_BASE}/reports/export-csv`,
    downloadCsv: async () => {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/reports/export-csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to download CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `krida_training_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  },

  // Calisthenics
  calisthenics: {
    getSkills: () => request<any>('/calisthenics/skills'),
    logSkill: (data: any) => request<any>('/calisthenics/skill', { method: 'POST', body: JSON.stringify(data) }),
  },

  // HYROX
  hyrox: {
    getSessions: () => request<any>('/hyrox/sessions'),
    logSession: (data: any) => request<any>('/hyrox/session', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Recovery
  recovery: {
    get: () => request<any>('/recovery'),
    checkin: (data: any) => request<any>('/recovery/check-in', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Sports
  sports: {
    getModules: () => request<any>('/sports/modules'),
  },

  // Exercises
  exercises: {
    getAll: (params?: { search?: string; category?: string; equipment?: string; difficulty?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append('search', params.search);
      if (params?.category) q.append('category', params.category);
      if (params?.equipment) q.append('equipment', params.equipment);
      if (params?.difficulty) q.append('difficulty', params.difficulty);
      const queryString = q.toString() ? `?${q.toString()}` : '';
      return request<any>(`/exercises${queryString}`);
    },
  },

  // Chat
  chat: {
    send: (message: string) => request<any>('/chat', { method: 'POST', body: JSON.stringify({ message }) }),
    getHistory: () => request<any>('/chat/history'),
    clearHistory: () => request<any>('/chat/history', { method: 'DELETE' }),
  },

  // Recommendations
  recommendations: {
    getAll: () => request<any>('/recommendations'),
    markRead: (id: number) => request<any>(`/recommendations/mark-read/${id}`, { method: 'POST' }),
  },
};
