import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { GymTrainingPage } from './pages/GymTrainingPage';
import { CalisthenicsPage } from './pages/CalisthenicsPage';
import { HyroxPage } from './pages/HyroxPage';
import { WorkoutPage } from './pages/WorkoutPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProgressiveOverloadPage } from './pages/ProgressiveOverloadPage';
import { NutritionPage } from './pages/NutritionPage';
import { AiCoachPage } from './pages/AiCoachPage';
import { ExerciseLibraryPage } from './pages/ExerciseLibraryPage';
import { ReportsGoalsPage } from './pages/ReportsGoalsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SportsPage } from './pages/SportsPage';

import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ActiveWorkoutModal } from './components/ActiveWorkoutModal';
import { ExerciseReplaceModal } from './components/ExerciseReplaceModal';
import { RecoveryCheckinModal } from './components/RecoveryCheckinModal';

import { WorkoutSession } from './types';
import { Menu, Sparkles, User, LogIn } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading, demoLogin, authError, clearAuthError } = useAuth();
  const getTabFromHash = (): string => {
    if (typeof window === 'undefined') return '';
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    const validTabs = [
      'home', 'dashboard', 'gym-training', 'calisthenics', 'hyrox',
      'workout-plan', 'nutrition', 'progress', 'progressive-overload',
      'aicoach', 'equipment-finder', 'reports-goals', 'profile', 'sports'
    ];
    if (validTabs.includes(hash)) return hash;
    if (hash === 'workouts') return 'workout-plan';
    if (hash === 'exercises') return 'equipment-finder';
    if (hash === 'recovery') return 'reports-goals';
    return '';
  };

  const [currentTab, setCurrentTab] = useState<string>(() => {
    return getTabFromHash() || 'home';
  });
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [loadTimedOut, setLoadTimedOut] = useState<boolean>(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadTimedOut(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setLoadTimedOut(false);
    }
  }, [isLoading]);

  const navigateTab = (tabId: string) => {
    setCurrentTab(tabId);
    if (typeof window !== 'undefined') {
      window.location.hash = `#/${tabId}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sync hash changes (back/forward browser navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      if (tab && tab !== currentTab) {
        setCurrentTab(tab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentTab]);

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [activeWorkoutSession, setActiveWorkoutSession] = useState<WorkoutSession | null>(null);
  const [replaceModalData, setReplaceModalData] = useState<{
    sessionId: number;
    exerciseName: string;
  } | null>(null);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);

  // When user becomes authenticated while on landing page and no explicit hash was chosen, move to dashboard
  useEffect(() => {
    if (isAuthenticated && (currentTab === 'home' || !window.location.hash)) {
      navigateTab('dashboard');
    }
  }, [isAuthenticated]);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleStartWorkout = (session: WorkoutSession) => {
    setActiveWorkoutSession(session);
  };

  const handleOpenReplaceModal = (session: WorkoutSession, exerciseName: string) => {
    setReplaceModalData({
      sessionId: session.id,
      exerciseName,
    });
  };

  // Map legacy / alternate tab ids
  const activeTabNormalized = (() => {
    if (currentTab === 'workouts') return 'workout-plan';
    if (currentTab === 'exercises') return 'equipment-finder';
    if (currentTab === 'recovery') return 'reports-goals';
    return currentTab;
  })();

  if (isLoading && !loadTimedOut) {
    return (
      <div className="min-h-screen bg-[#080909] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#D7FF43] border-t-transparent animate-spin" />
        <div className="text-xs font-mono font-bold text-[#88A8C8] tracking-wider uppercase">
          Initializing KRIDA Engine...
        </div>
      </div>
    );
  }

  if (isLoading && loadTimedOut) {
    return (
      <div className="min-h-screen bg-[#080909] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#121618] border border-[#3d471d] rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(215,255,67,0.1)]">
          <div className="text-2xl font-black text-white">
            KRIDA <span className="text-[#D7FF43]">AI</span>
          </div>
          <div className="text-[11px] font-mono text-[#88A8C8] tracking-widest uppercase mt-1">
            Engine Synchronization Notice
          </div>
          <p className="text-sm text-[#88A8C8] mt-4 leading-relaxed">
            Initialization is taking longer than expected. You can launch immediately into the platform or reload.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => setLoadTimedOut(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#D7FF43] text-[#080909] font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer"
            >
              Continue to App
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080909] text-white flex flex-col font-sans selection:bg-[#D7FF43] selection:text-black">
      {/* 280px Left Sidebar (Desktop Fixed + Mobile Drawer) */}
      <Sidebar
        currentTab={activeTabNormalized}
        onSelectTab={navigateTab}
        isOpenMobile={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onOpenAuth={handleOpenAuth}
        onOpenOnboarding={() => setOnboardingOpen(true)}
      />

      {/* Main Content Area - Offset 280px on desktop to sit to the right of fixed sidebar */}
      <div className="lg:pl-[280px] flex-1 flex flex-col min-w-0">
        {/* Universal Top Bar for Main Workspace */}
        <TopBar
          currentTab={activeTabNormalized}
          onNavigateTab={navigateTab}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenAuth={handleOpenAuth}
          onOpenOnboarding={() => setOnboardingOpen(true)}
        />

        {/* Global Auth Alert Notice */}
        {authError && (
          <div className="bg-[#1e1515] border-b border-red-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>{authError}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  clearAuthError();
                  demoLogin().catch(() => {});
                }}
                className="underline hover:text-white font-bold cursor-pointer"
              >
                Launch Demo
              </button>
              <button
                onClick={clearAuthError}
                className="text-red-400 hover:text-white font-bold cursor-pointer ml-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* View Router */}
        <main className="flex-1 w-full">
          {/* 01 Home */}
          {activeTabNormalized === 'home' && (
            <LandingPage
              onBuildPlan={() => setOnboardingOpen(true)}
              onExplore={() => {
                if (isAuthenticated) navigateTab('dashboard');
                else navigateTab('gym-training');
              }}
              onSelectTab={navigateTab}
            />
          )}

          {/* 02 Dashboard */}
          {activeTabNormalized === 'dashboard' && (
            <DashboardPage
              onStartWorkout={handleStartWorkout}
              onNavigateTab={navigateTab}
              onOpenRecoveryModal={() => setRecoveryModalOpen(true)}
              onOpenAuth={handleOpenAuth}
            />
          )}

          {/* 03 Gym Training */}
          {activeTabNormalized === 'gym-training' && (
            <GymTrainingPage onStartSession={handleStartWorkout} />
          )}

          {/* 04 Calisthenics */}
          {activeTabNormalized === 'calisthenics' && (
            <CalisthenicsPage onOpenAuth={handleOpenAuth} />
          )}

          {/* 05 HYROX Training */}
          {activeTabNormalized === 'hyrox' && (
            <HyroxPage />
          )}

          {/* 06 AI Workout Plan */}
          {activeTabNormalized === 'workout-plan' && (
            <WorkoutPage
              onStartSession={handleStartWorkout}
              onReplaceExercise={(sess, ex) => handleOpenReplaceModal(sess, ex)}
              onOpenOnboarding={() => setOnboardingOpen(true)}
            />
          )}

          {/* 07 Diet & Nutrition */}
          {activeTabNormalized === 'nutrition' && (
            <NutritionPage />
          )}

          {/* 08 Progress Tracker */}
          {activeTabNormalized === 'progress' && (
            <ProgressPage />
          )}

          {/* 09 Progressive Overload */}
          {activeTabNormalized === 'progressive-overload' && (
            <ProgressiveOverloadPage />
          )}

          {/* 10 AI Fitness Coach */}
          {activeTabNormalized === 'aicoach' && (
            <AiCoachPage />
          )}

          {/* 11 Equipment Finder */}
          {activeTabNormalized === 'equipment-finder' && (
            <ExerciseLibraryPage />
          )}

          {/* 12 Reports & Goals */}
          {activeTabNormalized === 'reports-goals' && (
            <ReportsGoalsPage onOpenCheckin={() => setRecoveryModalOpen(true)} />
          )}

          {/* Additional pages */}
          {activeTabNormalized === 'profile' && (
            <ProfilePage />
          )}

          {activeTabNormalized === 'sports' && (
            <SportsPage />
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onSuccess={() => {
          setCurrentTab('dashboard');
        }}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => {
          setCurrentTab('dashboard');
        }}
      />

      {activeWorkoutSession && (
        <ActiveWorkoutModal
          isOpen={!!activeWorkoutSession}
          onClose={() => setActiveWorkoutSession(null)}
          session={activeWorkoutSession}
          onExerciseReplaceClick={(exName) => {
            setReplaceModalData({
              sessionId: activeWorkoutSession.id,
              exerciseName: exName,
            });
          }}
          onWorkoutCompleted={() => {
            // refreshed
          }}
        />
      )}

      {replaceModalData && (
        <ExerciseReplaceModal
          isOpen={!!replaceModalData}
          onClose={() => setReplaceModalData(null)}
          workoutSessionId={replaceModalData.sessionId}
          currentExerciseName={replaceModalData.exerciseName}
          onReplacementApplied={() => {
            setReplaceModalData(null);
          }}
        />
      )}

      <RecoveryCheckinModal
        isOpen={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        onCheckinComplete={() => {
          // refreshed
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
