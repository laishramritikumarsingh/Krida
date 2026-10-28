import React, { useState, useEffect } from 'react';
import {
  BookOpen, Search, Dumbbell, ChevronRight, X,
  CheckCircle2, Info
} from 'lucide-react';
import { api } from '../api/client';
import { ExerciseItem } from '../types';

export const ExerciseLibraryPage: React.FC = () => {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [loading, setLoading] = useState(true);

  // Environment & Equipment Preset
  const [envPreset, setEnvPreset] = useState<'custom' | 'bodyweight' | 'home_gym' | 'commercial'>('home_gym');
  const [selectedGear, setSelectedGear] = useState<string[]>(['Dumbbells', 'Pull-up Bar', 'Bench']);
  const [selectedSpace, setSelectedSpace] = useState<'compact' | 'home' | 'facility'>('home');
  const [selectedGoal, setSelectedGoal] = useState<'hypertrophy' | 'strength' | 'hyrox' | 'calisthenics'>('hypertrophy');

  // Active exercise detail modal
  const [activeExercise, setActiveExercise] = useState<ExerciseItem | null>(null);

  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Hyrox', 'Cardio'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const allAvailableGear = [
    'Bodyweight',
    'Dumbbells',
    'Barbell',
    'Cable Machine',
    'Machines',
    'Pull-up Bar',
    'Kettlebells',
    'Resistance Bands',
  ];

  const applyPreset = (preset: 'bodyweight' | 'home_gym' | 'commercial') => {
    setEnvPreset(preset);
    if (preset === 'bodyweight') {
      setSelectedGear(['Bodyweight']);
      setSelectedSpace('compact');
    } else if (preset === 'home_gym') {
      setSelectedGear(['Bodyweight', 'Dumbbells', 'Pull-up Bar', 'Bench']);
      setSelectedSpace('home');
    } else if (preset === 'commercial') {
      setSelectedGear(allAvailableGear);
      setSelectedSpace('facility');
    }
  };

  const toggleGear = (item: string) => {
    setEnvPreset('custom');
    setSelectedGear((prev) =>
      prev.includes(item) ? prev.filter((g) => g !== item) : [...prev, item]
    );
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const res = await api.exercises.getAll({
        search: searchTerm || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
      });
      setExercises(res || []);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [selectedCategory, selectedDifficulty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExercises();
  };

  // Filter exercises based on selected equipment and space rules
  const compatibleExercises = exercises.filter((ex) => {
    const eqNeeded = (ex.equipment_needed || '').toLowerCase();

    // Bodyweight is always compatible
    if (eqNeeded.includes('bodyweight') || eqNeeded === 'none') {
      return true;
    }

    // Check against active selected gear
    const hasDumbbell = selectedGear.includes('Dumbbells') && eqNeeded.includes('dumbbell');
    const hasBarbell = selectedGear.includes('Barbell') && eqNeeded.includes('barbell');
    const hasCable = selectedGear.includes('Cable Machine') && eqNeeded.includes('cable');
    const hasMachine = selectedGear.includes('Machines') && eqNeeded.includes('machine');
    const hasPullup = selectedGear.includes('Pull-up Bar') && (eqNeeded.includes('pull-up') || eqNeeded.includes('bar'));
    const hasKettlebell = selectedGear.includes('Kettlebells') && eqNeeded.includes('kettlebell');

    if (envPreset === 'commercial') return true;

    return hasDumbbell || hasBarbell || hasCable || hasMachine || hasPullup || hasKettlebell;
  });

  // Biomechanical explanation builder
  const getCompatibilityExplanation = (ex: ExerciseItem) => {
    const eq = ex.equipment_needed;
    if (eq === 'Bodyweight') {
      return 'Zero equipment required. Maximizes relative bodyweight strength with zero floor space constraint.';
    }
    if (eq.includes('Dumbbell')) {
      return 'Utilizes independent bilateral limb loading to eliminate muscular asymmetries while fitting standard 2m × 2m floor space.';
    }
    if (eq.includes('Barbell')) {
      return 'Provides maximal axial mechanical load for central nervous system adaptation and peak bone mineral density.';
    }
    if (eq.includes('Pull-up')) {
      return 'Delivers essential vertical pulling stimulus to counterbalance horizontal pressing volume.';
    }
    return `Optimized for ${eq} with full biomechanical range of motion and joint stability.`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16 pt-4">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D7FF43]/10 border border-[#D7FF43]/20 text-xs font-bold text-[#D7FF43] mb-2 font-mono">
          <BookOpen className="w-3.5 h-3.5" />
          <span>11 · EQUIPMENT FINDER & EXERCISE CATALOG</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Equipment-Based Exercise Finder
        </h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Select your training environment, available physical gear, and floor space to dynamically discover compatible exercises and substitutions.
        </p>
      </div>

      {/* STEP 1: ENVIRONMENT PRESETS */}
      <div className="p-6 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-[#D7FF43] uppercase tracking-wider font-mono">
              Step 1 · Configuration Presets
            </div>
            <h3 className="text-xl font-black text-white mt-0.5">Choose Your Training Space & Gear</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Real-time biomechanical matching</span>
        </div>

        {/* Preset Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => applyPreset('bodyweight')}
            className={`p-4 rounded-2xl text-left border transition-all ${
              envPreset === 'bodyweight'
                ? 'bg-[#1a2211] border-[#D7FF43] shadow-[0_0_15px_-3px_rgba(215,255,67,0.2)]'
                : 'bg-[#121618] border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white">Pure Bodyweight</span>
              {envPreset === 'bodyweight' && <CheckCircle2 className="w-4 h-4 text-[#D7FF43]" />}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Living room or travel. No external weights required. Calisthenics & plyometrics.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono text-[#D7FF43]">Space: Compact (&lt;4m²)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('home_gym')}
            className={`p-4 rounded-2xl text-left border transition-all ${
              envPreset === 'home_gym'
                ? 'bg-[#1a2211] border-[#D7FF43] shadow-[0_0_15px_-3px_rgba(215,255,67,0.2)]'
                : 'bg-[#121618] border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white">Home Gym Setup</span>
              {envPreset === 'home_gym' && <CheckCircle2 className="w-4 h-4 text-[#D7FF43]" />}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Dumbbells, pull-up bar, and adjustable bench. Covers 90% of hypertrophy needs.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono text-[#D7FF43]">Space: Room / Garage</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('commercial')}
            className={`p-4 rounded-2xl text-left border transition-all ${
              envPreset === 'commercial'
                ? 'bg-[#1a2211] border-[#D7FF43] shadow-[0_0_15px_-3px_rgba(215,255,67,0.2)]'
                : 'bg-[#121618] border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white">Commercial Gym</span>
              {envPreset === 'commercial' && <CheckCircle2 className="w-4 h-4 text-[#D7FF43]" />}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Full barbell racks, cables, machines, sled tracks, and HYROX station gear.
            </p>
            <span className="inline-block mt-2 text-[10px] font-mono text-[#D7FF43]">Space: Full Facility</span>
          </button>
        </div>

        {/* Granular Gear Checkboxes */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="text-xs font-bold text-zinc-300">Toggle Specific Equipment on Hand:</div>
          <div className="flex flex-wrap gap-2">
            {allAvailableGear.map((gear) => {
              const active = selectedGear.includes(gear);
              return (
                <button
                  key={gear}
                  onClick={() => toggleGear(gear)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#D7FF43]/15 text-[#D7FF43] border border-[#D7FF43]/40'
                      : 'bg-[#121618] text-zinc-400 border border-white/5 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-[#D7FF43]' : 'bg-zinc-600'}`} />
                  {gear}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* STEP 2: SEARCH & CATEGORY FILTERS */}
      <div className="p-6 rounded-3xl bg-[#0e1113] border border-[#1d2327] space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search exercise name (e.g. Incline Dumbbell Press, Sled Push, Pull-up)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121618] border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#D7FF43]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#D7FF43] hover:bg-[#cbf532] text-black font-black text-xs tracking-wider uppercase transition-all shadow-md shadow-[#D7FF43]/10"
          >
            Filter
          </button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#D7FF43] text-black border-[#D7FF43]'
                  : 'bg-[#121618] border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* COMPATIBLE EXERCISES CATALOG */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
            Compatible Matches ({compatibleExercises.length} movements available)
          </div>
          <span className="text-xs text-zinc-500">Click any card to inspect biomechanical cues</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-zinc-500">
            Scanning biomechanical catalogue...
          </div>
        ) : compatibleExercises.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0e1113] border border-dashed border-[#1d2327] space-y-2">
            <Dumbbell className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-lg font-bold text-white">No matching exercises for active gear</h4>
            <p className="text-xs text-zinc-400">
              Try selecting "Dumbbells" or switching to "Pure Bodyweight" above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {compatibleExercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => setActiveExercise(ex)}
                className="p-5 rounded-2xl bg-[#0e1113] border border-[#1d2327] cursor-pointer hover:border-[#D7FF43]/40 transition-all space-y-3 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-zinc-400 uppercase">
                    <span>{ex.category || 'General'}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#121618] text-[#D7FF43] border border-white/5">
                      {ex.difficulty}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-white mt-1 group-hover:text-[#D7FF43] transition-colors leading-snug">
                    {ex.name}
                  </h4>

                  <div className="text-xs text-zinc-400 mt-1 font-mono">
                    Gear: <strong className="text-zinc-200">{ex.equipment_needed}</strong> • Pattern: <strong className="text-zinc-200">{ex.movement_type}</strong>
                  </div>

                  {/* Why this fits your setup */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-[#121618] border border-white/5 text-[11px] text-zinc-400 leading-relaxed">
                    <span className="text-[#D7FF43] font-bold block mb-0.5">Why it fits your setup:</span>
                    {getCompatibilityExplanation(ex)}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-zinc-300">{ex.sets_reps_recommendation}</span>
                  <span className="text-[#D7FF43] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DISHONEST COMMERCE PREVENTION DISCLAIMER */}
      <div className="p-4 rounded-2xl bg-[#0e1113] border border-[#1d2327] flex items-start gap-3">
        <Info className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-400 space-y-1">
          <span className="font-bold text-zinc-300">Catalog Integrity Policy:</span>
          <p>
            KRIDA AI evaluates biomechanical suitability based exclusively on exercise physics and anatomical movement planes. We do not fabricate third-party e-commerce retail listings, sponsored products, or fluctuating equipment pricing.
          </p>
        </div>
      </div>

      {/* EXERCISE DETAIL MODAL */}
      {activeExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0e1113] border border-[#1d2327] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <button
              onClick={() => setActiveExercise(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-[#121618] border border-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D7FF43]/10 border border-[#D7FF43]/20 text-xs font-mono font-bold text-[#D7FF43] mb-2">
                {activeExercise.category} • {activeExercise.movement_type}
              </div>
              <h3 className="text-2xl font-black text-white">{activeExercise.name}</h3>
              <div className="text-xs text-zinc-400 mt-1 font-mono">
                Equipment: <strong className="text-white">{activeExercise.equipment_needed}</strong> • Difficulty: <strong className="text-white">{activeExercise.difficulty}</strong>
              </div>
            </div>

            {/* Target Muscles */}
            {activeExercise.target_muscles && activeExercise.target_muscles.length > 0 && (
              <div>
                <div className="text-xs font-mono font-bold text-zinc-400 uppercase mb-1.5">Primary Movers</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeExercise.target_muscles.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-xl bg-[#121618] border border-white/5 text-xs text-zinc-200 font-mono">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Biomechanical Cues */}
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Biomechanical Cues</div>
              <p className="text-xs text-zinc-300 leading-relaxed bg-[#121618] p-3.5 rounded-2xl border border-white/5">
                {activeExercise.instructions}
              </p>
            </div>

            {/* Prescription */}
            <div className="p-3.5 rounded-2xl bg-[#1a2211] border border-[#3d4f1f] flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Target Prescription:</span>
              <span className="font-bold text-[#D7FF43]">{activeExercise.sets_reps_recommendation}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
