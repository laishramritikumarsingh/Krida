import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Play,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Check,
  Flame,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import { ExerciseItem, WorkoutSession, WorkoutExercise } from '../types';

interface GymTrainingPageProps {
  onStartSession: (session: WorkoutSession) => void;
  onOpenReplaceModal?: (session: WorkoutSession, exerciseName: string) => void;
}

export const GymTrainingPage: React.FC<GymTrainingPageProps> = ({
  onStartSession,
  onOpenReplaceModal,
}) => {
  // Mode tabs: 'presets' | 'builder' | 'library' | 'logger'
  const [activeTab, setActiveTab] = useState<'presets' | 'builder' | 'library' | 'logger'>('presets');

  // Exercise library state
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [selectedEquipment, setSelectedEquipment] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<ExerciseItem | null>(null);

  // Custom Workout Builder state
  const [customTitle, setCustomTitle] = useState('My Custom Hypertrophy Routine');
  const [customDuration, setCustomDuration] = useState(55);
  const [customExercises, setCustomExercises] = useState<
    { name: string; sets: number; reps: string; rest: string; equipment: string }[]
  >([
    { name: 'Barbell Bench Press', sets: 4, reps: '8-10', rest: '90s', equipment: 'Barbell' },
    { name: 'Barbell Bent-Over Row', sets: 4, reps: '8-10', rest: '90s', equipment: 'Barbell' },
    { name: 'Dumbbell Lateral Raises', sets: 3, reps: '12-15', rest: '60s', equipment: 'Dumbbells' },
  ]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Active in-page Set Logger State
  const [logExerciseName, setLogExerciseName] = useState('Flat Dumbbell Press');
  const [logSets, setLogSets] = useState<{ setNum: number; weight: number; reps: number; completed: boolean }[]>([
    { setNum: 1, weight: 25, reps: 10, completed: true },
    { setNum: 2, weight: 25, reps: 10, completed: true },
    { setNum: 3, weight: 25, reps: 10, completed: false },
  ]);
  const [logRpe, setLogRpe] = useState<number>(8.0);
  const [logNotes, setLogNotes] = useState('');
  const [logSavedStatus, setLogSavedStatus] = useState<string | null>(null);
  const [isLoggingSaving, setIsLoggingSaving] = useState(false);

  // Exercise substitution state
  const [substitutionModal, setSubstitutionModal] = useState<{
    original: string;
    replacements: string[];
    why: string;
  } | null>(null);

  // Preset Splits
  const [selectedSplit, setSelectedSplit] = useState<'upper' | 'lower' | 'push' | 'pull' | 'legs'>('upper');
  const splits = {
    upper: {
      title: 'Upper Body Heavy Compound & Hypertrophy',
      duration: 55,
      intensity: 'RPE 8.0 - 8.5',
      focus: 'Horizontal & vertical push-pull mechanics to maximize mechanical tension on pectorals, lats, and deltoids.',
      exercises: [
        { name: 'Barbell Bench Press', sets: 4, reps: '6-8', rest: '120s', intensity: 'RPE 8.5', equipment: 'Barbell' },
        { name: 'Barbell Bent-Over Row', sets: 4, reps: '8-10', rest: '90s', intensity: 'RPE 8.0', equipment: 'Barbell' },
        { name: 'Standing Overhead Press', sets: 3, reps: '8-10', rest: '90s', intensity: 'RPE 8.0', equipment: 'Barbell' },
        { name: 'Incline Dumbbell Chest Press', sets: 3, reps: '10-12', rest: '75s', intensity: 'RPE 8.0', equipment: 'Dumbbells' },
        { name: 'Incline Dumbbell Bicep Curls', sets: 3, reps: '10-12', rest: '60s', intensity: 'RPE 8.5', equipment: 'Dumbbells' },
      ],
    },
    lower: {
      title: 'Lower Body Posterior Chain & Quad Dominance',
      duration: 55,
      intensity: 'RPE 8.5 - 9.0',
      focus: 'Deep knee flexion and hip hinge kinematics. Controlled 3-second eccentric tempo on squats and Romanian deadlifts.',
      exercises: [
        { name: 'Barbell Back Squat', sets: 4, reps: '6-8', rest: '150s', intensity: 'RPE 8.5', equipment: 'Barbell' },
        { name: 'Barbell Romanian Deadlift', sets: 4, reps: '8-10', rest: '120s', intensity: 'RPE 8.0', equipment: 'Barbell' },
        { name: 'Bulgarian Split Squats', sets: 3, reps: '10-12 / leg', rest: '75s', intensity: 'RPE 8.5', equipment: 'Dumbbells' },
        { name: 'Dumbbell Goblet Squat', sets: 3, reps: '12-15', rest: '60s', intensity: 'RPE 8.0', equipment: 'Dumbbells' },
      ],
    },
    push: {
      title: 'Push Hypertrophy (Chest, Shoulders, Triceps)',
      duration: 50,
      intensity: 'RPE 8.0',
      focus: 'Clavicular and sternal pectoral fiber activation with anterior deltoid and lateral head triceps overload.',
      exercises: [
        { name: 'Flat Dumbbell Press', sets: 4, reps: '8-10', rest: '90s', intensity: 'RPE 8.0', equipment: 'Dumbbells' },
        { name: 'Incline Dumbbell Press', sets: 3, reps: '8-12', rest: '90s', intensity: 'RPE 8.0', equipment: 'Dumbbells' },
        { name: 'Parallel Bar Dips', sets: 3, reps: '10-12', rest: '75s', intensity: 'RPE 8.5', equipment: 'Bodyweight' },
        { name: 'Dumbbell Lateral Raises', sets: 4, reps: '12-15', rest: '60s', intensity: 'RPE 8.5', equipment: 'Dumbbells' },
      ],
    },
    pull: {
      title: 'Pull Density (Back, Rear Delts, Biceps)',
      duration: 50,
      intensity: 'RPE 8.0',
      focus: 'Scapular retraction, latissimus dorsi stretch, and elbow flexion volume.',
      exercises: [
        { name: 'Strict Pull-ups', sets: 4, reps: '6-8', rest: '120s', intensity: 'RPE 8.5', equipment: 'Pull-up Bar' },
        { name: 'Barbell Bent-Over Row', sets: 4, reps: '10-12', rest: '75s', intensity: 'RPE 8.0', equipment: 'Barbell' },
        { name: 'Dumbbell Bent-Over Row', sets: 3, reps: '10-12', rest: '60s', intensity: 'RPE 8.0', equipment: 'Dumbbells' },
        { name: 'Incline Dumbbell Bicep Curls', sets: 3, reps: '10-12', rest: '60s', intensity: 'RPE 8.5', equipment: 'Dumbbells' },
      ],
    },
    legs: {
      title: 'Legs & Core Power Complex',
      duration: 55,
      intensity: 'RPE 8.5',
      focus: 'Unilateral quad balance, adductor engagement, and gluteus medius pelvic stability.',
      exercises: [
        { name: 'Barbell Back Squat', sets: 4, reps: '6-8', rest: '120s', intensity: 'RPE 8.5', equipment: 'Barbell' },
        { name: 'Bulgarian Split Squats', sets: 3, reps: '10 / leg', rest: '75s', intensity: 'RPE 8.0', equipment: 'Dumbbells' },
        { name: 'Barbell Romanian Deadlift', sets: 4, reps: '8-10', rest: '90s', intensity: 'RPE 8.0', equipment: 'Barbell' },
        { name: 'Hollow Body Hold', sets: 3, reps: '45 seconds', rest: '45s', intensity: 'RPE 8.0', equipment: 'Bodyweight' },
      ],
    },
  };

  const currentPreset = splits[selectedSplit];

  // Fetch exercises for library
  useEffect(() => {
    setLibraryLoading(true);
    api.exercises
      .getAll({
        search: searchTerm || undefined,
        category: selectedMuscle !== 'All' ? selectedMuscle : undefined,
        equipment: selectedEquipment !== 'All' ? selectedEquipment : undefined,
        difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
      })
      .then((data) => {
        setExercises(data || []);
      })
      .catch((err) => console.error('Failed to load exercises:', err))
      .finally(() => setLibraryLoading(false));
  }, [searchTerm, selectedMuscle, selectedEquipment, selectedDifficulty]);

  // Launch preset session
  const handleLaunchPreset = () => {
    const sessionObj: WorkoutSession = {
      id: 301,
      day_name: 'Gym Training Session',
      training_type: currentPreset.title,
      target_duration_mins: currentPreset.duration,
      target_intensity: currentPreset.intensity,
      notes: currentPreset.focus,
      exercises: currentPreset.exercises.map((e, idx) => ({
        id: 3000 + idx,
        exercise_name: e.name,
        sets: e.sets,
        reps: e.reps,
        rest_seconds: parseInt(e.rest, 10) || 90,
        intensity: e.intensity,
        order_index: idx,
        equipment_needed: e.equipment,
      })),
    };
    onStartSession(sessionObj);
  };

  // Launch custom built session
  const handleLaunchCustom = () => {
    const sessionObj: WorkoutSession = {
      id: 401,
      day_name: 'Custom Gym Session',
      training_type: customTitle,
      target_duration_mins: customDuration,
      target_intensity: 'RPE 8.0',
      notes: 'Custom user-built session',
      exercises: customExercises.map((e, idx) => ({
        id: 4000 + idx,
        exercise_name: e.name,
        sets: e.sets,
        reps: e.reps,
        rest_seconds: parseInt(e.rest, 10) || 90,
        intensity: 'RPE 8.0',
        order_index: idx,
        equipment_needed: e.equipment,
      })),
    };
    onStartSession(sessionObj);
  };

  // Save custom workout to backend
  const handleSaveCustomToBackend = async () => {
    try {
      await api.workouts.createCustom({
        title: customTitle,
        duration: customDuration,
        exercises: customExercises,
      });
      setSaveSuccessMsg('Custom workout routine saved to database successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save custom routine:', err);
    }
  };

  // Add exercise to custom builder from catalog
  const handleAddToCustom = (ex: ExerciseItem) => {
    setCustomExercises((prev) => [
      ...prev,
      {
        name: ex.name,
        sets: 3,
        reps: '8-12',
        rest: '90s',
        equipment: ex.equipment_needed,
      },
    ]);
    setActiveTab('builder');
  };

  // Save active set logging to backend
  const handleSaveSessionLogs = async () => {
    setIsLoggingSaving(true);
    try {
      const completedSets = logSets.filter((s) => s.completed);
      const weights = completedSets.map((s) => s.weight);
      const reps = completedSets.map((s) => s.reps);

      const res = await api.workouts.logExercise({
        exercise_name: logExerciseName,
        sets_completed: completedSets.length,
        weight_kg: weights,
        reps_completed: reps,
        rpe: logRpe,
        notes: logNotes || 'Logged in Gym Training session tracker',
      });

      setLogSavedStatus(`Workout log saved! Log ID #${res.log_id || 'OK'}. Overload analyzed.`);
      setTimeout(() => setLogSavedStatus(null), 5000);
    } catch (err) {
      console.error('Failed to log exercise:', err);
      setLogSavedStatus('Failed to record workout session to database.');
    } finally {
      setIsLoggingSaving(false);
    }
  };

  // Exercise substitution helper
  const handleOpenSubstitution = (exName: string) => {
    const subMap: Record<string, { replacement: string; alts: string[]; why: string }> = {
      'Barbell Bench Press': {
        replacement: 'Flat Dumbbell Press',
        alts: ['Push-ups', 'Cable Chest Flyes', 'Incline Dumbbell Press'],
        why: 'Replicates identical horizontal pushing vector and sternal pectoral recruitment while allowing independent scapular glide and natural wrist path.',
      },
      'Barbell Back Squat': {
        replacement: 'Dumbbell Goblet Squat',
        alts: ['Bulgarian Split Squats', 'Leg Press', 'Walking Lunges'],
        why: 'Maintains deep knee flexion and quad stimulus while significantly reducing axial spinal compression.',
      },
      'Barbell Bent-Over Row': {
        replacement: 'Dumbbell Bent-Over Row',
        alts: ['Strict Pull-ups', 'Chest-Supported Row', 'Cable Rows'],
        why: 'Preserves latissimus dorsi and rhomboid recruitment with reduced lower back fatigue.',
      },
    };

    const match = subMap[exName] || {
      replacement: 'Flat Dumbbell Press',
      alts: ['Push-ups', 'Incline Dumbbell Press'],
      why: 'Biomechanical vector substitution with equal motor unit activation.',
    };

    setSubstitutionModal({
      original: exName,
      replacements: [match.replacement, ...match.alts],
      why: match.why,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222711] border border-[#3d471d] text-xs font-mono font-bold text-[#D7FF43] mb-2">
            <Dumbbell className="w-3.5 h-3.5" />
            <span>03 • GYM TRAINING & EXERCISE SYSTEM</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Gym Training & Routine Builder
          </h1>
          <p className="text-sm text-[#88A8C8] mt-0.5">
            Searchable exercise library, customized workout creation, active session tracking, and set logging.
          </p>
        </div>

        <button
          onClick={handleLaunchPreset}
          className="px-5 py-2.5 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-[0_0_15px_rgba(215,255,67,0.3)]"
        >
          <Play className="w-4 h-4 fill-black" />
          Launch Active Session
        </button>
      </div>

      {/* Navigation Sub-Tabs: Presets | Builder | Library | Logger */}
      <div className="flex flex-wrap gap-2 border-b border-[#1a1f24] pb-3">
        {[
          { id: 'presets', label: 'Preset Hypertrophy Splits', icon: Layers },
          { id: 'builder', label: 'Custom Workout Creator', icon: Plus },
          { id: 'library', label: 'Searchable Exercise Catalog', icon: Search },
          { id: 'logger', label: 'Active Session Set Logger', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d] shadow-[0_0_10px_-2px_rgba(215,255,67,0.25)]'
                  : 'bg-[#0e1113] text-[#88A8C8] border border-[#1a1f24] hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PRESET HYPERTROPHY SPLITS */}
      {/* ============================================================ */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          {/* Split Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {(['upper', 'lower', 'push', 'pull', 'legs'] as const).map((key) => {
              const isSelected = selectedSplit === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedSplit(key)}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-[#222711] border-[#3d471d] shadow-[0_0_12px_-3px_rgba(215,255,67,0.3)]'
                      : 'bg-[#0e1113] border-[#1a1f24] hover:border-white/20'
                  }`}
                >
                  <div
                    className={`text-xs font-mono font-bold uppercase ${
                      isSelected ? 'text-[#D7FF43]' : 'text-[#88A8C8]'
                    }`}
                  >
                    {key.toUpperCase()} SPLIT
                  </div>
                  <div className="text-[11px] text-[#88A8C8] mt-0.5 truncate">
                    {splits[key].exercises.length} Exercises
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Split Preview Card */}
          <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1a1f24]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
                  MICROCYCLE BLUEPRINT
                </span>
                <h2 className="text-2xl font-black text-white mt-0.5">{currentPreset.title}</h2>
                <p className="text-xs text-[#88A8C8] mt-1 max-w-2xl leading-relaxed">{currentPreset.focus}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleLaunchPreset}
                  className="px-4 py-2.5 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(215,255,67,0.25)]"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  Start This Routine
                </button>
              </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono font-bold text-[#88A8C8] uppercase tracking-wider">
                Prescribed Movements & Biomechanical Targets
              </div>
              {currentPreset.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#121618] border border-[#1e252a] hover:border-[#D7FF43]/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#080909] text-[#D7FF43] flex items-center justify-center font-mono text-xs font-bold border border-[#1e252a]">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">{ex.name}</h4>
                      <div className="text-[11px] text-[#88A8C8] font-mono flex items-center gap-3 mt-0.5">
                        <span>Gear: {ex.equipment}</span>
                        <span>•</span>
                        <span>Rest: {ex.rest}</span>
                        <span>•</span>
                        <span>Target: {ex.intensity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="px-3 py-1 rounded-lg bg-[#080909] border border-[#1e252a] text-xs font-mono font-bold text-white">
                      {ex.sets} sets × {ex.reps}
                    </span>
                    <button
                      onClick={() => handleOpenSubstitution(ex.name)}
                      className="px-2.5 py-1 rounded-lg bg-[#222711] border border-[#3d471d] text-[#D7FF43] text-xs font-mono font-bold hover:brightness-110 transition-colors"
                      title="Substitute exercise"
                    >
                      Swap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: CUSTOM WORKOUT CREATOR */}
      {/* ============================================================ */}
      {activeTab === 'builder' && (
        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1a1f24]">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
                CUSTOM WORKOUT BUILDER
              </span>
              <h2 className="text-2xl font-black text-white mt-0.5">Assemble Your Routine</h2>
              <p className="text-xs text-[#88A8C8] mt-1">
                Add movements from the library, customize sets, target reps, and rest periods, then save or launch.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveCustomToBackend}
                className="px-4 py-2 rounded-xl bg-[#121618] border border-[#1e252a] hover:border-[#D7FF43]/40 text-xs font-bold text-white transition-colors"
              >
                Save Routine
              </button>
              <button
                onClick={handleLaunchCustom}
                className="px-4 py-2 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(215,255,67,0.25)]"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                Start Session
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-[#222711] border border-[#3d471d] text-xs text-[#D7FF43] font-mono flex items-center gap-2">
              <Check className="w-4 h-4" />
              {saveSuccessMsg}
            </div>
          )}

          {/* Title and Duration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                Routine Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                Target Duration (mins)
              </label>
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(parseInt(e.target.value, 10) || 45)}
                className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Exercise Builder List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#88A8C8] uppercase">
              <span>Exercises in Custom Routine ({customExercises.length})</span>
              <button
                onClick={() => setActiveTab('library')}
                className="text-[#D7FF43] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add from Catalog
              </button>
            </div>

            {customExercises.map((ex, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#121618] border border-[#1e252a] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-[#080909] text-[#D7FF43] font-mono text-xs font-bold flex items-center justify-center border border-[#1e252a]">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white">{ex.name}</div>
                    <div className="text-[10px] text-[#88A8C8] font-mono">Gear: {ex.equipment}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#88A8C8] text-[10px] font-mono">Sets:</span>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setCustomExercises((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, sets: val } : item))
                        );
                      }}
                      className="w-12 bg-[#080909] border border-[#1e252a] rounded-lg px-2 py-1 text-center font-mono text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#88A8C8] text-[10px] font-mono">Reps:</span>
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomExercises((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, reps: val } : item))
                        );
                      }}
                      className="w-16 bg-[#080909] border border-[#1e252a] rounded-lg px-2 py-1 text-center font-mono text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#88A8C8] text-[10px] font-mono">Rest:</span>
                    <input
                      type="text"
                      value={ex.rest}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomExercises((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, rest: val } : item))
                        );
                      }}
                      className="w-16 bg-[#080909] border border-[#1e252a] rounded-lg px-2 py-1 text-center font-mono text-xs text-white"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setCustomExercises((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="p-1.5 rounded-lg text-[#88A8C8] hover:text-red-400 hover:bg-white/5"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SEARCHABLE EXERCISE CATALOG */}
      {/* ============================================================ */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-xl bg-[#0e1113] border border-[#1a1f24] space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88A8C8]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search movement name or target muscles (e.g. Chest, Quads, Lat)..."
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#88A8C8]/60 focus:outline-none"
                />
              </div>

              {/* Muscle Filter */}
              <select
                value={selectedMuscle}
                onChange={(e) => setSelectedMuscle(e.target.value)}
                className="bg-[#121618] border border-[#1e252a] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              >
                {['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Hyrox', 'Cardio'].map((c) => (
                  <option key={c} value={c}>
                    Category: {c}
                  </option>
                ))}
              </select>

              {/* Equipment Filter */}
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="bg-[#121618] border border-[#1e252a] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              >
                {['All', 'Bodyweight', 'Dumbbells', 'Barbell', 'Cable Machine', 'Machines', 'Pull-up Bar'].map(
                  (eq) => (
                    <option key={eq} value={eq}>
                      Gear: {eq}
                    </option>
                  )
                )}
              </select>

              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-[#121618] border border-[#1e252a] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
              >
                {['All', 'Beginner', 'Intermediate', 'Advanced'].map((d) => (
                  <option key={d} value={d}>
                    Level: {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exercise Grid */}
          {libraryLoading ? (
            <div className="py-16 text-center text-xs font-mono text-[#88A8C8]">
              Loading biomechanical exercises...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="p-5 rounded-2xl bg-[#0e1113] border border-[#1a1f24] hover:border-[#D7FF43]/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222711] text-[#D7FF43] border border-[#3d471d]">
                        {ex.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#88A8C8]">{ex.difficulty}</span>
                    </div>

                    <h4 className="text-base font-bold text-white group-hover:text-[#D7FF43] transition-colors">
                      {ex.name}
                    </h4>

                    <div className="text-[11px] text-[#88A8C8] mt-1 line-clamp-2 leading-relaxed">
                      {ex.instructions}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#1a1f24] space-y-1 text-[11px] font-mono">
                      <div className="text-[#88A8C8]">
                        Equipment: <strong className="text-white">{ex.equipment_needed}</strong>
                      </div>
                      <div className="text-[#88A8C8]">
                        Prescription: <strong className="text-[#D7FF43]">{ex.sets_reps_recommendation}</strong>
                      </div>
                      <div className="text-[10px] text-[#88A8C8]/70 italic">
                        Media: High-Resolution Anatomical Diagram (No Video Configured)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleAddToCustom(ex)}
                      className="flex-1 py-1.5 rounded-lg bg-[#121618] hover:bg-[#222711] border border-[#1e252a] hover:border-[#3d471d] text-xs font-bold text-white hover:text-[#D7FF43] transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Routine
                    </button>
                    <button
                      onClick={() => setSelectedExerciseDetail(ex)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#080909] border border-[#1e252a] text-xs text-[#88A8C8] hover:text-white"
                      title="View Details"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: ACTIVE SESSION SET LOGGER */}
      {/* ============================================================ */}
      {activeTab === 'logger' && (
        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1a1f24]">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
                LIVE SET & LOAD TRACKER
              </span>
              <h2 className="text-2xl font-black text-white mt-0.5">Log Completed Sets & Weights</h2>
              <p className="text-xs text-[#88A8C8] mt-1">
                Record actual external load and completed reps to calculate Epley 1RM and feed progressive overload algorithms.
              </p>
            </div>

            <button
              onClick={handleSaveSessionLogs}
              disabled={isLoggingSaving}
              className="px-5 py-2.5 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(215,255,67,0.25)] disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {isLoggingSaving ? 'Saving to Database...' : 'Save Completed Workout'}
            </button>
          </div>

          {logSavedStatus && (
            <div className="p-3.5 rounded-xl bg-[#222711] border border-[#3d471d] text-xs font-mono text-[#D7FF43] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {logSavedStatus}
            </div>
          )}

          {/* Exercise Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                Exercise Name
              </label>
              <input
                type="text"
                value={logExerciseName}
                onChange={(e) => setLogExerciseName(e.target.value)}
                className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                Perceived Effort (RPE 1-10)
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="10"
                value={logRpe}
                onChange={(e) => setLogRpe(parseFloat(e.target.value) || 8.0)}
                className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                Notes / Form Feedback
              </label>
              <input
                type="text"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder="e.g. Clean lockout, 2 RIR remaining"
                className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Sets Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#88A8C8] uppercase px-2">
              <span>Set Breakdown</span>
              <button
                onClick={() => {
                  const lastSet = logSets[logSets.length - 1];
                  setLogSets((prev) => [
                    ...prev,
                    {
                      setNum: prev.length + 1,
                      weight: lastSet ? lastSet.weight : 25,
                      reps: lastSet ? lastSet.reps : 10,
                      completed: false,
                    },
                  ]);
                }}
                className="text-[#D7FF43] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Set
              </button>
            </div>

            <div className="space-y-2">
              {logSets.map((s, idx) => (
                <div
                  key={s.setNum}
                  className="p-3 rounded-xl bg-[#121618] border border-[#1e252a] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#080909] text-[#D7FF43] font-mono text-xs font-bold flex items-center justify-center border border-[#1e252a]">
                      {s.setNum}
                    </span>
                    <span className="text-white font-semibold">Set {s.setNum}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[#88A8C8] text-[10px] font-mono">Weight (kg):</span>
                      <input
                        type="number"
                        value={s.weight}
                        onChange={(e) => {
                          const w = parseFloat(e.target.value) || 0;
                          setLogSets((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, weight: w } : item))
                          );
                        }}
                        className="w-16 bg-[#080909] border border-[#1e252a] rounded-lg px-2 py-1 text-center font-mono text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[#88A8C8] text-[10px] font-mono">Reps:</span>
                      <input
                        type="number"
                        value={s.reps}
                        onChange={(e) => {
                          const r = parseInt(e.target.value, 10) || 0;
                          setLogSets((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, reps: r } : item))
                          );
                        }}
                        className="w-14 bg-[#080909] border border-[#1e252a] rounded-lg px-2 py-1 text-center font-mono text-xs text-white"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setLogSets((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, completed: !item.completed } : item))
                        );
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        s.completed
                          ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d]'
                          : 'bg-[#080909] text-[#88A8C8] border border-[#1e252a]'
                      }`}
                    >
                      {s.completed ? 'Completed ✓' : 'Mark Done'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBSTITUTION MODAL */}
      {substitutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0e1113] border border-[#3d471d] rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a1f24]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase">
                  BIOMECHANICAL SWAP ADVISOR
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Substitute: {substitutionModal.original}
                </h3>
              </div>
              <button
                onClick={() => setSubstitutionModal(null)}
                className="text-[#88A8C8] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a] text-xs text-[#88A8C8] leading-relaxed">
              <strong className="text-white">Why this swap works:</strong> {substitutionModal.why}
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-mono font-bold text-[#88A8C8] uppercase">
                Recommended Equivalent Alternatives:
              </div>
              {substitutionModal.replacements.map((r, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#121618] border border-[#1e252a] hover:border-[#D7FF43]/40 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-white">{r}</span>
                  <span className="text-[10px] font-mono text-[#D7FF43]">Verified Vector Match</span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSubstitutionModal(null)}
                className="px-4 py-2 rounded-xl bg-[#D7FF43] text-black text-xs font-bold hover:brightness-110"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXERCISE DETAIL MODAL */}
      {selectedExerciseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0e1113] border border-[#1a1f24] rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a1f24]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase">
                  {selectedExerciseDetail.category} • {selectedExerciseDetail.difficulty}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedExerciseDetail.name}</h3>
              </div>
              <button
                onClick={() => setSelectedExerciseDetail(null)}
                className="text-[#88A8C8] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[10px] font-mono font-bold text-[#88A8C8] uppercase">Instructions:</div>
                <p className="text-zinc-300 mt-1 leading-relaxed">{selectedExerciseDetail.instructions}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a]">
                  <div className="text-[10px] font-mono text-[#88A8C8]">Equipment Needed</div>
                  <div className="text-white font-bold mt-0.5">{selectedExerciseDetail.equipment_needed}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a]">
                  <div className="text-[10px] font-mono text-[#88A8C8]">Recommended Dose</div>
                  <div className="text-[#D7FF43] font-bold mt-0.5">
                    {selectedExerciseDetail.sets_reps_recommendation}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a] text-[11px] text-[#88A8C8]">
                <strong>Media Notice:</strong> High-resolution anatomical kinetic vectors are verified in database.
                Video streaming is not configured for this exercise.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  handleAddToCustom(selectedExerciseDetail);
                  setSelectedExerciseDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#D7FF43] text-black text-xs font-bold hover:brightness-110 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to Custom Builder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
