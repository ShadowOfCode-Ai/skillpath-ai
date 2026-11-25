/**
 * @file HowScoringWorksPage.tsx
 * Full mathematical and architectural transparency breakdown of SkillPath AI scoring.
 * Imports every tunable parameter directly from src/config/scoring.ts to guarantee zero drift.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ShieldCheck, Scale, Cpu, Calculator } from 'lucide-react';
import {
  VERIFY_THRESHOLD,
  MIN_QUESTIONS_PER_SKILL,
  QUESTIONS_PER_SKILL,
  MAX_SKILLS_PER_ATTEMPT,
  STATUS_CREDIT,
  IMPORTANCE_WEIGHT,
  CAREER_WEIGHTS,
  OPPORTUNITY_WEIGHTS,
  PROVISIONAL_COVERAGE,
  LEVEL_BANDS,
  MAX_RESUME_CHARS,
  MAX_FILE_MB,
} from '../config/scoring';

export function HowScoringWorksPage() {
  return (
    <div className="min-h-screen bg-background text-text py-12 px-4 sm:px-6 max-w-4xl mx-auto selection:bg-brand selection:text-white">
      {/* Back Link */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-sub hover:text-brand-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-app bg-surface text-xs font-semibold text-brand-accent">
          <Scale className="w-4 h-4" />
          <span>Deterministic Scoring Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-main font-heading tracking-tight">
          How SkillPath AI Scoring Works
        </h1>
        <p className="text-sub text-sm leading-relaxed">
          Every number on screen is computed deterministically by pure TypeScript engines without generative AI or subjective black-box scoring. Below are the exact formulas, thresholds, and weights used by the product.
        </p>
      </div>

      {/* Honest Validation Disclosure Banner */}
      <div className="card-elevated p-5 mb-10 border-amber-500/30 bg-amber-500/5 text-xs text-sub leading-relaxed">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-main font-semibold">Validation Disclosure: </strong>
            SkillPath AI ranking and match algorithms are grounded in rigorous text matching and technical assessments. However, the resulting recommendations and fit scores have not yet been empirically validated against longitudinal hiring outcomes or recruiter hiring decisions. They should be used as self-directed guidance and preparation tools, not authoritative hiring guarantees.
          </div>
        </div>
      </div>

      <div className="space-y-10 text-sm">
        {/* Section 1: Verification Thresholds */}
        <section className="card-elevated p-6 sm:p-8 space-y-4 bg-surface border-app">
          <div className="flex items-center gap-2 text-brand-accent font-bold text-sm uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>1. Skill Verification Threshold & Statuses</span>
          </div>
          <p className="text-sub text-xs leading-relaxed">
            Skills are partitioned into four mutually exclusive statuses based on verifiable evidence:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span className="font-bold text-emerald-500">VERIFIED</span>
              <p className="text-sub">
                Candidate took an assessment and achieved a score of ≥ <strong>{VERIFY_THRESHOLD}%</strong>. Credit in formulas: <strong>{STATUS_CREDIT.VERIFIED * 100}%</strong>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
              <span className="font-bold text-amber-500">DEVELOPING</span>
              <p className="text-sub">
                Candidate took an assessment and scored below <strong>{VERIFY_THRESHOLD}%</strong>. Credit in formulas: <strong>{STATUS_CREDIT.DEVELOPING * 100}%</strong>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-500/30 bg-slate-500/5 space-y-1">
              <span className="font-bold text-slate-400">UNVERIFIED</span>
              <p className="text-sub">
                Skill appears in resume or was manually claimed, but has not yet been assessed. Credit in formulas: <strong>{STATUS_CREDIT.UNVERIFIED * 100}%</strong>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 space-y-1">
              <span className="font-bold text-red-400">NOT FOUND</span>
              <p className="text-sub">
                Skill is required by a role or opportunity but no evidence exists on profile or test. Credit: <strong>{STATUS_CREDIT.NOT_FOUND * 100}%</strong>.
              </p>
            </div>
          </div>
          <p className="text-muted text-xs">
            * Assessment rule: A skill counts as formally assessed only when at least <strong>{MIN_QUESTIONS_PER_SKILL}</strong> questions have been drawn and submitted. Each standard attempt draws <strong>{QUESTIONS_PER_SKILL}</strong> questions per skill. Up to <strong>{MAX_SKILLS_PER_ATTEMPT}</strong> skills can be assessed per attempt.
          </p>
        </section>

        {/* Section 2: Shared Match Formula */}
        <section className="card-elevated p-6 sm:p-8 space-y-4 bg-surface border-app">
          <div className="flex items-center gap-2 text-brand-accent font-bold text-sm uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>2. Shared Skill Match Formula</span>
          </div>
          <p className="text-sub text-xs leading-relaxed">
            Both career recommendations and opportunity matching utilize the exact same skillMatch equation, weighting core competencies double supporting ones:
          </p>
          <div className="p-4 rounded-xl bg-raised border border-app font-mono text-xs text-brand-accent">
            skillMatch = ( Σ(importanceWeight × credit) ÷ Σ(importanceWeight) ) × 100
          </div>
          <ul className="space-y-1 text-xs text-sub list-disc list-inside">
            <li>Core skill importance weight = <strong>{IMPORTANCE_WEIGHT.core}</strong></li>
            <li>Supporting skill importance weight = <strong>{IMPORTANCE_WEIGHT.supporting}</strong></li>
            <li>Example fixture: 5 core skills required, 4 Verified (1.0) and 1 Not Found (0.0) → 4 ÷ 5 = <strong>80.0%</strong> match.</li>
          </ul>
        </section>

        {/* Section 3: Career Recommendation Formula */}
        <section className="card-elevated p-6 sm:p-8 space-y-4 bg-surface border-app">
          <div className="flex items-center gap-2 text-brand-accent font-bold text-sm uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>3. Career Recommendation Score</span>
          </div>
          <p className="text-sub text-xs leading-relaxed">
            Career fit synthesizes skill match percentage with weighted assessment confidence:
          </p>
          <div className="p-4 rounded-xl bg-raised border border-app font-mono text-xs text-brand-accent">
            careerScore = ({CAREER_WEIGHTS.skillMatch.toFixed(2)} × skillMatch) + ({CAREER_WEIGHTS.assessmentConfidence.toFixed(2)} × assessmentConfidence)
          </div>
          <p className="text-xs text-sub leading-relaxed">
            Where <code>assessmentConfidence</code> is the weighted average score of all required skills that have been formally assessed (0 if none). Evidence coverage is calculated as <code>assessedRequired ÷ totalRequired</code>. If coverage is below <strong>{PROVISIONAL_COVERAGE * 100}%</strong>, the score is explicitly labeled <strong>Provisional</strong>.
          </p>
        </section>

        {/* Section 4: Opportunity Match & TF-IDF */}
        <section className="card-elevated p-6 sm:p-8 space-y-4 bg-surface border-app">
          <div className="flex items-center gap-2 text-brand-accent font-bold text-sm uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>4. Opportunity Match & Document Similarity</span>
          </div>
          <p className="text-sub text-xs leading-relaxed">
            Internships and fresher jobs are ranked using a hybrid of skill overlap and document TF-IDF cosine similarity:
          </p>
          <div className="p-4 rounded-xl bg-raised border border-app font-mono text-xs text-brand-accent">
            opportunityScore = ({OPPORTUNITY_WEIGHTS.skillMatch.toFixed(2)} × skillMatch) + ({OPPORTUNITY_WEIGHTS.textSimilarity.toFixed(2)} × textSimilarity)
          </div>
          <p className="text-xs text-sub leading-relaxed">
            The candidate profile document compiles verified skill names (2× weight), developing skill names (1× weight), and target role title. The opportunity document compiles title (2× weight), required skills (2× weight), and full description. Cosine similarity is computed over L2-normalized TF-IDF vectors using smoothed IDF <code>ln((1 + N) / (1 + df)) + 1</code> and sublinear term frequency.
          </p>
        </section>

        {/* Section 5: Proficiency Levels & Resume Limits */}
        <section className="card-elevated p-6 sm:p-8 space-y-3 bg-surface border-app">
          <h2 className="font-bold text-main text-sm">5. Proficiency Bands & Resume Limits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-sub">
            <div>
              <div className="font-semibold text-main mb-1">Proficiency Bands:</div>
              <div>Beginner: Average test score &lt; {LEVEL_BANDS.BEGINNER_MAX}%</div>
              <div>Intermediate: {LEVEL_BANDS.BEGINNER_MAX}% – {LEVEL_BANDS.INTERMEDIATE_MAX - 1}%</div>
              <div>Advanced: ≥ {LEVEL_BANDS.INTERMEDIATE_MAX}%</div>
            </div>
            <div>
              <div className="font-semibold text-main mb-1">File & Text Limits:</div>
              <div>Maximum resume character length: {MAX_RESUME_CHARS.toLocaleString()} characters</div>
              <div>Maximum file upload size: {MAX_FILE_MB} MB</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
