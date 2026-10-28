import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X, Clock, Check, ChevronRight, Dumbbell, Sparkles, RefreshCw,
  Trophy, AlertCircle, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { WorkoutSession, WorkoutExercise } from '../types';
import { api } from '../api/client';

interface ActiveWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSession;
  onExerciseReplaceClick: (exerciseName: string) => void;
  onWorkoutCompleted: () => void;
}

export const ActiveWorkoutModal: React.FC<ActiveWorkoutModalProps> = ({
  isOpen,
  onClose,
  session,
  onExerciseReplaceClick,
  onWorkoutCompleted,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  // Per-exercise set log state
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, {
    sets: { weight: number; reps: number; completed: boolean }[];
    rpe: number;
    notes: string;
    logged: boolean;
    adaptationNotice?: { title: string; message: string; why: string; status: string };
  }>>({});

  useEffect(() => {
    if (!isOpen) {
      setSecondsElapsed(0);
      return;
    }

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Initialize logs structure when session changes
  useEffect(() => {
    if (session && session.exercises) {
      const initial: typeof exerciseLogs = {};
      session.exercises.forEach((ex) => {
        initial[ex.exercise_name] = {
          sets: Array.from({ length: ex.sets }, () => ({
            weight: 20,
            reps: 10,
            completed: false,
          })),
          rpe: 8,
          notes: '',
          logged: false,
        };
      });
      setExerciseLogs(initial);
    }
  }, [session]);

  if (!isOpen) return null;

  const currentExercise = session.exercises[activeExerciseIndex];
  const currentLog = currentExercise ? exerciseLogs[currentExercise.exercise_name] : null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const updateSet = (setIdx: number, field: 'weight' | 'reps' | 'completed', value: any) => {
    if (!currentExercise) return;
    const exName = currentExercise.exercise_name;
    setExerciseLogs((prev) => {
      const exData = prev[exName];
      if (!exData) return prev;
      const newSets = [...exData.sets];
      newSets[setIdx] = { ...newSets[setIdx], [field]: value };
      return {
        ...prev,
        [exName]: { ...exData, sets: newSets },
      };
    });
  };

  const handleLogExercise = async () => {
    if (!currentExercise || !currentLog) return;
    const exName = currentExercise.exercise_name;

    const weights = currentLog.sets.map((s) => s.weight);
    const reps = currentLog.sets.map((s) => s.reps);

    try {
      const res = await api.workouts.logExercise({
        workout_session_id: session.id,
        exercise_name: exName,
        sets_completed: currentLog.sets.filter((s) => s.completed).length || currentLog.sets.length,
        weight_kg: weights,
        reps_completed: reps,
        notes: currentLog.notes,
        rpe: currentLog.rpe,
      });

      setExerciseLogs((prev) => ({
        ...prev,
        [exName]: {
          ...prev[exName],
          logged: true,
          adaptationNotice: res.progressive_overload_adaptation
            ? {
                title: res.progressive_overload_adaptation.title,
                message: res.progressive_overload_adaptation.message,
                why: res.progressive_overload_adaptation.why_explanation,
                status: res.progressive_overload_adaptation.status,
              }
            : undefined,
        },
      }));
    } catch (err) {
      console.error('Failed to log exercise:', err);
    }
  };

  const handleFinishWorkout = () => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#86efac', '#06b6d4', '#ffffff'],
      });
    } catch {
      // ignore
    }

    onWorkoutCompleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
      <div className="relative w-full max-w-4xl h-[92vh] glass-panel border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-zinc-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Live Workout Session
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">{session.training_type}</h3>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Timer */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-sm font-bold shadow-inner">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Exercise Navigator */}
          <div className="space-y-2 md:col-span-1 border-r border-white/5 pr-0 md:pr-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              Session Exercises ({session.exercises.length})
            </div>
            {session.exercises.map((ex, idx) => {
              const isLogged = exerciseLogs[ex.exercise_name]?.logged;
              const isCurrent = idx === activeExerciseIndex;
              return (
                <div
                  key={ex.id || idx}
                  onClick={() => setActiveExerciseIndex(idx)}
                  className={`p-3 rounded-2xl cursor-pointer border transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : isLogged
                      ? 'bg-zinc-900/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-xs font-mono w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold truncate">{ex.exercise_name}</span>
                  </div>
                  {isLogged && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Right Active Exercise Logging Card */}
          {currentExercise && currentLog && (
            <div className="md:col-span-2 space-y-6">
              {/* Exercise Details Card */}
              <div className="p-5 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-black text-white">{currentExercise.exercise_name}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span>Target: <strong className="text-zinc-200">{currentExercise.sets} sets × {currentExercise.reps} reps</strong></span>
                      <span>•</span>
                      <span>Rest: <strong className="text-zinc-200">{currentExercise.rest_seconds}s</strong></span>
                      <span>•</span>
                      <span>Intensity: <strong className="text-zinc-200">{currentExercise.intensity}</strong></span>
                    </div>
                  </div>

                  {/* Replace Exercise Button (Triggers RAG substitution) */}
                  <button
                    onClick={() => onExerciseReplaceClick(currentExercise.exercise_name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-semibold border border-white/10 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    Replace
                  </button>
                </div>

                {/* Adaptive Overload Banner (If triggered upon log) */}
                {currentLog.adaptationNotice && (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      {currentLog.adaptationNotice.title}
                    </div>
                    <p className="text-xs text-zinc-300">{currentLog.adaptationNotice.message}</p>
                    <p className="text-[11px] text-emerald-400/90 italic pt-1 border-t border-emerald-500/20">
                      Why: {currentLog.adaptationNotice.why}
                    </p>
                  </div>
                )}
              </div>

              {/* Set Logger Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-zinc-500 uppercase px-2">
                  <div className="col-span-2">Set</div>
                  <div className="col-span-4">Weight (kg)</div>
                  <div className="col-span-4">Reps</div>
                  <div className="col-span-2 text-center">Done</div>
                </div>

                {currentLog.sets.map((s, sIdx) => (
                  <div
                    key={sIdx}
                    className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border transition-all ${
                      s.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-zinc-900/60 border-white/5'
                    }`}
                  >
                    <div className="col-span-2 font-mono text-sm font-bold text-zinc-400 pl-2">
                      #{sIdx + 1}
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        step="0.5"
                        value={s.weight}
                        onChange={(e) => updateSet(sIdx, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={s.reps}
                        onChange={(e) => updateSet(sIdx, 'reps', parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/10 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => updateSet(sIdx, 'completed', !s.completed)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          s.completed
                            ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-500 hover:text-white'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* RPE & Notes */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Exertion / RPE (Rate of Perceived Exertion)
                  </label>
                  <select
                    value={currentLog.rpe}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setExerciseLogs((prev) => ({
                        ...prev,
                        [currentExercise.exercise_name]: {
                          ...prev[currentExercise.exercise_name],
                          rpe: val,
                        },
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="6">RPE 6 (4+ reps in reserve)</option>
                    <option value="7">RPE 7 (3 reps in reserve)</option>
                    <option value="8">RPE 8 (2 reps in reserve - Ideal)</option>
                    <option value="8.5">RPE 8.5 (1-2 reps in reserve)</option>
                    <option value="9">RPE 9 (1 rep in reserve)</option>
                    <option value="9.5">RPE 9.5 (Maybe 1 rep left)</option>
                    <option value="10">RPE 10 (Maximal effort failure)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Session Form Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. explosive tempo, slight shoulder pinch"
                    value={currentLog.notes}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExerciseLogs((prev) => ({
                        ...prev,
                        [currentExercise.exercise_name]: {
                          ...prev[currentExercise.exercise_name],
                          notes: val,
                        },
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLogExercise}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-sm font-bold flex items-center gap-2 transition-all"
                >
                  <Dumbbell className="w-4 h-4" />
                  {currentLog.logged ? 'Update Exercise Log' : 'Save & Analyze Exercise'}
                </button>

                {activeExerciseIndex < session.exercises.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveExerciseIndex(activeExerciseIndex + 1)}
                    className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    Next Movement
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Complete Workout */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-zinc-950 flex items-center justify-between">
          <div className="text-xs text-zinc-400 hidden sm:block">
            Completed logs feed the Adaptive Progressive Overload Engine automatically.
          </div>
          <button
            onClick={handleFinishWorkout}
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Finish & Log Workout
          </button>
        </div>
      </div>
    </div>
  );
};
