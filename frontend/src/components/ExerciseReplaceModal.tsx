import React, { useState } from 'react';
import { X, RefreshCw, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';

interface ExerciseReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutSessionId: number;
  currentExerciseName: string;
  onReplacementApplied: () => void;
}

export const ExerciseReplaceModal: React.FC<ExerciseReplaceModalProps> = ({
  isOpen,
  onClose,
  workoutSessionId,
  currentExerciseName,
  onReplacementApplied,
}) => {
  const [reason, setReason] = useState('Equipment unavailable or occupied in gym');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    original_exercise: string;
    recommended_replacement: string;
    alternative_options: string[];
    why_explanation: string;
    adjusted_sets: number;
    adjusted_reps: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleFetchReplacement = async () => {
    setLoading(true);
    try {
      const res = await api.workouts.replaceExercise({
        workout_session_id: workoutSessionId,
        current_exercise_name: currentExerciseName,
        reason,
      });
      setResult(res);
    } catch (err) {
      console.error('Failed to get replacement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onReplacementApplied();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-xs font-semibold text-cyan-400 mb-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Biomechanical Exercise Substitution
          </div>
          <h3 className="text-xl font-black text-white">Replace {currentExerciseName}</h3>
          <p className="text-xs text-zinc-400 mt-1">
            KRIDA's RAG engine retrieves exercises that match identical motor vectors and muscle length tension curves.
          </p>
        </div>

        {!result ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">
                Reason for Substitution
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="Equipment unavailable or occupied in gym">Equipment unavailable or occupied</option>
                <option value="Joint discomfort or minor pain">Joint discomfort / movement impingement</option>
                <option value="Prefer variety / novel stimulus">Looking for variation / novel stimulus</option>
                <option value="Home workout with limited dumbbells">Limited home gear / dumbbells only</option>
              </select>
            </div>

            <button
              onClick={handleFetchReplacement}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Consulting Biomechanical Knowledge Base...' : 'Find Evidence-Based Alternative'}
            </button>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in">
            {/* Recommendation Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-cyan-500/40 space-y-2">
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Optimal Scientific Replacement
              </div>
              <div className="text-xl font-black text-white">{result.recommended_replacement}</div>
              <div className="text-xs text-zinc-300">
                Prescription: <strong>{result.adjusted_sets} sets × {result.adjusted_reps}</strong>
              </div>
            </div>

            {/* Why Explanation */}
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 space-y-1">
              <div className="text-xs font-bold text-zinc-400 uppercase">Biomechanical Rationale</div>
              <p className="text-xs text-zinc-300 leading-relaxed">{result.why_explanation}</p>
            </div>

            {/* Backup Options */}
            {result.alternative_options && result.alternative_options.length > 0 && (
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase mb-2">Other Viable Options</div>
                <div className="flex flex-wrap gap-2">
                  {result.alternative_options.map((alt) => (
                    <span
                      key={alt}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-300"
                    >
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleApply}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply Replacement to Workout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
