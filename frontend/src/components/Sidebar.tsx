import React from 'react';
import {
  Home,
  LayoutDashboard,
  Dumbbell,
  Zap,
  Trophy,
  Calendar,
  UtensilsCrossed,
  LineChart,
  ArrowUpRight,
  Bot,
  Search,
  HeartPulse,
  Sparkles,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenOnboarding: () => void;
}

export const NAV_ITEMS = [
  { id: 'home', num: '01', label: 'Home', icon: Home },
  { id: 'dashboard', num: '02', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gym-training', num: '03', label: 'Gym Training', icon: Dumbbell },
  { id: 'calisthenics', num: '04', label: 'Calisthenics', icon: Zap },
  { id: 'hyrox', num: '05', label: 'HYROX Training', icon: Trophy },
  { id: 'workout-plan', num: '06', label: 'AI Workout Plan', icon: Calendar },
  { id: 'nutrition', num: '07', label: 'Diet & Nutrition', icon: UtensilsCrossed },
  { id: 'progress', num: '08', label: 'Progress Tracker', icon: LineChart },
  { id: 'progressive-overload', num: '09', label: 'Progressive Overload', icon: ArrowUpRight },
  { id: 'aicoach', num: '10', label: 'AI Fitness Coach', icon: Bot },
  { id: 'equipment-finder', num: '11', label: 'Equipment Finder', icon: Search },
  { id: 'reports-goals', num: '12', label: 'Reports & Goals', icon: HeartPulse },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenAuth,
  onOpenOnboarding,
}) => {
  const { user, isAuthenticated, logout, demoLogin } = useAuth();

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="w-[280px] h-full bg-[#080909] border-r border-[#1a1f24] flex flex-col justify-between select-none">
      {/* Top Header / Branding (px-6 ~ 24px) */}
      <div>
        <div className="px-6 pt-7 pb-6 border-b border-[#151a1e]">
          <div className="flex items-center justify-between">
            <div
              onClick={() => handleNavClick('home')}
              className="cursor-pointer group flex items-center gap-2.5"
            >
              <div className="flex items-center">
                <span className="text-[22px] font-black tracking-tight text-white font-sans">
                  KRIDA
                </span>
                <span className="text-[22px] font-black tracking-tight text-[#D7FF43] ml-1.5 font-sans">
                  AI
                </span>
                {/* Glowing neon-lime dot */}
                <span className="w-2 h-2 rounded-full bg-[#D7FF43] ml-2 shadow-[0_0_8px_#D7FF43] inline-block" />
              </div>
            </div>

            {/* Close button for mobile drawer */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-[#88A8C8] hover:text-white hover:bg-white/5"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle in uppercase letter-spaced text */}
          <div className="mt-1.5 text-[10px] font-bold text-[#88A8C8] tracking-[0.2em] uppercase font-mono">
            INTELLIGENT FITNESS PLATFORM
          </div>
        </div>

        {/* Numbered Navigation Items: 01 to 12 */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full relative flex items-center px-4 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#222711] border border-[#3d471d] shadow-[0_0_15px_-4px_rgba(215,255,67,0.25)]'
                    : 'bg-transparent border border-transparent hover:bg-white/[0.04]'
                }`}
              >
                {/* Active neon-green vertical bar indicator on left edge */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-md bg-[#D7FF43] shadow-[0_0_10px_#D7FF43]" />
                )}

                {/* 2-Digit Number */}
                <span
                  className={`font-mono text-xs font-semibold mr-3.5 tracking-wider transition-colors ${
                    isActive
                      ? 'text-[#D7FF43] font-bold'
                      : 'text-[#88A8C8]/70 group-hover:text-white'
                  }`}
                >
                  {item.num}
                </span>

                {/* Icon */}
                <Icon
                  className={`w-4 h-4 mr-3 shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#D7FF43]'
                      : 'text-[#88A8C8] group-hover:text-white'
                  }`}
                />

                {/* Label */}
                <span
                  className={`text-[13.5px] font-medium tracking-tight truncate transition-colors ${
                    isActive
                      ? 'text-[#D7FF43] font-semibold'
                      : 'text-[#88A8C8] group-hover:text-white'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile / Auth Drawer Action */}
      <div className="p-4 border-t border-[#151a1e] bg-[#080909]">
        {isAuthenticated ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-lg bg-[#222711] border border-[#3d471d] text-[#D7FF43] flex items-center justify-center text-xs font-bold font-mono">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.username || 'Athlete'}
                  </div>
                  {user?.is_demo && (
                    <span className="text-[10px] text-[#D7FF43] font-mono">
                      Demo Account
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 rounded-lg text-[#88A8C8] hover:text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => handleNavClick('reports-goals')}
              className="w-full py-2 px-3 rounded-lg bg-[#121618] border border-[#1e252a] hover:border-[#D7FF43]/40 text-xs font-semibold text-[#88A8C8] hover:text-white transition-all flex items-center justify-center gap-1.5"
            >
              <HeartPulse className="w-3.5 h-3.5 text-[#D7FF43]" />
              Status & Goals
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={demoLogin}
              className="w-full py-2.5 px-3 rounded-lg bg-[#222711] hover:bg-[#2b3216] border border-[#3d471d] text-[#D7FF43] text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_-3px_rgba(215,255,67,0.3)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D7FF43]" />
              Try Instant Demo
            </button>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  onOpenAuth('login');
                  onCloseMobile();
                }}
                className="py-1.5 rounded-lg bg-[#121618] border border-[#1e252a] text-xs font-semibold text-[#88A8C8] hover:text-white transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  onOpenOnboarding();
                  onCloseMobile();
                }}
                className="py-1.5 rounded-lg bg-[#D7FF43] text-black text-xs font-extrabold hover:brightness-110 transition-all shadow-[0_0_8px_rgba(215,255,67,0.25)]"
              >
                Build Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar (280px) */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 w-[280px]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
