/**
 * @file LandingPage.tsx
 * Design-token compliant public landing page.
 * Features hero with live example component preview, 4-step workflow,
 * resume claims vs verified demonstration comparison, FAQ accordion, and transparent scoring links.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  TrendingUp,
  Compass,
} from 'lucide-react';
import { LogoMark } from '../components/layout/AppShell';
import { ScoreRing, SkillChip } from '../components/common/SharedComponents';
import { useApp } from '../context/AppContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { loginAsDemoUser, theme, toggleTheme } = useApp();

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does SkillPath AI verify skills?',
      a: 'SkillPath AI combines two distinct signals: skills identified in your uploaded resume (claimed evidence) and your answers to multiple-choice technical assessments (demonstrated evidence). A skill only receives the VERIFIED status if you score 60% or higher on an assessment drawn from our server question bank.',
    },
    {
      q: 'Does an uploaded resume ever get marked as Verified automatically?',
      a: 'Never. In accordance with our core scoring integrity rules, a resume mention alone only grants UNVERIFIED status. Verification requires passing an objective assessment.',
    },
    {
      q: 'Where do the job and internship matches come from?',
      a: 'Matches are scored using a deterministic formula combining weighted skill match (70%) and TF-IDF document cosine similarity (30%). Active listings are managed by administrators, and sample vacancies are clearly marked as fictional sample data.',
    },
    {
      q: 'Are any external AI APIs or LLMs used to calculate my scores?',
      a: 'No. Every percentage, formula breakdown, and match ranking is computed live using pure, deterministic mathematical algorithms implemented directly in TypeScript.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text flex flex-col selection:bg-brand selection:text-white">
      {/* Sticky Transparent Navigation */}
      <nav className="sticky top-0 z-40 border-b border-app bg-surface/85 backdrop-blur-md px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark className="w-8 h-8" />
          <span className="font-extrabold text-lg tracking-tight text-main font-heading">
            SkillPath <span className="text-brand-accent">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/how-scoring-works"
            className="hidden sm:inline-block text-xs font-semibold text-sub hover:text-main transition-colors"
          >
            How scoring works
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-app text-sub hover:text-main focus:outline-none"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link
            to="/signin"
            className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-sm transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero Section with subtle brand glow */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand/10 dark:bg-brand/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-app bg-surface text-xs font-semibold text-brand-accent">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Evidence-based verification for students & graduates</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-main tracking-tight font-heading leading-tight">
              Verify your skills. <br />
              <span className="text-brand-accent">Find your path.</span>
            </h1>

            <p className="text-sub text-base sm:text-lg max-w-xl leading-relaxed">
              SkillPath AI combines what your resume claims with what an objective assessment demonstrates into a mathematically explainable skill profile and targeted career roadmap.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-hover shadow-lg transition-all"
              >
                <span>Get started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  loginAsDemoUser();
                  navigate('/dashboard');
                }}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-app bg-surface text-main font-semibold text-sm hover:bg-raised transition-all"
              >
                <span>Try Demo Candidate</span>
              </button>
              <Link
                to="/how-scoring-works"
                className="px-4 py-3.5 text-sub hover:text-main text-sm font-semibold transition-colors"
              >
                See how scoring works
              </Link>
            </div>
          </div>

          {/* Real component preview with Example profile data */}
          <div className="lg:col-span-5 relative">
            <div className="card-elevated p-6 space-y-5 bg-surface border-app relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-app">
                <div>
                  <div className="text-xs font-bold text-muted uppercase tracking-wider">Example profile</div>
                  <div className="text-base font-bold text-main">Priya Sharma</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                  Target: Data Scientist
                </span>
              </div>

              {/* Score Ring Component */}
              <div className="flex items-center justify-around py-2">
                <ScoreRing score={82} size={108} strokeWidth={10} label="Career Fit" />
                <div className="space-y-1.5 text-xs text-sub">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Skill match: <strong className="text-main tabular-nums">85%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Confidence: <strong className="text-main tabular-nums">76%</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Coverage: <strong className="text-main tabular-nums">75%</strong></span>
                  </div>
                </div>
              </div>

              {/* Chips showcase */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-muted uppercase">Verified Competencies</div>
                <div className="flex flex-wrap gap-1.5">
                  <SkillChip name="Python" status="VERIFIED" score={80} />
                  <SkillChip name="SQL" status="VERIFIED" score={75} />
                  <SkillChip name="Pandas" status="DEVELOPING" score={50} />
                  <SkillChip name="Deep Learning" status="NOT_FOUND" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-raised border border-app text-[11px] font-mono text-brand-accent">
                0.70 × 85.0% + 0.30 × 76.0% = 82%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (4 steps) */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full border-t border-app">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-main font-heading mb-3">
            How SkillPath AI works
          </h2>
          <p className="text-sub text-sm">
            Four transparent steps from your initial resume to matched opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Extract Resume Skills',
              desc: 'Upload PDF or TXT. Skills are identified strictly via dictionary token matching with visible source snippets.',
              icon: FileText,
            },
            {
              step: '02',
              title: 'Take Skill Assessment',
              desc: 'Answer 4 questions per skill drawn from our 65+ question bank. Answer keys remain protected on the server.',
              icon: Sparkles,
            },
            {
              step: '03',
              title: 'Derive Verified Status',
              desc: 'Score 60%+ to earn VERIFIED status. Below 60% becomes DEVELOPING. Gaps are categorized transparently.',
              icon: TrendingUp,
            },
            {
              step: '04',
              title: 'Follow Your Path',
              desc: 'Receive deterministic career rankings, step-by-step roadmaps, and TF-IDF matched opportunities.',
              icon: Compass,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="card-elevated p-6 space-y-3 bg-surface">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-brand-accent">{item.step}</span>
                  <div className="p-2 rounded-xl bg-raised text-brand-accent">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-main">{item.title}</h3>
                <p className="text-xs text-sub leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-Column Explainer: Resume claims vs Demonstrated skills */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full border-t border-app">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card-elevated p-6 sm:p-8 space-y-4 bg-surface border-app">
            <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">Claimed Evidence</div>
            <h2 className="text-xl font-bold text-main font-heading">What your resume claims</h2>
            <p className="text-sub text-sm leading-relaxed">
              Resumes list keywords, coursework, and projects. While valuable for intent, they lack proof of current mastery. In SkillPath AI, resume-only skills are marked <strong>UNVERIFIED</strong>.
            </p>
            <ul className="space-y-2 text-xs text-sub pt-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Text pattern matching identifies self-reported skills</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Context snippets are preserved as auditable evidence</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Grants 25% partial match credit in formulas</span>
              </li>
            </ul>
          </div>

          <div className="card-elevated p-6 sm:p-8 space-y-4 bg-surface border-brand/30 ring-1 ring-brand/20">
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Demonstrated Evidence</div>
            <h2 className="text-xl font-bold text-main font-heading">What you've demonstrated</h2>
            <p className="text-sub text-sm leading-relaxed">
              Objective, multiple-choice questions administered across Beginner, Intermediate, and Advanced difficulties. Graded securely on the server with a 60% threshold to achieve <strong>VERIFIED</strong>.
            </p>
            <ul className="space-y-2 text-xs text-sub pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Full 100% skill credit upon passing (score ≥ 60%)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Answer key never exposed before submission</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Detailed per-question explanations after submission</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 px-6 max-w-4xl mx-auto w-full border-t border-app">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-main font-heading text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="card-elevated overflow-hidden bg-surface border-app">
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-main hover:bg-raised transition-colors focus:outline-none"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-brand-accent shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-sub shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-sub leading-relaxed border-t border-app/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Public Footer */}
      <footer className="mt-auto border-t border-app py-8 px-6 bg-surface text-center text-xs text-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoMark className="w-5 h-5 opacity-80" />
            <span className="font-semibold text-sub">SkillPath AI</span>
            <span>•</span>
            <span>Verify your skills. Find your path.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/how-scoring-works" className="hover:text-brand-accent transition-colors">
              How Scoring Works
            </Link>
            <Link to="/privacy" className="hover:text-brand-accent transition-colors">
              Privacy Notice
            </Link>
            <Link to="/terms" className="hover:text-brand-accent transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
