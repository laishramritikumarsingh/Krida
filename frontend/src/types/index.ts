export interface User {
  id: number;
  email: string;
  username: string;
  is_demo: boolean;
  has_plan?: boolean;
}

export interface Profile {
  id: number;
  user_id: number;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  fitness_level: string;
  primary_goal: string;
  training_experience: string;
  training_frequency: number;
  available_equipment: string[];
  training_preference: string;
  dietary_preference: string;
  sports_interests: string[];
  schedule_days: string[];
  updated_at?: string;
}

export interface WorkoutExercise {
  id: number;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  intensity: string;
  order_index: number;
  equipment_needed?: string;
}

export interface WorkoutSession {
  id: number;
  day_name: string;
  training_type: string;
  target_duration_mins: number;
  target_intensity: string;
  notes?: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: number;
  name: string;
  goal: string;
  split_name: string;
}

export interface WorkoutLogItem {
  id: number;
  exercise_name: string;
  sets_completed: number;
  reps_completed: number[];
  weight_kg: number[];
  notes?: string;
  rpe: number;
  completed_at: string;
}

export interface MealItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string;
}

export interface NutritionPlan {
  id: number;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_liters: number;
  meal_breakdown: Record<string, MealItem>;
  pre_workout: string;
  post_workout: string;
  disclaimer: string;
}

export interface ProgressRecordItem {
  id: number;
  recorded_at: string;
  date: string;
  weight_kg: number;
  estimated_1rm: Record<string, number>;
  running_5k_mins?: number;
  notes?: string;
}

export interface ProgressAnalytics {
  weight_history: { date: string; weight: number }[];
  strength_history: { date: string; bench: number; squat: number; deadlift: number }[];
  volume_history: { date: string; volume: number }[];
  consistency_rate: number;
  total_workouts_completed: number;
  personal_records: {
    bench_press_1rm: number;
    squat_1rm: number;
    deadlift_1rm: number;
    running_5k_mins: string;
  };
}

export interface RecoveryStatus {
  recovery_score: number;
  fatigue_level: number;
  sleep_hours: number;
  strain_score: number;
  status_text: string;
  recommendation: string;
  readiness_level: string;
}

export interface SportsStation {
  station: string;
  target: string;
  focus: string;
}

export interface SportsBlock {
  name: string;
  detail: string;
}

export interface SportsModule {
  title: string;
  badge: string;
  description: string;
  stations: SportsStation[];
  training_blocks: SportsBlock[];
}

export interface ExerciseItem {
  id: number;
  name: string;
  category: string;
  target_muscles: string[];
  equipment_needed: string;
  difficulty: string;
  movement_type: string;
  instructions: string;
  sets_reps_recommendation: string;
}

export interface RecommendationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  why_explanation: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources: { title: string; category: string; score: string }[];
  created_at: string;
}

export interface FitnessGoal {
  id: number;
  user_id: number;
  category: 'strength' | 'endurance' | 'physique' | 'skill' | 'consistency';
  title: string;
  current_value: number;
  target_value: number;
  unit: string;
  deadline: string;
  status: 'in_progress' | 'achieved';
  notes?: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: number;
  name: string;
  category: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_indian_staple: boolean;
  provenance: string;
  allergens: string;
}

export interface NutritionEntry {
  id: number;
  user_id: number;
  food_item_id?: number;
  food_name: string;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  quantity_servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_date: string;
  created_at: string;
}

export interface DailyNutritionSummary {
  logged_date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  entries: NutritionEntry[];
  disclaimer: string;
}

export interface SkillProgress {
  id: number;
  user_id: number;
  skill_name: string;
  progression_level: string;
  level_number: number;
  hold_duration_sec: number;
  repetitions: number;
  milestone_status: 'In Training' | 'Mastered';
  notes?: string;
  updated_at: string;
}

export interface ConditioningSession {
  id: number;
  user_id: number;
  session_type: string;
  title: string;
  distance_meters: number;
  duration_seconds: number;
  rounds_completed: number;
  rest_seconds: number;
  stations_data_json: string;
  notes?: string;
  completed_at: string;
}

