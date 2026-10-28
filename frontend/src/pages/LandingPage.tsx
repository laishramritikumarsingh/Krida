import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Dumbbell,
  Zap,
  Trophy,
  ArrowRight,
  TrendingUp,
  Activity,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  Play,
  RotateCcw,
  Target
} from 'lucide-react';
import { ThreeHeroAthlete } from '../components/ThreeHeroAthlete';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { WorkoutSession } from '../types';

interface LandingPageProps {
  onBuildPlan: () => void;
  onExplore: () => void;
  onSelectTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onBuildPlan,
  onExplore,
  onSelectTab,
}) => {
  const { user, isAuthenticated, demoLogin } = useAuth();
  const [todaySession, setTodaySession] = useState<WorkoutSession | null>(null);
  const [planName, setPlanName] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<'gym' | 'calisthenics' | 'hyrox'>('gym');

  useEffect(() => {
    let isMounted = true;
    const fetchHomeData = async () => {
      try {
        const [todayRes, analyticsRes] = await Promise.all([
          api.workouts.getToday().catch(() => null),
          api.progress.getAnalytics().catch(() => null),
        ]);
        if (isMounted) {
          if (todayRes?.session) {
            setTodaySession(todayRes.session);
            setPlanName(todayRes.plan_name || 'Personalized Split');
          }
          if (analyticsRes) {
            setAnalytics(analyticsRes);
          }
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        if (isMounted) setLoadingMetrics(false);
      }
    };
    fetchHomeData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  return (
    <div className="space-y-16 md:space-y-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-4 md:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 space-y-6 text-left"
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#222711] border border-[#3d471d] text-xs font-mono font-bold text-[#D7FF43]">
              <Sparkles className="w-3.5 h-3.5 text-[#D7FF43]" />
              <span>INTELLIGENT FITNESS & SPORTS PLATFORM</span>
            </div>

            {/* Oversized Hero Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.06]">
              Train Smarter. <br />
              Get Stronger. <br />
              <span className="text-gradient-lime">Go Beyond.</span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[#88A8C8] max-w-xl leading-relaxed">
              Personalized training, AI-powered fitness guidance and measurable progress in one intelligent platform.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onBuildPlan}
                className="px-7 py-3.5 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-[0_0_20px_rgba(215,255,67,0.35)] flex items-center gap-2.5 active:scale-[0.98] cursor-pointer"
              >
                <span>Generate My Workout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSelectTab('gym-training')}
                className="px-6 py-3.5 rounded-xl bg-[#121618] hover:bg-[#1a1f22] text-white font-bold text-sm border border-[#1e252a] hover:border-[#D7FF43]/40 transition-all flex items-center gap-2"
              >
                <Dumbbell className="w-4 h-4 text-[#D7FF43]" />
                <span>Explore Training</span>
              </button>

              {!isAuthenticated && (
                <button
                  onClick={demoLogin}
                  className="px-4 py-3.5 rounded-xl bg-[#222711] hover:bg-[#2c3316] text-[#D7FF43] text-xs font-mono font-bold border border-[#3d471d] transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Demo</span>
                </button>
              )}
            </div>

            {/* Key Feature Stats Pills */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-[#1a1f24] text-xs">
              <div>
                <div className="font-extrabold text-white text-base font-mono">100%</div>
                <div className="text-[#88A8C8] text-[11px]">Individualized Plans</div>
              </div>
              <div>
                <div className="font-extrabold text-[#D7FF43] text-base font-mono">Closed-Loop</div>
                <div className="text-[#88A8C8] text-[11px]">Adaptive Overload</div>
              </div>
              <div>
                <div className="font-extrabold text-white text-base font-mono">3 Domains</div>
                <div className="text-[#88A8C8] text-[11px]">Gym, Calisthenics, HYROX</div>
              </div>
              <div>
                <div className="font-extrabold text-white text-base font-mono">Evidence-Based</div>
                <div className="text-[#88A8C8] text-[11px]">Peer-Reviewed RAG</div>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Kinetic Athlete Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5 flex justify-center"
          >
            <ThreeHeroAthlete />
          </motion.div>
        </div>
      </section>

      {/* 2. QUICK-START TRAINING SELECTOR */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono font-bold text-[#D7FF43] tracking-widest uppercase">
              FAST-TRACK PROTOCOLS
            </div>
            <h2 className="text-2xl font-black text-white mt-0.5">Quick-Start Training Selector</h2>
          </div>
          <span className="text-xs text-[#88A8C8] font-mono hidden sm:inline">Select your modality</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Gym Training Card */}
          <div
            onClick={() => onSelectTab('gym-training')}
            className={`p-6 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${
              activeCategory === 'gym'
                ? 'bg-[#121618] border-[#3d471d] shadow-[0_0_20px_-5px_rgba(215,255,67,0.25)]'
                : 'bg-[#0e1113] border-[#1a1f24] hover:border-[#D7FF43]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#222711] border border-[#3d471d] text-[#D7FF43] flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#080909] text-[#88A8C8] border border-[#1e252a]">
                03 GYM
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#D7FF43] transition-colors">
              Gym Training Library
            </h3>
            <p className="text-xs text-[#88A8C8] mt-1.5 leading-relaxed">
              Targeted compound lifts, hypertrophy splits, customized exercise builder, and set-by-set logging.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-[#D7FF43] gap-1 group-hover:translate-x-1 transition-transform">
              <span>Start Gym Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Calisthenics Card */}
          <div
            onClick={() => onSelectTab('calisthenics')}
            className={`p-6 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${
              activeCategory === 'calisthenics'
                ? 'bg-[#121618] border-[#3d471d] shadow-[0_0_20px_-5px_rgba(215,255,67,0.25)]'
                : 'bg-[#0e1113] border-[#1a1f24] hover:border-[#D7FF43]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#222711] border border-[#3d471d] text-[#D7FF43] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#080909] text-[#88A8C8] border border-[#1e252a]">
                04 BODYWEIGHT
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#D7FF43] transition-colors">
              Calisthenics Progressions
            </h3>
            <p className="text-xs text-[#88A8C8] mt-1.5 leading-relaxed">
              Progressions for Muscle-Ups, Planche, Front Lever, Handstands, L-Sits, Push-Ups & Pull-Ups.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-[#D7FF43] gap-1 group-hover:translate-x-1 transition-transform">
              <span>Explore Skill Tree</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* HYROX Conditioning Card */}
          <div
            onClick={() => onSelectTab('hyrox')}
            className={`p-6 rounded-2xl cursor-pointer transition-all border group relative overflow-hidden ${
              activeCategory === 'hyrox'
                ? 'bg-[#121618] border-[#3d471d] shadow-[0_0_20px_-5px_rgba(215,255,67,0.25)]'
                : 'bg-[#0e1113] border-[#1a1f24] hover:border-[#D7FF43]/40'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-[#222711] border border-[#3d471d] text-[#D7FF43] flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#080909] text-[#88A8C8] border border-[#1e252a]">
                05 HYROX
              </span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#D7FF43] transition-colors">
              HYROX Race Conditioning
            </h3>
            <p className="text-xs text-[#88A8C8] mt-1.5 leading-relaxed">
              All 8 functional stations, compromised running intervals, and home equipment substitutions.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-[#D7FF43] gap-1 group-hover:translate-x-1 transition-transform">
              <span>Launch HYROX Station</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. TODAY'S WORKOUT & RECENT PRs / ACTIVITY SUMMARY */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Workout Card (Col 7) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#D7FF43]" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  TODAY'S SCHEDULED WORKOUT
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222711] text-[#D7FF43] border border-[#3d471d]">
                {planName || 'Active Microcycle'}
              </span>
            </div>

            {todaySession ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white">{todaySession.training_type}</h3>
                  <div className="flex items-center gap-4 text-xs text-[#88A8C8] mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#D7FF43]" />
                      {todaySession.target_duration_mins} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-[#D7FF43]" />
                      {todaySession.target_intensity}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#D7FF43]" />
                      {todaySession.exercises?.length || 5} movements
                    </span>
                  </div>
                </div>

                {/* Exercises Preview List */}
                <div className="space-y-2 pt-2">
                  {todaySession.exercises?.slice(0, 3).map((ex, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2 rounded-xl bg-[#121618] border border-[#1e252a] flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-white">{ex.exercise_name}</span>
                      <span className="text-[#88A8C8] font-mono">
                        {ex.sets} sets × {ex.reps}
                      </span>
                    </div>
                  ))}
                  {(todaySession.exercises?.length || 0) > 3 && (
                    <div className="text-[11px] text-[#88A8C8] font-mono text-center">
                      + {(todaySession.exercises?.length || 0) - 3} additional exercises in session
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#121618] border border-[#1e252a] flex items-center justify-center mx-auto text-[#88A8C8]">
                  <Target className="w-6 h-6 text-[#D7FF43]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No Workout Configured for Today</h4>
                  <p className="text-xs text-[#88A8C8] max-w-sm mx-auto mt-1">
                    Complete your personalized onboarding or click below to generate your tailored 7-day microcycle.
                  </p>
                </div>
                <button
                  onClick={onBuildPlan}
                  className="px-4 py-2 rounded-lg bg-[#D7FF43] text-black text-xs font-bold hover:brightness-110 transition-all inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Calibrate My Training Profile
                </button>
              </div>
            )}
          </div>

          {todaySession && (
            <div className="pt-6 flex items-center gap-3 border-t border-[#1a1f24] mt-6">
              <button
                onClick={() => onSelectTab('workout-plan')}
                className="flex-1 py-2.5 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(215,255,67,0.25)]"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                Launch Today's Session
              </button>
              <button
                onClick={() => onSelectTab('gym-training')}
                className="py-2.5 px-4 rounded-xl bg-[#121618] border border-[#1e252a] hover:border-[#D7FF43]/40 text-xs font-bold text-[#88A8C8] hover:text-white transition-colors"
              >
                Custom Builder
              </button>
            </div>
          )}
        </div>

        {/* Weekly Activity & Personal Records (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Activity Summary */}
          <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D7FF43]" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  WEEKLY ACTIVITY SUMMARY
                </span>
              </div>
              <span className="text-[10px] text-[#88A8C8] font-mono">Actual Saved Records</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a]">
                <div className="text-xl font-black text-white font-mono">
                  {analytics?.total_workouts_completed ?? 0}
                </div>
                <div className="text-[10px] text-[#88A8C8] uppercase font-semibold mt-0.5">Workouts</div>
              </div>

              <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a]">
                <div className="text-xl font-black text-[#D7FF43] font-mono">
                  {analytics?.consistency_rate ? `${analytics.consistency_rate}%` : '0%'}
                </div>
                <div className="text-[10px] text-[#88A8C8] uppercase font-semibold mt-0.5">Consistency</div>
              </div>

              <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a]">
                <div className="text-xl font-black text-white font-mono">
                  {analytics?.volume_history?.length ? `${analytics.volume_history.slice(-1)[0]?.volume || 0}` : '0'}
                </div>
                <div className="text-[10px] text-[#88A8C8] uppercase font-semibold mt-0.5">Vol (kg)</div>
              </div>
            </div>
          </div>

          {/* Recent Personal Records */}
          <div className="p-6 rounded-2xl bg-[#0e1113] border border-[#1a1f24]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D7FF43]" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  RECENT PERSONAL RECORDS (1RM)
                </span>
              </div>
              <button
                onClick={() => onSelectTab('progress')}
                className="text-[11px] text-[#D7FF43] hover:underline font-mono"
              >
                View Tracker
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a]">
                <div className="text-[11px] text-[#88A8C8]">Bench Press</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {analytics?.personal_records?.bench_press_1rm ? `${analytics.personal_records.bench_press_1rm} kg` : '—'}
                </div>
                <div className="text-[9px] text-[#88A8C8]/70">Epley formula</div>
              </div>

              <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a]">
                <div className="text-[11px] text-[#88A8C8]">Back Squat</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {analytics?.personal_records?.squat_1rm ? `${analytics.personal_records.squat_1rm} kg` : '—'}
                </div>
                <div className="text-[9px] text-[#88A8C8]/70">Epley formula</div>
              </div>

              <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a]">
                <div className="text-[11px] text-[#88A8C8]">Deadlift</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {analytics?.personal_records?.deadlift_1rm ? `${analytics.personal_records.deadlift_1rm} kg` : '—'}
                </div>
                <div className="text-[9px] text-[#88A8C8]/70">Epley formula</div>
              </div>

              <div className="p-3 rounded-xl bg-[#121618] border border-[#1e252a]">
                <div className="text-[11px] text-[#88A8C8]">5K Threshold</div>
                <div className="text-lg font-black text-white font-mono mt-0.5">
                  {analytics?.personal_records?.running_5k_mins || '—'}
                </div>
                <div className="text-[9px] text-[#88A8C8]/70">Timed test</div>
              </div>
            </div>

            {!analytics?.personal_records?.bench_press_1rm && (
              <p className="text-[11px] text-[#88A8C8] mt-3 italic text-center">
                No personal records logged yet. Complete a workout session to set your first PR!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION BANNER */}
      <section className="p-8 sm:p-12 rounded-3xl bg-[#0e1113] border border-[#3d471d] shadow-[0_0_30px_-10px_rgba(215,255,67,0.2)] text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#222711] border border-[#3d471d] text-xs font-mono font-bold text-[#D7FF43]">
            <Sparkles className="w-3.5 h-3.5" />
            READY FOR SCIENTIFIC PROGRESSION
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Transform Your Fitness with Closed-Loop Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-[#88A8C8] leading-relaxed">
            From progressive overload algorithms to Indian nutritional partitioning and HYROX simulations, KRIDA puts sports science into practice.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onBuildPlan}
              className="px-6 py-3 rounded-xl bg-[#D7FF43] hover:brightness-110 text-black text-xs sm:text-sm font-extrabold transition-all shadow-[0_0_15px_rgba(215,255,67,0.3)]"
            >
              Generate My Workout Plan
            </button>
            <button
              onClick={() => onSelectTab('aicoach')}
              className="px-5 py-3 rounded-xl bg-[#121618] hover:bg-[#1a1f22] text-white text-xs sm:text-sm font-bold border border-[#1e252a] transition-colors"
            >
              Ask AI Fitness Coach
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
