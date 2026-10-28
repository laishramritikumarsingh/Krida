import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Dumbbell,
  Clock,
  Zap,
  RefreshCw,
  Play,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Flame,
  History,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Check,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { WorkoutPlan, WorkoutSession, WorkoutExercise } from '../types';

interface WorkoutPageProps {
  onStartSession: (session: WorkoutSession) => void;
  onReplaceExercise: (session: WorkoutSession, exerciseName: string) => void;
  onOpenOnboarding?: () => void;
}

export const WorkoutPage: React.FC<WorkoutPageProps> = ({
  onStartSession,
  onReplaceExercise,
  onOpenOnboarding,
}) => {
  const { user, isAuthenticated, isLoading: authLoading, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'schedule' | 'generator' | 'history'>('schedule');
  const [scheduleData, setScheduleData] = useState<{
    plan: WorkoutPlan | null;
    sessions: WorkoutSession[];
  } | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);

  // Generator Form State
  const [genAge, setGenAge] = useState<number>(27);
  const [genExperience, setGenExperience] = useState<string>('1–3 years');
  const [genGoal, setGenGoal] = useState<string>('Hypertrophy & Strength');
  const [genTrainingType, setGenTrainingType] = useState<string>('Hybrid Gym & Conditioning');
  const [genDaysPerWeek, setGenDaysPerWeek] = useState<number>(4);
  const [genDurationMins, setGenDurationMins] = useState<number>(60);
  const [genEquipment, setGenEquipment] = useState<string[]>([
    'Dumbbells',
    'Barbell',
    'Bench',
    'Pull-up Bar',
  ]);
  const [genInjuries, setGenInjuries] = useState<string>('None');
  const [genPreferences, setGenPreferences] = useState<string>(
    'Focus on compound double-progression movements'
  );
  const [genRecovery, setGenRecovery] = useState<string>('Good (7-8 hours sleep)');

  // Generation response state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const [res, historyRes] = await Promise.all([
        api.workouts.getWeek(),
        api.workouts.getHistory().catch(() => ({ logs: [] })),
      ]);
      setScheduleData(res);
      // Select current day index by default
      const currentDayIdx = new Date().getDay(); // 0 is Sunday
      const mappedIdx = currentDayIdx === 0 ? 6 : currentDayIdx - 1; // 0 is Monday
      if (res?.sessions && res.sessions.length > mappedIdx) {
        setSelectedDayIndex(mappedIdx);
      }
      setWorkoutLogs(historyRes.logs || []);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      fetchSchedule();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerateError(null);
    try {
      if (!isAuthenticated) {
        await demoLogin();
      }

      const payload = {
        age: genAge,
        fitness_experience: genExperience,
        goals: genGoal,
        training_type: genTrainingType,
        days_per_week: genDaysPerWeek,
        session_duration_mins: genDurationMins,
        available_equipment: genEquipment.length > 0 ? genEquipment : ['Dumbbells', 'Barbell', 'Bench'],
        injuries_limitations: genInjuries || 'None',
        preferences: genPreferences || 'Focus on compound movements',
        recovery_capacity: genRecovery,
      };

      const res = await api.workouts.generate(payload);
      setGeneratedResult(res);
      // Refresh current schedule from server
      await fetchSchedule();
      // Switch back to 7-day schedule view to display the newly generated split
      setActiveTab('schedule');
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setGenerateError(err?.message || 'Failed to generate plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleEquipment = (eq: string) => {
    setGenEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#D7FF43] border-t-transparent animate-spin" />
        <div className="text-xs font-mono font-bold text-[#88A8C8] uppercase tracking-wider">
          Retrieving Periodized Microcycle Splits...
        </div>
      </div>
    );
  }

  const sessions = scheduleData?.sessions || [];
  const selectedSession = sessions[selectedDayIndex] || sessions[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222711] border border-[#3d471d] text-xs font-mono font-bold text-[#D7FF43] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>06 • GENERATIVE AI WORKOUT PROTOCOLS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            AI Workout Plan Generator
          </h1>
          <p className="text-sm text-[#88A8C8] mt-0.5">
            Goal: <strong className="text-white">{scheduleData?.plan?.goal || 'General Fitness'}</strong> • Split: <strong className="text-[#D7FF43]">{scheduleData?.plan?.split_name || 'Adaptive Microcycle'}</strong>
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex gap-2 p-1 rounded-xl bg-[#0e1113] border border-[#1a1f24] self-start sm:self-auto">
          {[
            { id: 'schedule', label: '7-Day Microcycle Split', icon: Calendar },
            { id: 'generator', label: 'Generate / Recalibrate', icon: Sparkles },
            { id: 'history', label: 'Workout History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d]'
                    : 'text-[#88A8C8] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: 7-DAY MICROCYCLE SPLIT */}
      {/* ============================================================ */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl bg-[#0e1113] border border-[#3d471d] text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#222711] border border-[#3d471d] flex items-center justify-center text-[#D7FF43]">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">No Active Workout Plan Found</h3>
                <p className="text-xs text-[#88A8C8] max-w-md mx-auto mt-1 leading-relaxed">
                  You haven't generated an individualized microcycle split yet. Customize your equipment, frequency, and goals to build your scientific training plan.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('generator')}
                  className="px-6 py-2.5 rounded-xl bg-[#D7FF43] text-black text-xs font-extrabold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(215,255,67,0.25)] flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Plan with AI
                </button>
                {onOpenOnboarding && (
                  <button
                    onClick={onOpenOnboarding}
                    className="px-5 py-2.5 rounded-xl border border-white/20 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Launch 10-Step Wizard
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Day Selector Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
            {sessions.map((sess, idx) => {
              const isSelected = selectedDayIndex === idx;
              const isRest = sess.training_type.toLowerCase().includes('recovery') || sess.training_type.toLowerCase().includes('rest');
              return (
                <button
                  key={sess.id || idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#222711] border-[#3d471d] shadow-[0_0_12px_-3px_rgba(215,255,67,0.3)]'
                      : 'bg-[#0e1113] border-[#1a1f24] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#88A8C8] uppercase">
                      {sess.day_name.slice(0, 3)}
                    </span>
                    {isRest ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#88A8C8]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
                    )}
                  </div>
                  <div
                    className={`text-xs font-bold mt-1 truncate ${
                      isSelected ? 'text-[#D7FF43]' : 'text-white'
                    }`}
                  >
                    {sess.training_type.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Session Detail Card */}
          {selectedSession && (
            <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1a1f24]">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
                    {selectedSession.day_name} • MICROCYCLE DAY {selectedDayIndex + 1}
                  </span>
                  <h2 className="text-2xl font-black text-white mt-0.5">{selectedSession.training_type}</h2>
                  <div className="flex items-center gap-4 text-xs font-mono text-[#88A8C8] mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D7FF43]" />
                      {selectedSession.target_duration_mins} mins
                    </span>
                    <span>•</span>
                    <span>Target: <strong>{selectedSession.target_intensity}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartSession(selectedSession)}
                    className="px-5 py-2.5 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(215,255,67,0.25)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    Launch Session
                  </button>
                </div>
              </div>

              {/* Warm-Up Protocol */}
              <div className="p-4 rounded-xl bg-[#121618] border border-[#1e252a] space-y-2">
                <div className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Ramping Warm-Up & Neural Priming Protocol (8-10 Mins)
                </div>
                <ul className="text-xs text-[#88A8C8] space-y-1 font-mono">
                  <li>• 5 mins light aerobic general elevation (bike, row, or dynamic skipping)</li>
                  <li>• World's greatest stretch + thoracic spine open-books (8 reps / side)</li>
                  <li>• 2 progressive unloaded rehearsal sets of primary movement pattern</li>
                </ul>
              </div>

              {/* Prescribed Movements */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono font-bold text-[#88A8C8] uppercase tracking-wider">
                  Prescribed Movements ({selectedSession.exercises.length})
                </div>

                {selectedSession.exercises.map((ex, idx) => (
                  <div
                    key={ex.id || idx}
                    className="p-4 rounded-xl bg-[#121618] border border-[#1e252a] hover:border-[#D7FF43]/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#080909] text-[#D7FF43] flex items-center justify-center font-mono text-xs font-bold border border-[#1e252a]">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{ex.exercise_name}</h4>
                        <div className="text-[11px] text-[#88A8C8] font-mono flex items-center gap-3 mt-0.5">
                          <span>Target: {ex.intensity}</span>
                          <span>•</span>
                          <span>Rest: {ex.rest_seconds}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="px-3 py-1 rounded-lg bg-[#080909] border border-[#1e252a] text-xs font-mono font-bold text-white">
                        {ex.sets} sets × {ex.reps}
                      </span>
                      <button
                        onClick={() => onReplaceExercise(selectedSession, ex.exercise_name)}
                        className="px-2.5 py-1 rounded-lg bg-[#222711] border border-[#3d471d] text-[#D7FF43] text-xs font-mono font-bold hover:brightness-110 transition-colors"
                      >
                        Swap
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cooldown Protocol */}
              <div className="p-4 rounded-xl bg-[#121618] border border-[#1e252a] space-y-2">
                <div className="text-[10px] font-mono font-bold text-[#88A8C8] uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF43]" />
                  Parasympathetic Cooldown & Soft Tissue Flushing (5 Mins)
                </div>
                <p className="text-xs text-[#88A8C8] font-mono leading-relaxed">
                  3 minutes box breathing (4s inhale, 4s hold, 4s exhale, 4s hold) to rapidly shift autonomic tone into recovery, followed by passive hamstring and hip flexor static lengthening.
                </p>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: VALIDATED AI PLAN GENERATOR FORM */}
      {/* ============================================================ */}
      {activeTab === 'generator' && (
        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#3d471d] shadow-[0_0_20px_-5px_rgba(215,255,67,0.15)] space-y-6">
          <div className="pb-4 border-b border-[#1a1f24]">
            <span className="text-[10px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider">
              VALIDATED MULTI-VARIABLE INPUT FORM
            </span>
            <h2 className="text-2xl font-black text-white mt-0.5">Generate Your Individualized Plan</h2>
            <p className="text-xs text-[#88A8C8] mt-1 leading-relaxed">
              Calibrates microcycle split, training frequency, exercise volume, warm-up, and cooldown according to your biomechanical profile.
            </p>
          </div>

          {generateError && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300 font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {generateError}
            </div>
          )}

          <form onSubmit={handleGeneratePlan} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Age (years)
                </label>
                <input
                  type="number"
                  min="16"
                  max="90"
                  value={genAge}
                  onChange={(e) => setGenAge(parseInt(e.target.value, 10) || 25)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Fitness Experience
                </label>
                <select
                  value={genExperience}
                  onChange={(e) => setGenExperience(e.target.value)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                >
                  <option value="< 3 months">&lt; 3 months (Novice)</option>
                  <option value="3–12 months">3–12 months (Early Intermediate)</option>
                  <option value="1–3 years">1–3 years (Intermediate)</option>
                  <option value="3+ years">3+ years (Advanced Athlete)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Primary Athletic Goal
                </label>
                <select
                  value={genGoal}
                  onChange={(e) => setGenGoal(e.target.value)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                >
                  <option value="Hypertrophy & Strength">Hypertrophy & Strength</option>
                  <option value="Fat Loss & Body Recomposition">Fat Loss & Body Recomposition</option>
                  <option value="Sports Performance & HYROX">Sports Performance & HYROX</option>
                  <option value="Calisthenics Gymnastic Mastery">Calisthenics Gymnastic Mastery</option>
                  <option value="Aerobic Endurance & Running">Aerobic Endurance & Running</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Training Modality
                </label>
                <select
                  value={genTrainingType}
                  onChange={(e) => setGenTrainingType(e.target.value)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                >
                  <option value="Gym Resistance Training">Gym Resistance Training</option>
                  <option value="Calisthenics & Bodyweight">Calisthenics & Bodyweight</option>
                  <option value="HYROX Functional Conditioning">HYROX Functional Conditioning</option>
                  <option value="Hybrid Gym & Conditioning">Hybrid Gym & Conditioning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Training Frequency (days/week): {genDaysPerWeek} Days
                </label>
                <input
                  type="range"
                  min="2"
                  max="7"
                  value={genDaysPerWeek}
                  onChange={(e) => setGenDaysPerWeek(parseInt(e.target.value, 10))}
                  className="w-full accent-[#D7FF43] mt-2"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Session Duration: {genDurationMins} Minutes
                </label>
                <input
                  type="range"
                  min="30"
                  max="105"
                  step="5"
                  value={genDurationMins}
                  onChange={(e) => setGenDurationMins(parseInt(e.target.value, 10))}
                  className="w-full accent-[#D7FF43] mt-2"
                />
              </div>
            </div>

            {/* Equipment Chips */}
            <div>
              <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-2">
                Available Equipment
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Dumbbells',
                  'Barbell',
                  'Bench',
                  'Pull-up Bar',
                  'Cable Machine',
                  'Kettlebell',
                  'Resistance Bands',
                  'Bodyweight Only',
                ].map((eq) => {
                  const isChecked = genEquipment.includes(eq);
                  return (
                    <button
                      type="button"
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        isChecked
                          ? 'bg-[#222711] text-[#D7FF43] border border-[#3d471d]'
                          : 'bg-[#121618] text-[#88A8C8] border border-[#1e252a]'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Injuries, Limitations & Preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Disclosed Limitations / Irritations
                </label>
                <input
                  type="text"
                  value={genInjuries}
                  onChange={(e) => setGenInjuries(e.target.value)}
                  placeholder="e.g. Mild shoulder impingement or None"
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Movement Preferences
                </label>
                <input
                  type="text"
                  value={genPreferences}
                  onChange={(e) => setGenPreferences(e.target.value)}
                  placeholder="e.g. Emphasize horizontal push and pull"
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#88A8C8] uppercase mb-1">
                  Recovery & Sleep Architecture
                </label>
                <select
                  value={genRecovery}
                  onChange={(e) => setGenRecovery(e.target.value)}
                  className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                >
                  <option value="Optimal (8+ hours sleep, low stress)">Optimal (8+ hrs, high recovery)</option>
                  <option value="Good (7-8 hours sleep)">Good (7-8 hrs regular sleep)</option>
                  <option value="Limited (<6 hours sleep, high workload)">Limited (&lt;6 hrs, high fatigue)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="text-[11px] font-mono text-[#88A8C8]">
                Deterministic fallback is triggered automatically if live AI keys are unconfigured.
              </div>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-6 py-3 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(215,255,67,0.3)] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? 'Synthesizing Microcycle...' : 'Generate Individualized Plan'}
              </button>
            </div>
          </form>

          {/* Generated Result Preview Banner */}
          {generatedResult && (
            <div className="p-5 rounded-2xl bg-[#121618] border border-[#3d471d] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#D7FF43] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully Generated Microcycle #{generatedResult.plan_id}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222711] text-[#D7FF43] border border-[#3d471d]">
                  Engine: {generatedResult.engine_label}
                </span>
              </div>

              <div className="text-sm font-bold text-white">{generatedResult.plan_name}</div>
              <div className="text-xs text-[#88A8C8] font-mono leading-relaxed">
                Progression rule: {generatedResult.progression_guidelines}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="px-4 py-2 rounded-xl bg-[#D7FF43] text-black text-xs font-extrabold hover:brightness-110"
                >
                  View in 7-Day Schedule →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: WORKOUT LOGS HISTORY */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] space-y-4">
          <h3 className="text-lg font-bold text-white font-mono uppercase">
            Completed Workout History ({workoutLogs.length})
          </h3>

          {workoutLogs.length > 0 ? (
            <div className="space-y-2">
              {workoutLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-[#121618] border border-[#1e252a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">{log.exercise_name}</h4>
                    <div className="text-[11px] text-[#88A8C8] font-mono mt-0.5">
                      {log.completed_at} • RPE {log.rpe || 8.0}
                    </div>
                    {log.notes && <div className="text-[11px] text-zinc-400 mt-1 italic">"{log.notes}"</div>}
                  </div>

                  <div className="text-right font-mono self-end sm:self-auto">
                    <span className="px-3 py-1 rounded-lg bg-[#080909] text-[#D7FF43] border border-[#1e252a] font-bold">
                      {log.sets_completed} sets completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#88A8C8]">
              No workouts logged yet. Start a session from the schedule or Gym Training to build your verified record!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
