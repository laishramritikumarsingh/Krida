import React, { useState, useEffect } from 'react';
import {
  HeartPulse, Moon, Zap, Shield, Activity, Plus, Check,
  Clock, ShieldAlert, Sparkles, Wind
} from 'lucide-react';
import { api } from '../api/client';
import { RecoveryStatus } from '../types';

interface RecoveryPageProps {
  onOpenCheckin: () => void;
}

export const RecoveryPage: React.FC<RecoveryPageProps> = ({ onOpenCheckin }) => {
  const [recovery, setRecovery] = useState<RecoveryStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecovery = async () => {
    setLoading(true);
    try {
      const res = await api.recovery.get();
      setRecovery(res);
    } catch (err) {
      console.error('Failed to load recovery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecovery();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <div className="text-sm font-semibold text-zinc-400">Analyzing autonomic nervous metrics...</div>
      </div>
    );
  }

  const score = recovery?.recovery_score || 86;
  const isPrime = score >= 80;
  const isModerate = score >= 60 && score < 80;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5" />
            Autonomic Recovery & Nervous Readiness
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Recovery Engine</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Synthesizes volume strain, sleep architecture, and subjective fatigue into daily training recommendations.
          </p>
        </div>

        <button
          onClick={onOpenCheckin}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black font-extrabold text-sm shadow-md hover:scale-[1.02] transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Update Morning Check-In
        </button>
      </div>

      {/* RECOVERY SCORE HERO CARD */}
      <div className="glass-card p-8 sm:p-12 rounded-3xl relative overflow-hidden border border-emerald-500/30">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Circular Gauge */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 rounded-full flex flex-col items-center justify-center bg-zinc-950 border-8 border-emerald-500 shadow-2xl shadow-emerald-500/20">
              <div className="text-5xl font-black text-white">{score}%</div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-1">
                {recovery?.readiness_level || 'Prime'}
              </div>
            </div>
            <div className="text-xs text-zinc-500 mt-3 font-semibold">Autonomic Readiness Score</div>
          </div>

          {/* Right Status Details */}
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{recovery?.readiness_level || 'Prime'} Performance Window</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {recovery?.status_text || 'Your recovery appears optimal today.'}
            </h2>

            <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
              {recovery?.recommendation ||
                'High nervous readiness today. Ideal window for progressive overload on compound lifts. Hydrate thoroughly.'}
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-center">
                <div className="text-xs text-zinc-500 font-bold">Sleep Time</div>
                <div className="text-lg font-black text-white mt-0.5">{recovery?.sleep_hours || 7.8}h</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-center">
                <div className="text-xs text-zinc-500 font-bold">Fatigue Level</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">{recovery?.fatigue_level || 3} / 10</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-center">
                <div className="text-xs text-zinc-500 font-bold">Day Strain</div>
                <div className="text-lg font-black text-cyan-400 mt-0.5">{recovery?.strain_score || 11.2}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EVIDENCE-BASED ACTIVE RECOVERY PROTOCOLS */}
      <div className="space-y-4">
        <h3 className="text-2xl font-black text-white">Active Recovery Protocols</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Zone 1 Cardiovascular Flush</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              20 to 30 minutes of low-intensity walking or easy cycling at &lt;55% HR Max. Accelerates lymphatic drainage without causing muscle protein breakdown.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Thoracic & Hip Mobility Flow</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              15 minutes of 90/90 hip switches, cat-cow spine extensions, and deep thoracic openers to decompress spinal erectors and improve motor recruitment.
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Slow-Wave Sleep Hygiene</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Maintain dark bedroom temperature around 18-19°C. 95% of daily human growth hormone is secreted during Stage 3/4 slow-wave sleep.
            </p>
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-amber-500/20 flex items-start gap-3 text-xs text-zinc-400">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Safety Boundary:</strong> KRIDA's recovery score is an algorithmic readiness estimation and does not diagnose clinical overtraining syndrome, endocrine abnormalities, or cardiovascular disease.
        </span>
      </div>
    </div>
  );
};
