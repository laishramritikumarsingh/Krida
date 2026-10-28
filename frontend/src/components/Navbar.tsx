import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Dumbbell, BarChart3, Utensils, Trophy, HeartPulse, MessageSquare, BookOpen, User as UserIcon, LogOut, Menu, X, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  openOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  openAuthModal,
  openOnboarding,
}) => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loggedInLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'nutrition', label: 'Nutrition', icon: Utensils },
    { id: 'sports', label: 'Sports', icon: Trophy },
    { id: 'recovery', label: 'Recovery', icon: HeartPulse },
    { id: 'exercises', label: 'Exercises', icon: BookOpen },
    { id: 'aicoach', label: 'AI Coach', icon: MessageSquare },
  ];

  const loggedOutLinks = [
    { id: 'home', label: 'Home' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'features', label: 'Features' },
    { id: 'sports-preview', label: 'Sports' },
    { id: 'ai-preview', label: 'AI Coach' },
  ];

  const handleNavClick = (id: string) => {
    setCurrentTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick(isAuthenticated ? 'dashboard' : 'home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-lime-400 p-[1.5px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-wider text-white flex items-center">
              KRIDA
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1.5 shadow-[0_0_8px_#22c55e]" />
            </div>
            <div className="text-[10px] font-semibold text-zinc-400 tracking-widest uppercase -mt-1 hidden sm:block">
              AI Fitness & Sports
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {isAuthenticated ? (
            loggedInLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })
          ) : (
            loggedOutLinks.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })
          )}
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.is_demo && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Demo Mode
                </span>
              )}
              <button
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-emerald-500/40 text-sm text-zinc-200 hover:text-white transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span>{user?.username || 'Athlete'}</span>
              </button>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-xl bg-zinc-900/80 border border-white/10 hover:border-red-500/40 hover:text-red-400 text-zinc-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* One-Click Demo Mode Button */}
              <button
                onClick={demoLogin}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold tracking-wide transition-all duration-200 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Try Instant Demo
              </button>
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Log In
              </button>
              <button
                onClick={openOnboarding}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black font-bold text-sm tracking-wide shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Build My Plan
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {!isAuthenticated && (
            <button
              onClick={demoLogin}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
            >
              Demo
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-white/10 px-4 pt-3 pb-6 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase">Athlete Portal</div>
              {loggedInLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">{user?.username}</span>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 text-xs text-red-400 font-medium px-3 py-1.5 rounded-lg bg-red-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <>
              {loggedOutLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-emerald-400"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-3 space-y-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 text-zinc-200 text-sm font-medium"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openOnboarding();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 text-black font-bold text-sm"
                >
                  Build My Plan
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
