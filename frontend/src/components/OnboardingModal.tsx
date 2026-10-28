import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, ChevronRight, ChevronLeft, Sparkles, Activity,
  Dumbbell, Target, Clock, Shield, Flame, Compass, Utensils,
  Trophy, Calendar, Brain, Cpu, CheckCircle2
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { isAuthenticated, demoLogin, refreshUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const totalSteps = 10;

  // Form State
  const [formData, setFormData] = useState({
    age: 26,
    gender: 'Male',
    height_cm: 178,
    weight_kg: 76,
    fitness_level: 'Intermediate',
    primary_goal: 'Muscle Gain',
    training_experience: '1–3 years',
    training_frequency: 4,
    available_equipment: ['Dumbbells', 'Barbell', 'Bench'],
    training_preference: 'Gym',
    dietary_preference: 'Non-Vegetarian',
    sports_interests: ['General Fitness', 'Running'],
    schedule_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'],
  });

  // AI Generation sequence state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStageIndex, setAiStageIndex] = useState(0);

  const aiStages = [
    'Understanding your goals',
    'Analyzing training experience',
    'Checking available equipment',
    'Retrieving fitness knowledge',
    'Designing your training structure',
    'Optimizing recovery',
    'Building your nutrition strategy',
  ];

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setAiStageIndex((prev) => {
          if (prev < aiStages.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 700);

      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      triggerPlanGeneration();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleEquipment = (item: string) => {
    setFormData((prev) => {
      const exists = prev.available_equipment.includes(item);
      if (exists) {
        return {
          ...prev,
          available_equipment: prev.available_equipment.filter((i) => i !== item),
        };
      } else {
        return {
          ...prev,
          available_equipment: [...prev.available_equipment, item],
        };
      }
    });
  };

  const toggleSport = (item: string) => {
    setFormData((prev) => {
      const exists = prev.sports_interests.includes(item);
      if (exists) {
        return {
          ...prev,
          sports_interests: prev.sports_interests.filter((i) => i !== item),
        };
      } else {
        return {
          ...prev,
          sports_interests: [...prev.sports_interests, item],
        };
      }
    });
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => {
      const exists = prev.schedule_days.includes(day);
      if (exists) {
        if (prev.schedule_days.length <= 1) return prev; // Keep at least one
        return {
          ...prev,
          schedule_days: prev.schedule_days.filter((d) => d !== day),
        };
      } else {
        return {
          ...prev,
          schedule_days: [...prev.schedule_days, day],
        };
      }
    });
  };

  const triggerPlanGeneration = async () => {
    setIsGenerating(true);
    setAiStageIndex(0);

    try {
      // If user is not authenticated yet, sign in via demoLogin so token is saved in localStorage
      if (!isAuthenticated) {
        await demoLogin();
      }

      await api.profile.generatePlan(formData);
      await refreshUser();

      // Give 5.2 seconds total for the 7 stages animation to complete delightfully
      setTimeout(() => {
        setIsGenerating(false);
        onComplete();
        onClose();
      }, 5200);
    } catch (err: any) {
      console.error('Error generating plan:', err);
      setIsGenerating(false);
      onComplete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <div className="relative w-full max-w-2xl glass-panel border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Close Button */}
        {!isGenerating && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* AI GENERATION SCREEN */}
        {isGenerating ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            {/* Animated Pulsing Core */}
            <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-emerald-400/40 border-dashed animate-spin" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-lime-400 flex items-center justify-center text-black shadow-xl shadow-emerald-500/30">
                <Brain className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-3">
              <Cpu className="w-3.5 h-3.5" />
              Retrieval-Augmented Generation Active
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              KRIDA is analyzing your profile...
            </h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8">
              Synthesizing biomechanical science, TDEE equations, and progressive overload vectors for your custom split.
            </p>

            {/* Stages List */}
            <div className="w-full max-w-md space-y-2.5 text-left bg-zinc-900/60 p-5 rounded-2xl border border-white/10">
              {aiStages.map((stageName, idx) => {
                const isPassed = idx < aiStageIndex;
                const isCurrent = idx === aiStageIndex;
                return (
                  <div
                    key={stageName}
                    className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                      isPassed
                        ? 'text-emerald-400'
                        : isCurrent
                        ? 'text-white font-bold'
                        : 'text-zinc-500'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      )}
                    </div>
                    <span>{stageName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* STEP-BY-STEP ONBOARDING WIZARD */
          <div>
            {/* Progress Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                <span>
                  Step {step} of {totalSteps}
                </span>
                <span className="text-emerald-400 font-bold">
                  {Math.round((step / totalSteps) * 100)}% Completed
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-300"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[340px]">
              {/* STEP 1: Basic Information */}
              {step === 1 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Basic Information</h4>
                  <p className="text-sm text-zinc-400 mb-6">
                    Enter your biometrics so KRIDA can calibrate baseline energy expenditure and volume tolerance.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Age</label>
                      <input
                        type="number"
                        min="14"
                        max="90"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                        className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Gender (Optional)</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Height (cm)</label>
                      <input
                        type="number"
                        min="100"
                        max="240"
                        value={formData.height_cm}
                        onChange={(e) => setFormData({ ...formData, height_cm: Number(e.target.value) })}
                        className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Weight (kg)</label>
                      <input
                        type="number"
                        min="35"
                        max="200"
                        value={formData.weight_kg}
                        onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
                        className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Fitness Level */}
              {step === 2 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Fitness Level</h4>
                  <p className="text-sm text-zinc-400 mb-6">
                    How would you classify your current conditioning and movement mastery?
                  </p>
                  <div className="space-y-3">
                    {[
                      { level: 'Beginner', desc: 'New to structured resistance training or resuming after a long hiatus' },
                      { level: 'Intermediate', desc: '1+ years consistent lifting, comfortable with barbell/dumbbell compounds' },
                      { level: 'Advanced', desc: '3+ years continuous training, specialized strength/athletic goals' },
                    ].map((item) => (
                      <div
                        key={item.level}
                        onClick={() => setFormData({ ...formData, fitness_level: item.level })}
                        className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                          formData.fitness_level === item.level
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold text-base flex items-center justify-between">
                          <span>{item.level}</span>
                          {formData.fitness_level === item.level && <Check className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Primary Goal */}
              {step === 3 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Primary Goal</h4>
                  <p className="text-sm text-zinc-400 mb-5">
                    What is your single most important athletic outcome right now?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Fat Loss',
                      'Muscle Gain',
                      'Body Recomposition',
                      'Strength',
                      'Endurance',
                      'General Fitness',
                      'Sports Performance',
                    ].map((goal) => (
                      <div
                        key={goal}
                        onClick={() => setFormData({ ...formData, primary_goal: goal })}
                        className={`p-3.5 rounded-xl cursor-pointer border text-sm font-semibold transition-all flex items-center justify-between ${
                          formData.primary_goal === goal
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <span>{goal}</span>
                        {formData.primary_goal === goal && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Training Experience */}
              {step === 4 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Training Experience</h4>
                  <p className="text-sm text-zinc-400 mb-6">
                    How long have you been actively working out with structured programming?
                  </p>
                  <div className="space-y-3">
                    {['< 3 months', '3–12 months', '1–3 years', '3+ years'].map((exp) => (
                      <div
                        key={exp}
                        onClick={() => setFormData({ ...formData, training_experience: exp })}
                        className={`p-4 rounded-xl cursor-pointer border font-semibold text-sm transition-all flex items-center justify-between ${
                          formData.training_experience === exp
                            ? 'bg-emerald-500/15 border-emerald-500 text-white'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <span>{exp}</span>
                        {formData.training_experience === exp && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: Training Frequency */}
              {step === 5 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Training Frequency</h4>
                  <p className="text-sm text-zinc-400 mb-6">
                    How many days per week can you realistically commit to training?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[2, 3, 4, 5, 6, 7].map((num) => (
                      <div
                        key={num}
                        onClick={() => setFormData({ ...formData, training_frequency: num })}
                        className={`p-5 rounded-2xl cursor-pointer border text-center transition-all ${
                          formData.training_frequency === num
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <div className="text-3xl font-black text-white mb-1">{num}</div>
                        <div className="text-xs uppercase tracking-wider font-semibold">Days / Week</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 6: Available Equipment */}
              {step === 6 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Available Equipment</h4>
                  <p className="text-sm text-zinc-400 mb-4">
                    Select all gear you have access to. KRIDA will only prescribe exercises using these.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {[
                      'Bodyweight',
                      'Dumbbells',
                      'Barbell',
                      'Bench',
                      'Cable Machine',
                      'Machines',
                      'Resistance Bands',
                      'Pull-up Bar',
                      'Kettlebell',
                      'Full Gym',
                    ].map((eq) => {
                      const isSelected = formData.available_equipment.includes(eq);
                      return (
                        <div
                          key={eq}
                          onClick={() => toggleEquipment(eq)}
                          className={`p-3 rounded-xl cursor-pointer border text-xs font-semibold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          <span>{eq}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 7: Training Preference */}
              {step === 7 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Training Preference</h4>
                  <p className="text-sm text-zinc-400 mb-5">
                    What primary movement style or discipline excites you most?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Gym',
                      'Calisthenics',
                      'Running',
                      'Hyrox',
                      'Cycling',
                      'Swimming',
                      'Mixed Training',
                    ].map((pref) => (
                      <div
                        key={pref}
                        onClick={() => setFormData({ ...formData, training_preference: pref })}
                        className={`p-3.5 rounded-xl cursor-pointer border text-sm font-semibold transition-all flex items-center justify-between ${
                          formData.training_preference === pref
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <span>{pref}</span>
                        {formData.training_preference === pref && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 8: Dietary Preferences */}
              {step === 8 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Dietary Preferences</h4>
                  <p className="text-sm text-zinc-400 mb-5">
                    KRIDA tailors macros and meal suggestions to fit your nutritional guidelines.
                  </p>
                  <div className="space-y-3">
                    {[
                      'Vegetarian',
                      'Non-Vegetarian',
                      'Vegan',
                      'Eggetarian',
                      'No Preference',
                    ].map((diet) => (
                      <div
                        key={diet}
                        onClick={() => setFormData({ ...formData, dietary_preference: diet })}
                        className={`p-3.5 rounded-xl cursor-pointer border text-sm font-semibold transition-all flex items-center justify-between ${
                          formData.dietary_preference === diet
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-900/60 border-white/10 text-zinc-300 hover:border-white/20'
                        }`}
                      >
                        <span>{diet}</span>
                        {formData.dietary_preference === diet && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 9: Sports Interests */}
              {step === 9 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">Sports Interests</h4>
                  <p className="text-sm text-zinc-400 mb-4">
                    Select any sports you practice or train for. KRIDA embeds athletic transfer modules.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                    {[
                      'Hyrox',
                      'Running',
                      'Football',
                      'Basketball',
                      'Swimming',
                      'Cycling',
                      'Triathlon',
                      'Calisthenics',
                      'General Fitness',
                    ].map((sport) => {
                      const isSelected = formData.sports_interests.includes(sport);
                      return (
                        <div
                          key={sport}
                          onClick={() => toggleSport(sport)}
                          className={`p-3 rounded-xl cursor-pointer border text-xs font-semibold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          <span>{sport}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 10: Schedule */}
              {step === 10 && (
                <div>
                  <h4 className="text-2xl font-black text-white mb-2">What days can you train?</h4>
                  <p className="text-sm text-zinc-400 mb-5">
                    Select your preferred workout days. Rest and active recovery will be scheduled on other days.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      'Monday',
                      'Tuesday',
                      'Wednesday',
                      'Thursday',
                      'Friday',
                      'Saturday',
                      'Sunday',
                    ].map((day) => {
                      const isSelected = formData.schedule_days.includes(day);
                      return (
                        <div
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`p-3.5 rounded-xl cursor-pointer border text-xs font-bold text-center transition-all ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          <div>{day}</div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto mt-1" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 text-xs font-semibold transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>{step === totalSteps ? 'Generate My KRIDA Plan' : 'Continue'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
