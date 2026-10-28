import React, { useState } from 'react';
import { X, HeartPulse, Moon, Zap, Check } from 'lucide-react';
import { api } from '../api/client';

interface RecoveryCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckinComplete: () => void;
}

export const RecoveryCheckinModal: React.FC<RecoveryCheckinModalProps> = ({
  isOpen,
  onClose,
  onCheckinComplete,
}) => {
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [fatigueLevel, setFatigueLevel] = useState<number>(4);
  const [sorenessLevel, setSorenessLevel] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.recovery.checkin({
        sleep_hours: sleepHours,
        fatigue_level: fatigueLevel,
        soreness_level: sorenessLevel,
      });
      onCheckinComplete();
      onClose();
    } catch (err) {
      console.error('Failed to submit recovery checkin:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-2">
            <HeartPulse className="w-3.5 h-3.5" />
            Autonomic Recovery Calibration
          </div>
          <h3 className="text-xl font-black text-white">Daily Readiness Check-In</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Log your subjective morning markers to calibrate today's recommended training intensity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Sleep Hours */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-cyan-400" />
                Sleep Duration
              </span>
              <span className="font-mono text-emerald-400 font-bold">{sleepHours} hrs</span>
            </div>
            <input
              type="range"
              min="4"
              max="11"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>4h (Severe Deficit)</span>
              <span>7.5h (Optimal)</span>
              <span>11h</span>
            </div>
          </div>

          {/* Subjective Fatigue */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Subjective Fatigue Level
              </span>
              <span className="font-mono text-emerald-400 font-bold">{fatigueLevel} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={fatigueLevel}
              onChange={(e) => setFatigueLevel(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>1 (Fresh)</span>
              <span>5 (Moderate)</span>
              <span>10 (Exhausted)</span>
            </div>
          </div>

          {/* Muscle Soreness */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1.5">
              <span>Muscle Soreness (DOMS)</span>
              <span className="font-mono text-emerald-400 font-bold">{sorenessLevel} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={sorenessLevel}
              onChange={(e) => setSorenessLevel(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>1 (None)</span>
              <span>3 (Noticeable)</span>
              <span>5 (Severe)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black font-extrabold text-sm shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {loading ? 'Calculating Recovery...' : 'Update Recovery Score'}
          </button>
        </form>
      </div>
    </div>
  );
};
