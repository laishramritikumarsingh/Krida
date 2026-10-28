import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Menu,
  Zap,
  ArrowRight,
  HeartPulse,
  Flame
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { RecommendationItem } from '../types';

interface TopBarProps {
  currentTab: string;
  onNavigateTab: (tabId: string) => void;
  onOpenMobileMenu: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenOnboarding: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onNavigateTab,
  onOpenMobileMenu,
  onOpenAuth,
  onOpenOnboarding,
}) => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ id: string; title: string; category: string }[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<RecommendationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(2);
  const [aiEngineStatus, setAiEngineStatus] = useState<string>('Online');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Quick nav index for search
  const searchableItems = [
    { id: 'home', title: '01 Home & Hero Overview', category: 'Page' },
    { id: 'dashboard', title: '02 Dashboard & Training Volume', category: 'Page' },
    { id: 'gym-training', title: '03 Gym Training & Active Session', category: 'Page' },
    { id: 'calisthenics', title: '04 Calisthenics & Gymnastic Progressions', category: 'Page' },
    { id: 'hyrox', title: '05 HYROX Conditioning & 8 Stations', category: 'Page' },
    { id: 'workout-plan', title: '06 AI Workout Plan Generator', category: 'Page' },
    { id: 'nutrition', title: '07 Diet & Nutrition Tracker (Indian Foods)', category: 'Page' },
    { id: 'progress', title: '08 Progress Tracker & 1RM Trends', category: 'Page' },
    { id: 'progressive-overload', title: '09 Progressive Overload Double Progression', category: 'Page' },
    { id: 'aicoach', title: '10 AI Fitness Coach Chatbot', category: 'Page' },
    { id: 'equipment-finder', title: '11 Equipment Finder & Exercise Catalog', category: 'Page' },
    { id: 'reports-goals', title: '12 Reports, Goals & CSV Export', category: 'Page' },
    // Popular exercises
    { id: 'gym-training', title: 'Barbell Bench Press', category: 'Exercise' },
    { id: 'gym-training', title: 'Barbell Back Squat', category: 'Exercise' },
    { id: 'gym-training', title: 'Barbell Romanian Deadlift', category: 'Exercise' },
    { id: 'calisthenics', title: 'Strict Bar Muscle-Up', category: 'Skill' },
    { id: 'calisthenics', title: 'Full Front Lever Hold', category: 'Skill' },
    { id: 'hyrox', title: 'Sled Push & Compromised Running', category: 'HYROX' },
    { id: 'nutrition', title: 'Indian High-Protein Meal Plan', category: 'Diet' },
  ];

  // Fetch recommendations for notifications
  useEffect(() => {
    if (isAuthenticated) {
      api.recommendations.getAll()
        .then((res) => {
          if (res?.recommendations) {
            setNotifications(res.recommendations);
            setUnreadCount(res.recommendations.length);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Handle search input
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const cleanQ = q.toLowerCase();
    const matches = searchableItems.filter(
      (item) => item.title.toLowerCase().includes(cleanQ) || item.category.toLowerCase().includes(cleanQ)
    );
    setSearchResults(matches);
    setIsSearchOpen(true);
  };

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#080909]/90 backdrop-blur-md border-b border-[#1a1f24] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & current active section indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-[#121618] border border-[#1e252a] text-[#88A8C8] hover:text-white"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#88A8C8]">
          <span className="w-2 h-2 rounded-full bg-[#D7FF43] shadow-[0_0_8px_#D7FF43] inline-block animate-pulse" />
          <span className="text-white font-bold tracking-wider uppercase">KRIDA ENGINE</span>
          <span className="text-[#3d471d]">•</span>
          <span className="text-[#D7FF43] capitalize">{currentTab.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Middle: Universal Search & Quick Jump */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#88A8C8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search exercises, skills, HYROX stations, diet..."
            className="w-full bg-[#121618] border border-[#1e252a] focus:border-[#D7FF43]/50 rounded-xl pl-10 pr-12 py-1.5 text-xs text-white placeholder-[#88A8C8]/60 focus:outline-none transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#080909] border border-[#1e252a] text-[10px] text-[#88A8C8] font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#121618] border border-[#1e252a] rounded-xl shadow-2xl py-2 z-50 max-h-72 overflow-y-auto">
            <div className="px-3 py-1 text-[10px] font-mono uppercase text-[#88A8C8] font-bold">
              Matching Capabilities & Exercises ({searchResults.length})
            </div>
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onNavigateTab(item.id);
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="w-full px-3 py-2 text-left hover:bg-[#222711] flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white group-hover:text-[#D7FF43] font-medium">
                    {item.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#080909] text-[#88A8C8] border border-[#1e252a]">
                  {item.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: AI Status, Notifications, Primary Action & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* AI Status Badge */}
        <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#222711] border border-[#3d471d] text-[11px] font-mono font-bold text-[#D7FF43]">
          <Sparkles className="w-3 h-3 text-[#D7FF43]" />
          <span>AI Active</span>
        </div>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-lg bg-[#121618] border border-[#1e252a] text-[#88A8C8] hover:text-white transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D7FF43] text-black text-[10px] font-bold font-mono flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#121618] border border-[#1e252a] rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e252a]">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#D7FF43]" />
                  Adaptive Overload & Readiness
                </span>
                <span className="text-[10px] text-[#88A8C8]">Live</span>
              </div>

              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onNavigateTab('progressive-overload');
                        setIsNotificationsOpen(false);
                      }}
                      className="p-2 rounded-lg bg-[#080909] border border-[#1e252a] hover:border-[#D7FF43]/40 cursor-pointer transition-colors"
                    >
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF43]" />
                        {n.title}
                      </div>
                      <p className="text-[11px] text-[#88A8C8] mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-[#88A8C8]">
                    No unread training alerts. Log a session to trigger progressive overload!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear Primary Action CTA */}
        <button
          onClick={() => onNavigateTab('workout-plan')}
          className="px-3.5 py-1.5 rounded-lg bg-[#D7FF43] hover:brightness-110 text-black text-xs font-extrabold transition-all shadow-[0_0_12px_rgba(215,255,67,0.3)] flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Generate</span> Workout
        </button>

        {/* Profile Avatar / Menu */}
        <div ref={profileRef} className="relative">
          {isAuthenticated ? (
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-lg bg-[#121618] border border-[#1e252a] hover:border-[#D7FF43]/40 transition-colors"
            >
              <div className="w-6 h-6 rounded-md bg-[#222711] border border-[#3d471d] text-[#D7FF43] flex items-center justify-center text-xs font-bold font-mono">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-bold text-white hidden md:inline truncate max-w-[90px]">
                {user?.username || 'Athlete'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#88A8C8]" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 rounded-lg bg-[#121618] border border-[#1e252a] text-xs font-semibold text-[#88A8C8] hover:text-white transition-colors"
              >
                Log In
              </button>
              <button
                onClick={demoLogin}
                className="px-2.5 py-1.5 rounded-lg bg-[#222711] border border-[#3d471d] text-[#D7FF43] text-xs font-bold font-mono"
              >
                Demo
              </button>
            </div>
          )}

          {/* Profile Dropdown */}
          {isProfileOpen && isAuthenticated && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[#121618] border border-[#1e252a] rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 py-2 border-b border-[#1e252a]">
                <div className="text-xs font-bold text-white truncate">{user?.username}</div>
                <div className="text-[10px] text-[#88A8C8] font-mono truncate">{user?.email}</div>
                {user?.is_demo && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-[#222711] border border-[#3d471d] text-[9px] text-[#D7FF43] font-mono font-bold">
                    Demo Account
                  </span>
                )}
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigateTab('profile');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#88A8C8] hover:text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#D7FF43]" />
                  Athlete Profile
                </button>
                <button
                  onClick={() => {
                    onNavigateTab('reports-goals');
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#88A8C8] hover:text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-[#D7FF43]" />
                  Status & Goals
                </button>
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-[#88A8C8] hover:text-white hover:bg-white/5 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D7FF43]" />
                  Recalibrate Plan
                </button>
              </div>

              <div className="pt-1 border-t border-[#1e252a]">
                <button
                  onClick={() => {
                    logout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
