/**
 * @file TermsPage.tsx
 * Clear terms of service for SkillPath AI users.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileCheck } from 'lucide-react';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-text py-12 px-4 sm:px-6 max-w-3xl mx-auto selection:bg-brand selection:text-white">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-sub hover:text-brand-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="card-elevated p-8 space-y-6 bg-surface border-app text-sm leading-relaxed text-sub">
        <div className="flex items-center gap-3 pb-4 border-b border-app">
          <div className="p-2 rounded-xl bg-brand/10 text-brand-accent">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-main font-heading">Terms of Service</h1>
            <p className="text-xs text-muted">Effective: November 2026</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-main">1. Nature of the Product</h2>
          <p>
            SkillPath AI is an educational skills verification and career exploration platform. The recommendations, skill-gap buckets, and opportunity match scores are computed using mathematical algorithms designed to help early-career professionals identify learning priorities.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-main">2. Sample Listings & Employer Relationships</h2>
          <p>
            Vacancies labeled <strong>Sample listing — not a real vacancy</strong> feature fictional companies and sample role descriptions intended solely to demonstrate platform matching capabilities. SkillPath AI is not an employment agency and does not guarantee job interviews or hiring offers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-main">3. Permitted Use</h2>
          <p>
            Users agree to provide accurate information and to complete assessments individually without automated scripts or unauthorized third-party assistance. We enforce a daily limit of 5 assessment submissions per 24 hours to encourage structured practice.
          </p>
        </section>
      </div>
    </div>
  );
}
