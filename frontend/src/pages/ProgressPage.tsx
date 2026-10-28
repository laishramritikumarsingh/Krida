import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Trophy, Scale, Activity,
  Plus, Trash2, CheckCircle2, AlertCircle,
  Dumbbell, ShieldCheck, ArrowUpRight, BarChart2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ProgressAnalytics, ProgressRecordItem, SkillProgress } from '../types';

export const ProgressPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [records, setRecords] = useState<ProgressRecordItem[]>([]);
  const [skills, setSkills] = useState<SkillProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | '3m' | '6m' | 'all'>('30d');
  const [showLogModal, setShowLogModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New log form state
  const [newWeight, setNewWeight] = useState<string>('78.2');
  const [newBench, setNewBench] = useState<string>('85.0');
  const [newSquat, setNewSquat] = useState<string>('115.0');
  const [newDeadlift, setNewDeadlift] = useState<string>('140.0');
  const [new5k, setNew5k] = useState<string>('24.25');
  const [notes, setNotes] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, recordsRes, skillsRes] = await Promise.allSettled([
        api.progress.getAnalytics(),
        api.progress.getRecords(),
        api.calisthenics.getSkills(),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value) {
        setAnalytics(analyticsRes.value);
      }
      if (recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value)) {
        setRecords(recordsRes.value);
      }
      if (skillsRes.status === 'fulfilled' && Array.isArray(skillsRes.value)) {
        setSkills(skillsRes.value);
      }
    } catch (err) {
      console.error('Failed to load progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const handleRecordProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload: any = {
        weight_kg: parseFloat(newWeight) || 75.0,
        notes: notes.trim(),
      };
      if (newBench && !isNaN(parseFloat(newBench))) payload.bench_press_1rm = parseFloat(newBench);
      if (newSquat && !isNaN(parseFloat(newSquat))) payload.squat_1rm = parseFloat(newSquat);
      if (newDeadlift && !isNaN(parseFloat(newDeadlift))) payload.deadlift_1rm = parseFloat(newDeadlift);
      if (new5k && !isNaN(parseFloat(new5k))) payload.running_5k_mins = parseFloat(new5k);

      await api.progress.record(payload);
      setStatusMessage({ text: 'Biometric & performance entry saved to database!', type: 'success' });
      setShowLogModal(false);
      await loadData();
    } catch (err: any) {
      console.error('Failed to log record:', err);
      setStatusMessage({ text: err.message || 'Failed to save entry', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recorded entry?')) return;
    try {
      await api.progress.deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      await loadData();
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  // Filtered weight data
  const rawWeightHistory = analytics?.weight_history || [];
  const filteredWeightHistory = rawWeightHistory.slice(
    dateFilter === '7d' ? -3 : dateFilter === '30d' ? -6 : dateFilter === '3m' ? -12 : 0
  );

  const strengthData = analytics?.strength_history || [];
  const volumeData = analytics?.volume_history || [];

  // SVG Scalers for Weight Chart
  const chartHeight = 160;
  const chartWidth = 520;
  const minW = filteredWeightHistory.length > 0 ? Math.min(...filteredWeightHistory.map((d) => d.weight)) - 1 : 70;
  const maxW = filteredWeightHistory.length > 0 ? Math.max(...filteredWeightHistory.map((d) => d.weight)) + 1 : 85;

  const getWeightY = (w: number) => chartHeight - ((w - minW) / (maxW - minW || 1)) * (chartHeight - 40) - 20;
  const getWeightX = (idx: number) =>
    filteredWeightHistory.length > 1
      ? (idx / (filteredWeightHistory.length - 1)) * (chartWidth - 60) + 30
      : chartWidth / 2;

  const weightSvgPoints = filteredWeightHistory
    .map((d, i) => `${getWeightX(i)},${getWeightY(d.weight)}`)
    .join(' ');

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#D7FF43] border-t-transparent animate-spin" />
        <div className="text-sm font-semibold text-zinc-400">Loading verified progress records...</div>
      </div>
    );
  }

  const prs = analytics?.personal_records || {
    bench_press_1rm: null,
    squat_1rm: null,
    deadlift_1rm: null,
    running_5k_mins: null,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <span className="text-xs font-bold text-[#D7FF43] uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            08 · Bio-Analytics & Milestones
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Progress Tracker</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Real date-stamped biometrics, 1RM compound adaptations, and verified calisthenics milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Filter */}
          <div className="flex gap-1 p-1 rounded-xl bg-[#0e1113] border border-white/10 text-xs font-bold">
            {(['7d', '30d', '3m', '6m', 'all'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === filter
                    ? 'bg-[#D7FF43] text-black font-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 rounded-xl bg-[#D7FF43] hover:bg-[#cbf532] text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-[#D7FF43]/10 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Record Biometrics
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

      {/* PERSONAL RECORDS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] hover:border-[#D7FF43]/30 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D7FF43]/10 border border-[#D7FF43]/20 text-[#D7FF43] flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Bench Press 1RM</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {prs.bench_press_1rm ? (
                <>
                  {prs.bench_press_1rm} <span className="text-xs font-normal text-zinc-400">kg</span>
                </>
              ) : (
                <span className="text-base font-normal text-zinc-500 italic">No lift recorded</span>
              )}
            </div>
            <div className="text-[11px] text-[#D7FF43] font-semibold mt-0.5">Epley 1RM formula</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] hover:border-cyan-500/30 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Squat 1RM</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {prs.squat_1rm ? (
                <>
                  {prs.squat_1rm} <span className="text-xs font-normal text-zinc-400">kg</span>
                </>
              ) : (
                <span className="text-base font-normal text-zinc-500 italic">No lift recorded</span>
              )}
            </div>
            <div className="text-[11px] text-cyan-400 font-semibold mt-0.5">Full depth standard</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] hover:border-amber-500/30 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Deadlift 1RM</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {prs.deadlift_1rm ? (
                <>
                  {prs.deadlift_1rm} <span className="text-xs font-normal text-zinc-400">kg</span>
                </>
              ) : (
                <span className="text-base font-normal text-zinc-500 italic">No lift recorded</span>
              )}
            </div>
            <div className="text-[11px] text-amber-400 font-semibold mt-0.5">Conventional / RDL</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] hover:border-purple-500/30 transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">5K Running PR</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {prs.running_5k_mins ? (
                prs.running_5k_mins
              ) : (
                <span className="text-base font-normal text-zinc-500 italic">No run logged</span>
              )}
            </div>
            <div className="text-[11px] text-purple-400 font-semibold mt-0.5">HYROX compromised pace</div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: BODY WEIGHT TREND */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#D7FF43] uppercase tracking-wider">Bodyweight Dynamics</div>
              <h3 className="text-xl font-black text-white">Weight Trend (kg)</h3>
            </div>
            {filteredWeightHistory.length >= 2 && (
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-black/40 border border-white/10 text-[#D7FF43]">
                {(filteredWeightHistory[filteredWeightHistory.length - 1].weight - filteredWeightHistory[0].weight).toFixed(1)} kg net
              </span>
            )}
          </div>

          {filteredWeightHistory.length === 0 ? (
            <div className="h-48 rounded-2xl bg-black/20 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center p-4">
              <Scale className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-xs font-semibold text-zinc-400">No date-stamped weight entries logged yet.</p>
              <button
                onClick={() => setShowLogModal(true)}
                className="mt-2 text-xs text-[#D7FF43] font-bold hover:underline"
              >
                Log first weight check →
              </button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto pt-2">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-48 overflow-visible">
                <defs>
                  <linearGradient id="weightGradLime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D7FF43" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#D7FF43" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference lines */}
                <line x1="20" y1={chartHeight - 30} x2={chartWidth - 20} y2={chartHeight - 30} stroke="rgba(255,255,255,0.06)" />
                <line x1="20" y1={chartHeight / 2} x2={chartWidth - 20} y2={chartHeight / 2} stroke="rgba(255,255,255,0.06)" />
                <line x1="20" y1="30" x2={chartWidth - 20} y2="30" stroke="rgba(255,255,255,0.06)" />

                {filteredWeightHistory.length > 1 && (
                  <polygon
                    points={`30,${chartHeight - 30} ${weightSvgPoints} ${chartWidth - 30},${chartHeight - 30}`}
                    fill="url(#weightGradLime)"
                  />
                )}

                {filteredWeightHistory.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#D7FF43"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={weightSvgPoints}
                  />
                )}

                {filteredWeightHistory.map((d, i) => (
                  <g key={i}>
                    <circle
                      cx={getWeightX(i)}
                      cy={getWeightY(d.weight)}
                      r="4.5"
                      fill="#0e1113"
                      stroke="#D7FF43"
                      strokeWidth="2.5"
                    />
                    <text
                      x={getWeightX(i)}
                      y={getWeightY(d.weight) - 9}
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {d.weight}kg
                    </text>
                    <text
                      x={getWeightX(i)}
                      y={chartHeight - 12}
                      fill="#71717a"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {d.date}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}
        </div>

        {/* CHART 2: STRENGTH ADAPTATION */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Neuromuscular Adaptation</div>
              <h3 className="text-xl font-black text-white">Estimated 1RM Trends</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-[#D7FF43]">
                <span className="w-2 h-2 rounded-full bg-[#D7FF43]" /> Bench
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Squat
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Deadlift
              </span>
            </div>
          </div>

          {strengthData.length === 0 ? (
            <div className="h-48 rounded-2xl bg-black/20 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center p-4">
              <Dumbbell className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-xs font-semibold text-zinc-400">No compound lift sessions recorded yet.</p>
              <p className="text-[11px] text-zinc-500 mt-1">Log gym training sets to track automatic 1RM calculations.</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {strengthData.slice(-4).map((s, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#121618] border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-400">
                    <span>{s.date} Microcycle</span>
                    <span className="text-white">Summed Total: {(s.bench + s.squat + s.deadlift).toFixed(1)} kg</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <div className="p-2 rounded-xl bg-[#D7FF43]/10 text-[#D7FF43] border border-[#D7FF43]/20 text-center">
                      Bench: {s.bench} kg
                    </div>
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-center">
                      Squat: {s.squat} kg
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-center">
                      Deadlift: {s.deadlift} kg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CALISTHENICS MILESTONES & DISCIPLINE MASTERY */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-[#D7FF43] uppercase tracking-wider">Gymnastic & Bodyweight Mastery</div>
            <h3 className="text-xl font-black text-white">Calisthenics Skill Milestones</h3>
          </div>
          <a
            href="#/calisthenics"
            className="text-xs font-bold text-[#D7FF43] hover:underline flex items-center gap-1"
          >
            Open Calisthenics Progressions <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {skills.slice(0, 4).map((sk) => (
            <div key={sk.id} className="p-4 rounded-2xl bg-[#121618] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">{sk.skill_name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sk.milestone_status === 'Mastered'
                    ? 'bg-[#D7FF43]/20 text-[#D7FF43] border border-[#D7FF43]/40'
                    : sk.milestone_status === 'In Training'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {sk.milestone_status}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Current Level: <span className="text-zinc-200 font-bold">{sk.progression_level}</span>
              </div>
              <div className="text-[11px] text-zinc-400">
                Milestone: <span className="text-[#D7FF43] font-mono font-bold">
                  {sk.hold_duration_sec ? `${sk.hold_duration_sec}s hold` : `${sk.repetitions} reps`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DATE-STAMPED RECORD HISTORY TABLE WITH DELETE ACTIONS */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-[#D7FF43] uppercase tracking-wider">Audit Log & Chronology</div>
            <h3 className="text-xl font-black text-white">Date-Stamped Performance Records</h3>
          </div>
          <span className="text-xs font-bold text-zinc-400">
            {records.length} logged {records.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {records.length === 0 ? (
          <div className="py-12 rounded-2xl bg-black/20 border border-dashed border-zinc-800 flex flex-col items-center justify-center text-center p-4">
            <BarChart2 className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs font-semibold text-zinc-400">No recorded entries found in database.</p>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">
              Use "Record Biometrics" above to start keeping a date-stamped log of body weight and personal records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-zinc-400">
                  <th className="pb-3 font-bold">Date & Time</th>
                  <th className="pb-3 font-bold">Body Weight</th>
                  <th className="pb-3 font-bold">Bench 1RM</th>
                  <th className="pb-3 font-bold">Squat 1RM</th>
                  <th className="pb-3 font-bold">Deadlift 1RM</th>
                  <th className="pb-3 font-bold">5K Run</th>
                  <th className="pb-3 font-bold">Notes</th>
                  <th className="pb-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-mono text-zinc-300">{rec.date}</td>
                    <td className="py-3 font-bold text-white">{rec.weight_kg} kg</td>
                    <td className="py-3 text-[#D7FF43] font-semibold">{rec.estimated_1rm?.['Bench Press'] ? `${rec.estimated_1rm['Bench Press']} kg` : '—'}</td>
                    <td className="py-3 text-cyan-400 font-semibold">{rec.estimated_1rm?.['Squat'] ? `${rec.estimated_1rm['Squat']} kg` : '—'}</td>
                    <td className="py-3 text-amber-400 font-semibold">{rec.estimated_1rm?.['Deadlift'] ? `${rec.estimated_1rm['Deadlift']} kg` : '—'}</td>
                    <td className="py-3 text-purple-400 font-semibold">{rec.running_5k_mins ? `${rec.running_5k_mins}m` : '—'}</td>
                    <td className="py-3 text-zinc-400 max-w-[180px] truncate">{rec.notes || '—'}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete this record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRIVACY & DATA ETHICS NOTICE */}
      <div className="p-4 rounded-2xl bg-black/40 border border-[#1d2327] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#D7FF43] shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-400 space-y-1">
          <span className="font-bold text-zinc-200">Ethical Progress Tracking & Photo Privacy Policy:</span>
          <p>
            All biometrics and strength metrics are stored in your private user profile. KRIDA AI will never upload or process bodily photos for automated body-fat estimation without explicit consent, as single-camera 2D estimates carry severe error margins and potential privacy risks.
          </p>
        </div>
      </div>

      {/* RECORD ENTRY MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0e1113] border border-[#1d2327] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div>
              <span className="text-[10px] font-bold text-[#D7FF43] uppercase tracking-wider">Date-Stamped Metric</span>
              <h3 className="text-xl font-black text-white mt-0.5">Record Biometrics & PRs</h3>
              <p className="text-xs text-zinc-400">Save today's scale weight and any tested 1RM achievements.</p>
            </div>

            <form onSubmit={handleRecordProgress} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Current Body Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Bench Press 1RM (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newBench}
                    onChange={(e) => setNewBench(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D7FF43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Squat 1RM (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newSquat}
                    onChange={(e) => setNewSquat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D7FF43]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Deadlift 1RM (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newDeadlift}
                    onChange={(e) => setNewDeadlift(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D7FF43]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">5K Run (mins)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 24.5"
                    value={new5k}
                    onChange={(e) => setNew5k(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D7FF43]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Notes / Circumference (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Waist 79cm, Arms 37cm, morning fasted"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#121618] border border-white/10 text-white text-xs focus:outline-none focus:border-[#D7FF43]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#D7FF43] hover:bg-[#cbf532] text-black text-xs font-black shadow-md transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
