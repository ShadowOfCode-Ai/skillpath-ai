/**
 * @file AppShell.tsx
 * Design-token compliant application shell with desktop sidebar (collapsible 256px to 72px),
 * responsive header, journey stepper, mobile bottom tabs & drawer, and theme toggling.
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  FileText,
  Award,
  Sparkles,
  TrendingUp,
  Compass,
  Briefcase,
  FileCheck2,
  Settings,
  ShieldCheck,
  Moon,
  Sun,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowRight,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JourneyStepper } from '../common/SharedComponents';

// Inline-SVG mark: Path joining three nodes
export function LogoMark({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#111A2E" />
      <path d="M8 22L16 10L24 18" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="22" r="3" fill="#2563EB" />
      <circle cx="16" cy="10" r="3.5" fill="#38BDF8" />
      <circle cx="24" cy="18" r="3" fill="#34D399" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isDemoUser, isAdmin, profile, logout, theme, toggleTheme, resume, assessmentHistory } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Compute Next Best Action based on real user state
  const nextAction = React.useMemo(() => {
    if (!resume || resume.detectedSkills.length === 0) {
      return { label: 'Upload Resume', path: '/resume' };
    }
    const assessedCount = Object.keys(assessmentHistory).length;
    if (assessedCount === 0) {
      return { label: 'Verify Skills', path: '/assessment' };
    }
    return { label: 'View Roadmap', path: '/roadmap' };
  }, [resume, assessmentHistory]);

  // Determine current page title and category
  const currentPath = location.pathname;
  let pageTitle = 'Dashboard';
  let journeyStepId: string | null = null;

  if (currentPath === '/profile') {
    pageTitle = 'Profile & Target Role';
    journeyStepId = 'profile';
  } else if (currentPath === '/resume') {
    pageTitle = 'Resume & Skill Extraction';
    journeyStepId = 'resume';
  } else if (currentPath === '/skills') {
    pageTitle = 'Skill Passport';
    journeyStepId = 'skills';
  } else if (currentPath.startsWith('/assessment')) {
    pageTitle = 'Skill Verification Assessment';
    journeyStepId = 'assess';
  } else if (currentPath === '/careers' || currentPath.startsWith('/careers/')) {
    pageTitle = 'Career Recommendations & Gaps';
    journeyStepId = 'careers';
  } else if (currentPath === '/roadmap') {
    pageTitle = 'Personalized Learning Roadmap';
    journeyStepId = 'roadmap';
  } else if (currentPath === '/opportunities') {
    pageTitle = 'Matched Internships & Fresher Jobs';
    journeyStepId = 'matches';
  } else if (currentPath === '/report') {
    pageTitle = 'Verification Report';
  } else if (currentPath === '/settings') {
    pageTitle = 'Account & Privacy Settings';
  } else if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    pageTitle = 'Admin Console & System Check';
  }

  const journeyNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/profile', icon: UserCheck },
    { name: 'Resume', path: '/resume', icon: FileText },
    { name: 'Skill Passport', path: '/skills', icon: Award },
    { name: 'Assessment', path: '/assessment', icon: Sparkles },
    { name: 'Careers', path: '/careers', icon: TrendingUp },
    { name: 'Roadmap', path: '/roadmap', icon: Compass },
    { name: 'Opportunities', path: '/opportunities', icon: Briefcase },
  ];

  const accountNav = [
    { name: 'Verification Report', path: '/report', icon: FileCheck2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const adminNav = [
    { name: 'Admin Console', path: '/admin', icon: ShieldCheck },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && currentPath === '/dashboard') return true;
    if (path !== '/dashboard' && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar: 256px collapsible to 72px */}
        <aside
          className={`no-print hidden md:flex flex-col border-r border-app bg-surface transition-all duration-300 select-none z-30 ${
            sidebarCollapsed ? 'w-[72px]' : 'w-64'
          }`}
        >
          {/* Logo & Brand Wordmark */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-app">
            <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
              <LogoMark className="w-8 h-8 shrink-0" />
              {!sidebarCollapsed && (
                <div className="flex flex-col leading-tight">
                  <span className="font-extrabold text-base tracking-tight text-main font-heading">
                    SkillPath <span className="text-brand-accent">AI</span>
                  </span>
                  <span className="text-[10px] text-muted tracking-wide">Skill Verification</span>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-sub hover:text-main hover:bg-raised transition-colors focus:outline-none"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {/* Journey Group */}
            <div>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2 text-[11px] font-bold text-muted uppercase tracking-wider">
                  Journey
                </div>
              )}
              <div className="space-y-1">
                {journeyNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                        active
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-sub hover:text-main hover:bg-raised'
                      } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Account Group */}
            <div>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2 text-[11px] font-bold text-muted uppercase tracking-wider">
                  Account
                </div>
              )}
              <div className="space-y-1">
                {accountNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                        active
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-sub hover:text-main hover:bg-raised'
                      } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Admin Group (Admins only) */}
            {isAdmin && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-3 mb-2 text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Admin</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 font-bold">
                      Staff
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  {adminNav.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={sidebarCollapsed ? item.name : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                          active
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-amber-400 hover:text-amber-200 hover:bg-amber-500/10'
                        } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Card at Bottom */}
          <div className="p-3 border-t border-app">
            <div className={`flex items-center gap-3 p-2 rounded-xl bg-raised border border-app ${sidebarCollapsed ? 'justify-center p-2' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-brand/20 text-brand-accent flex items-center justify-center font-bold text-xs shrink-0">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="text-xs font-bold text-main truncate">{profile.name}</div>
                  <div className="text-[10px] text-muted truncate">
                    {isDemoUser ? 'Sample Candidate' : profile.email || 'Authenticated User'}
                  </div>
                </div>
              )}
              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={logout}
                  className="text-sub hover:text-red-400 p-1 rounded-lg focus:outline-none transition-colors"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar */}
          <header className="no-print h-16 border-b border-app bg-surface/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden p-2 rounded-xl text-sub hover:text-main hover:bg-raised focus:outline-none"
                aria-label="Open navigation drawer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-base sm:text-lg font-bold text-main tracking-tight truncate font-heading">
                  {pageTitle}
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted">
                  <Link to="/dashboard" className="hover:text-brand-accent transition-colors">
                    SkillPath
                  </Link>
                  <span>/</span>
                  <span className="text-sub truncate">{pageTitle}</span>
                </div>
              </div>
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center gap-2.5">
              {/* Primary Next Best Action Button */}
              <button
                type="button"
                onClick={() => navigate(nextAction.path)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-hover shadow-sm transition-all duration-150"
              >
                <span>{nextAction.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-app text-sub hover:text-main hover:bg-raised transition-colors focus:outline-none"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              </button>

              {/* Avatar Link to Settings */}
              <Link
                to="/settings"
                className="w-9 h-9 rounded-xl border border-app bg-raised flex items-center justify-center text-xs font-bold text-brand-accent hover:border-brand/40 transition-colors"
                title="Account Settings"
                aria-label="Account Settings"
              >
                <User className="w-4 h-4" />
              </Link>
            </div>
          </header>

          {/* Journey Stepper on relevant journey pages */}
          {journeyStepId && (
            <div className="no-print bg-surface/50 border-b border-app px-4 sm:px-6">
              <div className="max-w-7xl mx-auto">
                <JourneyStepper currentStepId={journeyStepId} />
              </div>
            </div>
          )}

          {/* Page Body Viewport */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
            {children}
          </main>

          {/* Consistent Footer */}
          <footer className="no-print border-t border-app py-6 px-4 sm:px-6 bg-surface/40 text-center text-xs text-muted">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LogoMark className="w-5 h-5 opacity-70" />
                <span className="font-semibold text-sub">SkillPath AI</span>
                <span>•</span>
                <span>Version 2.0.0</span>
              </div>
              <p className="text-[11px] max-w-xl text-muted leading-relaxed">
                Verification reflects deterministic performance on SkillPath assessments and verified resume text. It is not a formal academic certification or accredited degree.
              </p>
              <div className="flex items-center gap-3 text-xs">
                <Link to="/how-scoring-works" className="hover:text-brand-accent transition-colors">
                  How Scoring Works
                </Link>
                <span>•</span>
                <Link to="/privacy" className="hover:text-brand-accent transition-colors">
                  Privacy
                </Link>
                <span>•</span>
                <Link to="/terms" className="hover:text-brand-accent transition-colors">
                  Terms
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (Dashboard, Skills, Careers, Opportunities, More) */}
      <nav className="no-print md:hidden border-t border-app bg-surface sticky bottom-0 z-30 flex items-center justify-around h-16 px-1">
        {[
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Skills', path: '/skills', icon: Award },
          { name: 'Careers', path: '/careers', icon: TrendingUp },
          { name: 'Matches', path: '/opportunities', icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold transition-colors ${
                active ? 'text-brand-accent' : 'text-sub hover:text-main'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-semibold text-sub hover:text-main focus:outline-none"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85%] bg-surface border-r border-app p-4 flex flex-col z-10">
            <div className="flex items-center justify-between pb-4 border-b border-app mb-4">
              <div className="flex items-center gap-2">
                <LogoMark className="w-7 h-7" />
                <span className="font-extrabold text-base text-main">SkillPath AI</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-sub hover:text-main focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="space-y-1">
                {journeyNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm ${
                        isActive(item.path) ? 'bg-brand text-white' : 'text-sub hover:text-main'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-app space-y-1">
                {accountNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-sub hover:text-main"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-amber-500 hover:text-amber-400"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Console</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-app">
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-app text-red-400 font-semibold text-xs hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
