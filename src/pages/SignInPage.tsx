/**
 * @file SignInPage.tsx
 * Authentication screen supporting Google Sign-In and simulated instant demo evaluation.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Sparkles, User, ArrowRight, ShieldAlert } from 'lucide-react';
import { LogoMark } from '../components/layout/AppShell';
import { useApp } from '../context/AppContext';

export function SignInPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginAsDemoUser, loginAsAdminDemo } = useApp();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    loginAsDemoUser();
    navigate('/dashboard');
  };

  const handleAdminSignIn = () => {
    loginAsAdminDemo();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <LogoMark className="w-10 h-10" />
            <span className="font-extrabold text-2xl tracking-tight text-main font-heading">
              SkillPath <span className="text-brand-accent">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-main font-heading">Welcome to SkillPath</h1>
          <p className="text-xs text-sub">Sign in to verify your skills and access tailored career paths.</p>
        </div>

        {/* Authentication Card */}
        <div className="card-elevated p-6 sm:p-8 space-y-4 bg-surface border-app">
          {/* Primary Action: Google Sign In */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl border border-app bg-raised hover:bg-surface font-semibold text-sm text-main shadow-sm hover:border-brand/40 transition-all focus:outline-none"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-app w-full" />
            <span className="bg-surface px-3 text-[11px] uppercase tracking-wider text-muted font-semibold">
              Or Instant Preview
            </span>
            <div className="border-t border-app w-full" />
          </div>

          {/* Golden Path Demo Candidate Button */}
          <button
            type="button"
            onClick={handleDemoSignIn}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover shadow-md transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>Explore as Priya Sharma (Demo)</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Admin Demo Button */}
          <button
            type="button"
            onClick={handleAdminSignIn}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 font-semibold text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Test Admin Console (gootymahind@gmail.com)</span>
            </div>
            <span>Staff Portal →</span>
          </button>
        </div>

        {/* Privacy & Terms Callout */}
        <div className="p-4 rounded-xl bg-surface/50 border border-app text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs text-sub font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-Storage Resume Privacy</span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            Uploaded resumes are processed in-memory for skill detection. Original document files are never permanently saved on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
