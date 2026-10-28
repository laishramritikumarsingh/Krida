import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight, Zap, ShieldCheck,
  Calculator, Check, X, Info, Dumbbell
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RecommendationItem } from '../types';

export const ProgressiveOverloadPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptedOverloads, setAcceptedOverloads] = useState<Record<number, 'accepted' | 'declined'>>({});

  // Interactive Overload Simulator State
  const [exercise, setExercise] = useState('Flat Dumbbell Press');
  const [weight, setWeight] = useState<number>(25);
  const [reps, setReps] = useState<number>(10);
  const [rpe, setRpe] = useState<number>(8.0);
  const [painFlag, setPainFlag] = useState<'none' | 'mild' | 'sharp'>('none');
  const [calculatedPlan, setCalculatedPlan] = useState<{
    est1rm: number;
    nextWeight: number;
    nextReps: string;
    rationale: string;
    status: 'increased' | 'consolidate' | 'deload' | 'pain_deload';
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, histRes] = await Promise.allSettled([
        api.recommendations.getAll(),
        api.workouts.getHistory(),
      ]);

      if (recRes.status === 'fulfilled' && recRes.value) {
        setRecommendations(recRes.value.recommendations || []);
      }
      if (histRes.status === 'fulfilled' && histRes.value) {
        setWorkoutHistory(histRes.value.history || []);
      }
    } catch (err) {
      console.error('Failed to load overload data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCalculation(weight, reps, rpe, painFlag);
    if (authLoading) return;
    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const runCalculation = (w: number, r: number, exertion: number, pain: 'none' | 'mild' | 'sharp') => {
    const est1rm = Math.round(w * (1.0 + r / 30.0) * 10) / 10;
    let nextWeight = w;
    let nextReps = `${r} - ${r + 2}`;
    let rationale = '';
    let status: 'increased' | 'consolidate' | 'deload' | 'pain_deload' = 'consolidate';

    if (pain === 'sharp') {
      status = 'pain_deload';
      nextWeight = 0;
      nextReps = 'Cease movement';
      rationale = 'Joint safety red-flag: Sharp or acute localized discomfort detected. Progressive overload must be suspended immediately. Substitute with pain-free variation or active mobility work, and consult a sports physiotherapist if persistent.';
    } else if (pain === 'mild') {
      status = 'deload';
      nextWeight = Math.round(w * 0.8 * 10) / 10;
      nextReps = '12–15 (light tempo)';
      rationale = 'Mild joint ache noted: Deloading external load by -20% while shifting rep range to 12–15 reps allows connective tendon remodeling without aggravating inflammatory thresholds.';
    } else if (r >= 10 && exertion <= 8.5) {
      status = 'increased';
      const jump = w >= 30 ? 2.5 : 1.25;
      nextWeight = Math.round((w + jump) * 10) / 10;
      nextReps = '8–10';
      rationale = `Double-progression milestone satisfied! You completed ${r} reps with RPE ${exertion} (2+ Reps in Reserve). KRIDA steps up external mechanical resistance by +${jump} kg to stimulate high-threshold motor unit recruitment via Henneman\'s size principle.`;
    } else if (exertion >= 9.5 || r < 6) {
      status = 'deload';
      nextWeight = Math.round(Math.max(w * 0.85, 5) * 10) / 10;
      nextReps = '10–12 (controlled tempo)';
      rationale = `High systemic fatigue detected (RPE ${exertion}). Continuing to muscular failure blunts neuromuscular recovery. A temporary 15% load reduction preserves motor pattern fidelity while dissipating central nervous system strain.`;
    } else {
      status = 'consolidate';
      nextWeight = w;
      nextReps = `${r + 1} reps`;
      rationale = `Load consolidation phase: Maintain ${w} kg and aim for 1 additional clean repetition before stepping up external resistance. This solidifies connective tendon remodeling.`;
    }

    setCalculatedPlan({
      est1rm,
      nextWeight,
      nextReps,
      rationale,
      status,
    });
  };

  const handleUserDecision = (recId: number, decision: 'accepted' | 'declined') => {
    setAcceptedOverloads((prev) => ({
      ...prev,
      [recId]: decision,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Header */}
      <div className="pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D7FF43]/10 border border-[#D7FF43]/20 text-xs font-bold text-[#D7FF43] mb-2 font-mono">
          <ArrowUpRight className="w-3.5 h-3.5" />
          09 · MECHANICAL TENSION & DOUBLE PROGRESSION
        </div>
        <h1 className="text-3xl font-black text-white mt-1">
          Progressive Overload Engine
        </h1>
        <p className="text-sm text-zinc-400 mt-0.5 max-w-2xl">
          KRIDA tracks sets, volume tonnage, and RPE to dynamically prescribe mathematical double-progression adjustments or fatigue deloads with mandatory athlete confirmation.
        </p>
      </div>

      {/* CORE SCIENTIFIC PRINCIPLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1d2327] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#D7FF43]/10 border border-[#D7FF43]/20 text-[#D7FF43] flex items-center justify-center font-black">
            01
          </div>
          <h3 className="text-base font-bold text-white">Epley 1RM Equation</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Estimates maximal neuromuscular force output from submaximal work:
          </p>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-[#D7FF43] font-bold text-center">
            1RM = Weight × (1 + Reps / 30)
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1d2327] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
            02
          </div>
          <h3 className="text-base font-bold text-white">Double-Progression Protocol</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Master the rep bracket (e.g. 8–10 reps) with controlled tempo before adding +1.25 to +2.5 kg external load.
          </p>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-cyan-400 font-bold text-center">
            Reps First → +2.5 kg Load Next
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1d2327] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            03
          </div>
          <h3 className="text-base font-bold text-white">Autonomous Deload Protocol</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            When exertion spikes to RPE &ge; 9.5 or pain flags trigger, volume is reduced to facilitate supercompensation.
          </p>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-amber-400 font-bold text-center">
            Fatigue Management & Deload
          </div>
        </div>
      </div>

      {/* RECENT SESSION COMPARISON (PREVIOUS VS CURRENT) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-[#D7FF43] uppercase tracking-wider">Session Comparison Matrix</div>
            <h3 className="text-xl font-black text-white">Previous vs Current Session Performance</h3>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            Automated Delta & Mechanical Tension Review
          </span>
        </div>

        {workoutHistory.length === 0 ? (
          <div className="py-10 rounded-2xl bg-black/20 border border-dashed border-zinc-800 text-center p-4">
            <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-400">No workout session logs available yet to compare.</p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Start and complete a session in Gym Training to establish your baseline.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {workoutHistory.slice(0, 2).map((session, sIdx) => (
              <div key={session.id || sIdx} className="p-5 rounded-2xl bg-[#121618] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sIdx === 0 ? 'bg-[#D7FF43]/20 text-[#D7FF43] border border-[#D7FF43]/30' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {sIdx === 0 ? 'Most Recent Session' : 'Previous Session'}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">{session.date || session.completed_at || 'Recent'}</span>
                </div>
                <div className="text-sm font-bold text-white">{session.session_name || 'Upper Body Strength'}</div>

                <div className="space-y-2 text-xs">
                  {session.logs && session.logs.slice(0, 3).map((log: any, lIdx: number) => {
                    const wArr = Array.isArray(log.weight_kg) ? log.weight_kg : [log.weight_kg];
                    const rArr = Array.isArray(log.reps_completed) ? log.reps_completed : [log.reps_completed];
                    const avgW = wArr.reduce((a: number, b: number) => a + b, 0) / (wArr.length || 1);
                    const avgR = rArr.reduce((a: number, b: number) => a + b, 0) / (rArr.length || 1);
                    return (
                      <div key={lIdx} className="p-2.5 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between">
                        <span className="font-semibold text-zinc-300">{log.exercise_name}</span>
                        <div className="font-mono text-right">
                          <span className="text-[#D7FF43] font-bold">{avgW} kg</span>
                          <span className="text-zinc-400"> × {Math.round(avgR)} reps</span>
                          {log.rpe && <span className="text-zinc-500 ml-2">@ RPE {log.rpe}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INTERACTIVE OVERLOAD SIMULATOR WITH PAIN FLAG */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#D7FF43]/10 border border-[#D7FF43]/20 text-[#D7FF43] flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              Overload Simulator & Progression Predictor
            </h2>
            <p className="text-xs text-zinc-400">
              Test your performance metrics, exertion rating, and comfort flags to preview KRIDA's adaptive prescription.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Compound Lift
            </label>
            <select
              value={exercise}
              onChange={(e) => {
                setExercise(e.target.value);
                runCalculation(weight, reps, rpe, painFlag);
              }}
              className="w-full p-2.5 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:border-[#D7FF43] focus:outline-none"
            >
              <option value="Flat Dumbbell Press">Flat Dumbbell Press</option>
              <option value="Barbell Bench Press">Barbell Bench Press</option>
              <option value="Barbell Back Squat">Barbell Back Squat</option>
              <option value="Barbell Bent-Over Row">Barbell Bent-Over Row</option>
              <option value="Overhead Barbell Press">Overhead Barbell Press</option>
              <option value="Romanian Deadlift">Romanian Deadlift</option>
              <option value="Pull-ups / Chin-ups">Pull-ups / Chin-ups</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Completed Load (kg)
            </label>
            <input
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setWeight(val);
                runCalculation(val, reps, rpe, painFlag);
              }}
              className="w-full p-2.5 rounded-xl bg-[#121618] border border-white/10 text-white font-mono text-xs focus:border-[#D7FF43] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Completed Reps
            </label>
            <input
              type="number"
              min="1"
              max="35"
              value={reps}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 1;
                setReps(val);
                runCalculation(weight, val, rpe, painFlag);
              }}
              className="w-full p-2.5 rounded-xl bg-[#121618] border border-white/10 text-white font-mono text-xs focus:border-[#D7FF43] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Exertion / RPE ({rpe})
            </label>
            <select
              value={rpe}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setRpe(val);
                runCalculation(weight, reps, val, painFlag);
              }}
              className="w-full p-2.5 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:border-[#D7FF43] focus:outline-none font-mono"
            >
              <option value="7">RPE 7.0 (3+ reps in reserve)</option>
              <option value="7.5">RPE 7.5 (2-3 reps reserve)</option>
              <option value="8">RPE 8.0 (2 reps reserve - Target)</option>
              <option value="8.5">RPE 8.5 (1-2 reps reserve)</option>
              <option value="9">RPE 9.0 (1 rep reserve)</option>
              <option value="9.5">RPE 9.5 (0-1 rep reserve)</option>
              <option value="10">RPE 10.0 (Absolute failure)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Joint Pain / Discomfort
            </label>
            <select
              value={painFlag}
              onChange={(e) => {
                const val = e.target.value as 'none' | 'mild' | 'sharp';
                setPainFlag(val);
                runCalculation(weight, reps, rpe, val);
              }}
              className="w-full p-2.5 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:border-[#D7FF43] focus:outline-none"
            >
              <option value="none">No pain (Clear)</option>
              <option value="mild">Mild ache / tendon tightness</option>
              <option value="sharp">Sharp joint pain (Red Flag)</option>
            </select>
          </div>
        </div>

        {/* Calculated Result Card */}
        {calculatedPlan && (
          <div className="p-6 rounded-2xl bg-[#121618] border border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
              <div>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  calculatedPlan.status === 'increased'
                    ? 'bg-[#D7FF43]/20 text-[#D7FF43] border border-[#D7FF43]/30'
                    : calculatedPlan.status === 'pain_deload'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  Status: {calculatedPlan.status.replace('_', ' ').toUpperCase()}
                </span>
                <h3 className="text-xl font-black text-white mt-1.5">
                  Prescription for {exercise}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-zinc-400">Estimated 1RM (Epley)</div>
                  <div className="text-lg font-black text-white font-mono">{calculatedPlan.est1rm} kg</div>
                </div>
                <div className="text-right p-2.5 px-4 rounded-xl bg-[#D7FF43]/10 border border-[#D7FF43]/30">
                  <div className="text-[10px] uppercase font-bold text-[#D7FF43]">Target Next Load</div>
                  <div className="text-xl font-black text-[#D7FF43] font-mono">
                    {calculatedPlan.nextWeight} kg
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-white tracking-wide">
                Target Set Prescription: <span className="text-[#D7FF43]">{calculatedPlan.nextWeight} kg × {calculatedPlan.nextReps}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                <strong className="text-zinc-200">Scientific Rationale: </strong>
                {calculatedPlan.rationale}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE RECOMMENDATIONS WITH MANDATORY ATHLETE CONFIRMATION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#D7FF43] uppercase tracking-wider">Coach Approvals</div>
            <h3 className="text-xl font-black text-white">Pending Overload Target Approvals</h3>
          </div>
          <span className="text-xs text-zinc-400">Explicit athlete confirmation required</span>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 bg-black/20 rounded-2xl border border-dashed border-zinc-800">
            No pending load recommendations. Complete logged sessions in Gym Training to trigger progression assessments.
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const userDecision = acceptedOverloads[rec.id];
              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-[#121618] border border-white/5 hover:border-white/10 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#D7FF43] flex items-center gap-1.5 font-mono">
                      <Zap className="w-3.5 h-3.5" />
                      {rec.title}
                    </span>
                    <span className="text-zinc-500 font-mono text-[11px]">{rec.created_at}</span>
                  </div>

                  <div className="text-sm font-semibold text-white">{rec.message}</div>

                  {rec.why_explanation && (
                    <p className="text-xs text-zinc-400 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                      <strong className="text-zinc-200">Biomechanical Rationale:</strong> {rec.why_explanation}
                    </p>
                  )}

                  {/* Confirmation Actions */}
                  <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D7FF43]" />
                      Safety rule: Load will never increase without athlete consent.
                    </span>

                    {userDecision ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                          userDecision === 'accepted'
                            ? 'bg-[#D7FF43]/20 text-[#D7FF43] border border-[#D7FF43]/30'
                            : 'bg-zinc-800 text-zinc-300 border border-white/10'
                        }`}>
                          {userDecision === 'accepted' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {userDecision === 'accepted' ? 'Target Load Accepted & Stored' : 'Load Kept at Current Level'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUserDecision(rec.id, 'declined')}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline / Keep Load
                        </button>
                        <button
                          onClick={() => handleUserDecision(rec.id, 'accepted')}
                          className="px-3.5 py-1.5 rounded-xl bg-[#D7FF43] hover:bg-[#cbf532] text-black font-black text-xs transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Accept Progression
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DELOAD & RECOVERY REMINDERS */}
      <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-400 space-y-1">
          <span className="font-bold text-white">Deload Phase Guidelines:</span>
          <p>
            Tendon and central nervous system (CNS) adaptation timelines lag muscular hypertrophy by 4–6 weeks. If your average session RPE exceeds 9.0 for two consecutive weeks, schedule a deload microcycle: maintain exercise selection but reduce working sets by 40% and external load by 15% to clear accumulated fatigue and restore maximal power output.
          </p>
        </div>
      </div>
    </div>
  );
};
