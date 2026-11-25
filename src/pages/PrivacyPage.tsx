/**
 * @file PrivacyPage.tsx
 * Accurate, honest privacy policy reflecting real system data processing practices.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export function PrivacyPage() {
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
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-main font-heading">Privacy Notice</h1>
            <p className="text-xs text-muted">Effective: November 2026</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-main">1. What We Actually Do</h2>
          <p>
            SkillPath AI processes text extracted from your resume and your responses to skills assessments to calculate skill-gap analysis and career fit scores. We adhere strictly to the principle of data minimization:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Original resume files (PDF, DOCX) are parsed locally or in memory; the original uploaded file binary is <strong>never stored</strong>.</li>
            <li>Only extracted text (up to 60,000 characters) and detected skills are saved to your account document in Cloud Firestore.</li>
            <li>We do not sell, rent, or monetize your personal profile information.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-main">2. Firestore Security Rules & Access Isolation</h2>
          <p>
            Your account profile, roadmap progress, and saved bookmarks are protected by attribute-based Firestore security rules. A signed-in user can only read and write their own documents. Verification results and assessment scores can only be written by the server API to prevent client tampering.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-main">3. Data Export & Permanent Deletion</h2>
          <p>
            You retain complete control of your data. From the <strong>Settings</strong> page, you can:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Export all stored profile and verification data as a machine-readable JSON file.</li>
            <li>Permanently delete your profile and all associated data with immediate confirmation.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-main">4. Honest Scope & Disclaimers</h2>
          <p>
            SkillPath AI makes no formal regulatory compliance claims (such as ISO, FERPA, or GDPR certifications). Skill verification indicates score achievements on our multiple-choice question bank and does not constitute a state-accredited degree or industry license.
          </p>
        </section>
      </div>
    </div>
  );
}
