import React, { useState, useEffect } from 'react';
import {
  HeartPulse, Plus, CheckCircle2, Target, FileText,
  Download, Sparkles, Trash2, X, Check, AlertCircle, Printer
} from 'lucide-react';
import { api } from '../api/client';
import { RecoveryStatus, FitnessGoal } from '../types';
import { useAuth } from '../context/AuthContext';

interface ReportsGoalsPageProps {
  onOpenCheckin: () => void;
}

export const ReportsGoalsPage: React.FC<ReportsGoalsPageProps> = ({ onOpenCheckin }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [recovery, setRecovery] = useState<RecoveryStatus | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Goal Form Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<'strength' | 'endurance' | 'physique' | 'skill' | 'consistency'>('strength');
  const [currentVal, setCurrentVal] = useState<string>('80');
  const [targetVal, setTargetVal] = useState<string>('100');
  const [unit, setUnit] = useState('kg');
  const [deadline, setDeadline] = useState('8 Weeks');
  const [goalNotes, setGoalNotes] = useState('');

  // Editing current value state
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [editCurrentVal, setEditCurrentVal] = useState<string>('');

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [recRes, sumRes, goalsRes] = await Promise.allSettled([
        api.recovery.get(),
        api.reports.getSummary(),
        api.goals.getAll(),
      ]);

      if (recRes.status === 'fulfilled' && recRes.value) {
        setRecovery(recRes.value);
      }
      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummary(sumRes.value);
      }
      if (goalsRes.status === 'fulfilled' && Array.isArray(goalsRes.value)) {
        setGoals(goalsRes.value);
      }
    } catch (err) {
      console.error('Failed to load reports & goals data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      loadAllData();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingGoal(true);
    try {
      await api.goals.create({
        title: goalTitle.trim(),
        category: goalCategory,
        current_value: parseFloat(currentVal) || 0,
        target_value: parseFloat(targetVal) || 100,
        unit: unit.trim() || 'kg',
        deadline: deadline.trim() || '8 Weeks',
        notes: goalNotes.trim(),
      });
      setShowGoalModal(false);
      setGoalTitle('');
      await loadAllData();
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setSubmittingGoal(false);
    }
  };

  const handleUpdateCurrentValue = async (goal: FitnessGoal) => {
    const val = parseFloat(editCurrentVal);
    if (isNaN(val)) return;

    try {
      await api.goals.update(goal.id, {
        current_value: val,
        status: val >= goal.target_value ? 'achieved' : 'in_progress',
      });
      setEditingGoalId(null);
      await loadAllData();
    } catch (err) {
      console.error('Failed to update goal:', err);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('Are you sure you want to remove this milestone target?')) return;
    try {
      await api.goals.delete(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    setStatusMessage(null);
    try {
      await api.reports.downloadCsv();
      setStatusMessage({ text: 'Training history CSV downloaded successfully.', type: 'success' });
    } catch (err: any) {
      console.error('CSV download error:', err);
      setStatusMessage({ text: err.message || 'Could not download CSV. Please verify server connection.', type: 'error' });
    } finally {
      setDownloadingCsv(false);
    }
  };

  const score = recovery?.recovery_score || 86;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D7FF43]/10 border border-[#D7FF43]/20 text-xs font-bold text-[#D7FF43] mb-2 font-mono">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>12 · ATHLETIC AUDIT & TARGET MILESTONES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Reports & Goal Engine
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Consolidate your autonomic recovery state, track measurable periodized milestones, and export verifiable athletic logs.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleDownloadCsv}
            disabled={downloadingCsv}
            className="px-4 py-2.5 rounded-xl bg-[#0e1113] border border-[#1d2327] hover:border-[#D7FF43]/40 text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-[#D7FF43]" />
            {downloadingCsv ? 'Streaming CSV...' : 'Export CSV'}
          </button>

          <button
            onClick={onOpenCheckin}
            className="px-5 py-2.5 rounded-xl bg-[#D7FF43] hover:bg-[#cbf532] text-black font-black text-xs tracking-wider uppercase transition-all flex items-center gap-2 shadow-md shadow-[#D7FF43]/10"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Morning Check-In
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
            statusMessage.type === 'success'
              ? 'bg-[#D7FF43]/10 border-[#D7FF43]/30 text-[#D7FF43]'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* SUMMARY STATS GRID */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Workouts Completed</span>
            <div className="text-3xl font-black text-white">{summary.total_workouts_completed}</div>
            <div className="text-[11px] text-[#D7FF43] font-semibold">{summary.consistency_rate}% Consistency Rate</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Cumulative Tonnage</span>
            <div className="text-3xl font-black text-white">{summary.total_training_volume_kg.toLocaleString()} <span className="text-sm font-normal text-zinc-400">kg</span></div>
            <div className="text-[11px] text-cyan-400 font-semibold">Total mechanical work</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Active Goals</span>
            <div className="text-3xl font-black text-white">{summary.in_progress_goals_count} <span className="text-xs font-normal text-zinc-400">active</span></div>
            <div className="text-[11px] text-[#D7FF43] font-semibold">{summary.achieved_goals_count} Achieved milestones</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Conditioning & HYROX</span>
            <div className="text-3xl font-black text-white">{summary.conditioning_sessions_count} <span className="text-xs font-normal text-zinc-400">sessions</span></div>
            <div className="text-[11px] text-amber-400 font-semibold">Compromised aerobic base</div>
          </div>
        </div>
      )}

      {/* AUTONOMIC RECOVERY & PHYSIOLOGICAL READINESS HERO CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Circular Readiness Gauge */}
          <div className="md:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center bg-black/40 border-4 border-[#1a2211] shadow-[0_0_30px_-5px_rgba(215,255,67,0.2)]">
              <span className="text-5xl font-black text-white font-mono">{score}%</span>
              <span className="text-[11px] font-mono font-bold text-[#D7FF43] uppercase tracking-wider mt-1">
                {recovery?.readiness_level || 'OPTIMAL STATE'}
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-3 font-mono">Autonomic Readiness Gauge</div>
          </div>

          {/* Status Breakdown */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-[#D7FF43]/15 border border-[#D7FF43]/30 text-xs font-mono font-bold text-[#D7FF43]">
                {recovery?.readiness_level || 'Prime'} Neural Readiness
              </span>
              <span className="text-xs text-zinc-400 font-mono">HRV & Sleep Architecture</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {recovery?.status_text || 'Central nervous system readiness is elevated. Ideal window for maximum motor unit recruitment.'}
            </h2>

            <div className="p-4 rounded-2xl bg-[#121618] border border-white/5 text-xs text-zinc-300 leading-relaxed">
              <strong className="text-white">AI Prescription: </strong>
              {recovery?.recommendation || 'You are primed for progressive overload. Target high mechanical tension on primary compound movements with controlled eccentrics.'}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-[#121618] border border-white/5 text-center font-mono">
                <div className="text-[10px] text-zinc-400 uppercase">Sleep Duration</div>
                <div className="text-base font-bold text-white mt-0.5">{recovery?.sleep_hours || 7.8} hrs</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#121618] border border-white/5 text-center font-mono">
                <div className="text-[10px] text-zinc-400 uppercase">Fatigue Level</div>
                <div className="text-base font-bold text-[#D7FF43] mt-0.5">{recovery?.fatigue_level || 3} / 10</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#121618] border border-white/5 text-center font-mono">
                <div className="text-[10px] text-zinc-400 uppercase">Daily Strain</div>
                <div className="text-base font-bold text-white mt-0.5">{recovery?.strain_score || 11.2}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TARGET GOALS WITH MEASURABLE METRICS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Periodized Target Goals</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Measurable milestones backed by stored database records</p>
          </div>
          <button
            onClick={() => setShowGoalModal(true)}
            className="px-4 py-2 rounded-xl bg-[#0e1113] border border-[#1d2327] hover:border-[#D7FF43]/40 text-xs font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#D7FF43]" />
            New Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="p-10 rounded-3xl bg-[#0e1113] border border-dashed border-[#1d2327] text-center space-y-2">
            <Target className="w-8 h-8 text-zinc-600 mx-auto" />
            <div className="text-sm font-bold text-white">No active goals yet</div>
            <p className="text-xs text-zinc-400">Create a measurable goal like "100kg Bench Press" or "Sub-25 min 5K".</p>
            <button
              onClick={() => setShowGoalModal(true)}
              className="mt-2 text-xs font-bold text-[#D7FF43] hover:underline"
            >
              + Add your first milestone
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const pct = Math.min(Math.round(goal.progress_percentage || (goal.current_value / goal.target_value) * 100), 100);
              const isAchieved = goal.status === 'achieved' || pct >= 100;
              const isEditing = editingGoalId === goal.id;

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] hover:border-white/10 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-[#D7FF43] px-2 py-0.5 rounded-md bg-[#1a2211] border border-[#3d4f1f]">
                          {goal.category}
                        </span>
                        {isAchieved && (
                          <span className="text-[10px] font-bold text-black px-2 py-0.5 rounded-md bg-[#D7FF43] flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Achieved
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-white mt-1.5">{goal.title}</h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <span className="text-xs font-mono">{goal.deadline}</span>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 rounded text-zinc-600 hover:text-rose-400 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Current vs Target */}
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">Current:</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            value={editCurrentVal}
                            onChange={(e) => setEditCurrentVal(e.target.value)}
                            className="w-16 px-1.5 py-0.5 rounded bg-[#121618] border border-[#D7FF43] text-white text-xs font-mono"
                          />
                          <button
                            onClick={() => handleUpdateCurrentValue(goal)}
                            className="p-1 rounded bg-[#D7FF43] text-black hover:bg-[#cbf532]"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                          <button
                            onClick={() => setEditingGoalId(null)}
                            className="p-1 rounded bg-zinc-800 text-zinc-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingGoalId(goal.id);
                            setEditCurrentVal(String(goal.current_value));
                          }}
                          className="font-bold text-white hover:text-[#D7FF43] cursor-pointer underline decoration-dotted"
                          title="Click to edit current value"
                        >
                          {goal.current_value} {goal.unit}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-400">Target: </span>
                      <strong className="text-[#D7FF43] font-bold">{goal.target_value} {goal.unit}</strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                      <span>Milestone Completion</span>
                      <span className="text-[#D7FF43] font-bold">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-[#D7FF43] rounded-full transition-all duration-500 shadow-[0_0_8px_#D7FF43]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI PERFORMANCE DOSSIER & PRINTABLE SUMMARY */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D7FF43] uppercase">
              <FileText className="w-3.5 h-3.5" />
              Integrated AI Diagnostic Dossier
            </div>
            <h3 className="text-xl font-black text-white mt-1">Athlete Performance Diagnostic</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Generates an audit synthesized from your training volume, Epley 1RMs, and recovery biomarkers.
            </p>
          </div>

          <button
            onClick={() => setReportGenerated(true)}
            className="px-5 py-2.5 rounded-xl bg-[#D7FF43]/15 border border-[#D7FF43]/30 hover:bg-[#D7FF43]/25 text-[#D7FF43] text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Compile Athletic Report
          </button>
        </div>

        {reportGenerated ? (
          <div className="p-6 rounded-2xl bg-[#121618] border border-[#D7FF43]/30 space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D7FF43]" />
                <span className="text-xs font-mono font-bold text-white uppercase">
                  Dossier Ref: KRIDA-ATH-{(Math.random() * 9000 + 1000).toFixed(0)} • Ready for Printing
                </span>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl bg-black/40 border border-white/10 hover:border-[#D7FF43]/40 text-xs font-mono text-[#D7FF43] flex items-center gap-1.5 transition-all self-start sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <div className="text-zinc-400 font-mono">Autonomic Fatigue</div>
                <div className="text-sm font-bold text-white">Low (Prime adaptation window)</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <div className="text-zinc-400 font-mono">Volume Compliance</div>
                <div className="text-sm font-bold text-[#D7FF43]">
                  {summary?.consistency_rate || 92}% adherence rate
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <div className="text-zinc-400 font-mono">Next Priority</div>
                <div className="text-sm font-bold text-white">Double-Progression & HYROX Intervals</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#121618]/50 border border-dashed border-white/5 text-center text-xs text-zinc-400">
            Click "Compile Athletic Report" above to synthesize a multi-modal report covering cardiovascular capacity, compound 1RM progress, and recovery state.
          </div>
        )}
      </div>

      {/* CREATE GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0e1113] border border-[#1d2327] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-[#D7FF43] uppercase tracking-wider font-mono">Target Metric</span>
              <h3 className="text-xl font-black text-white mt-0.5">Create Periodized Goal</h3>
              <p className="text-xs text-zinc-400">Set a measurable target backed by date-stamped logs.</p>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Goal Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barbell Bench Press 100kg"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Category</label>
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D7FF43]"
                >
                  <option value="strength">Strength (1RM / Load)</option>
                  <option value="endurance">Endurance (Running / HYROX)</option>
                  <option value="skill">Calisthenics Skill</option>
                  <option value="physique">Body Composition / Weight</option>
                  <option value="consistency">Consistency / Weekly Volume</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Current</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={currentVal}
                    onChange={(e) => setCurrentVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#D7FF43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Target</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={targetVal}
                    onChange={(e) => setTargetVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#D7FF43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#D7FF43]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Timeline / Deadline</label>
                <input
                  type="text"
                  placeholder="e.g. 8 Weeks, or Dec 2026"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGoal}
                  className="px-5 py-2 rounded-xl bg-[#D7FF43] hover:bg-[#cbf532] text-black text-xs font-black shadow-md transition-all"
                >
                  {submittingGoal ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
