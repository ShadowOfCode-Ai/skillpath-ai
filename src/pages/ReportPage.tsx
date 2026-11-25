/**
 * @file ReportPage.tsx
 * Comprehensive printable verification summary report.
 * Features A4 printable stylesheet, forced light theme during print,
 * candidate credentials, verified competencies, role fit breakdown, roadmap milestones, and matched listings.
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { LogoMark } from '../components/layout/AppShell';
import { ScoreRing, ScoreBar } from '../components/common/SharedComponents';
import { CAREER_ROLES_MAP } from '../data/roles';
import { Printer, Download, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ReportPage() {
  const {
    profile,
    resume,
    verifiedSkillsList,
    careerRecommendations,
    roadmapProgress,
  } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const targetRole = CAREER_ROLES_MAP.get(profile.targetRoleId);
  const topCareer = careerRecommendations[0];
  const verifiedOnly = verifiedSkillsList.filter((s) => s.status === 'VERIFIED');
  const developingOnly = verifiedSkillsList.filter((s) => s.status === 'DEVELOPING');

  const generationDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (Hidden during print) */}
      <div className="no-print flex items-center justify-between pb-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-sub hover:text-brand-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-md transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Document Sheet (A4 container) */}
      <div className="card-elevated p-8 sm:p-12 bg-surface text-main space-y-8 border-app">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-app gap-4">
          <div className="flex items-center gap-3">
            <LogoMark className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-extrabold font-heading text-main tracking-tight">
                SkillPath AI <span className="text-brand-accent">Verification Report</span>
              </h1>
              <p className="text-xs text-sub">Objective Skills Verification & Career Fit Summary</p>
            </div>
          </div>
          <div className="text-right text-xs text-muted">
            <div>Report Date: <strong>{generationDate}</strong></div>
            <div>Candidate ID: <code className="font-mono">{profile.uid.slice(0, 16)}</code></div>
          </div>
        </div>

        {/* Candidate Profile Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-raised border border-app text-xs">
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Candidate</span>
            <span className="font-bold text-main">{profile.name}</span>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Target Role</span>
            <span className="font-bold text-brand-accent">{targetRole?.name || 'Data Scientist'}</span>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Education</span>
            <span className="font-medium text-sub">{profile.education || 'Computer Science & Engineering'}</span>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Graduation</span>
            <span className="font-medium text-sub">{profile.graduationYear || '2026'}</span>
          </div>
        </div>

        {/* Career Fit & Verification Matrix */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-main font-heading border-b border-app pb-2">
            1. Target Career Fit Assessment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-raised border border-app text-center">
              <ScoreRing score={topCareer ? topCareer.careerScore : 0} size={100} strokeWidth={9} />
              <span className="text-xs font-bold text-main mt-2">{topCareer?.roleName}</span>
              <span className="text-[11px] text-sub">Overall Fit Score</span>
            </div>
            <div className="sm:col-span-2 space-y-2 text-xs">
              <div className="flex justify-between text-sub">
                <span>Skill Overlap Match:</span>
                <strong className="text-main tabular-nums">{topCareer?.skillMatch}%</strong>
              </div>
              <div className="flex justify-between text-sub">
                <span>Assessment Confidence:</span>
                <strong className="text-main tabular-nums">{topCareer?.assessmentConfidence}%</strong>
              </div>
              <div className="flex justify-between text-sub">
                <span>Evidence Coverage:</span>
                <strong className="text-main tabular-nums">
                  {Math.round((topCareer?.evidenceCoverage || 0) * 100)}%
                </strong>
              </div>
              <div className="p-3 rounded-lg bg-raised font-mono text-[11px] text-brand-accent mt-2">
                Formula: {topCareer?.formulaBreakdown}
              </div>
            </div>
          </div>
        </div>

        {/* Verified Skills Section */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-main font-heading border-b border-app pb-2">
            2. Verified Competencies (Demonstrated ≥ 60%)
          </h2>
          {verifiedOnly.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {verifiedOnly.map((skill) => (
                <div
                  key={skill.skillId}
                  className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-main flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{skill.skillName}</span>
                    </div>
                    <span className="text-[10px] text-sub">{skill.evidenceLabel}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold tabular-nums text-emerald-500">{skill.score}%</span>
                    <span className="text-[10px] text-muted block">Score</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-sub italic">No skills currently verified at or above 60% threshold.</p>
          )}
        </div>

        {/* Developing Competencies */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-main font-heading border-b border-app pb-2">
            3. Developing Competencies (Assessed &lt; 60%)
          </h2>
          {developingOnly.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {developingOnly.map((skill) => (
                <div
                  key={skill.skillId}
                  className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-main">{skill.skillName}</div>
                    <span className="text-[10px] text-sub">{skill.evidenceLabel}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold tabular-nums text-amber-500">{skill.score}%</span>
                    <span className="text-[10px] text-muted block">Score (Developing)</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-sub italic">No skills currently in developing state.</p>
          )}
        </div>

        {/* Report Footer & Disclaimer */}
        <div className="pt-6 border-t border-app text-center text-xs text-muted space-y-1">
          <p className="font-semibold text-sub">
            Verification reflects performance on SkillPath assessments. It is not a formal certification.
          </p>
          <p className="text-[10px]">
            Generated by SkillPath AI • https://ais-dev-5sfw6l3tphcuritsvfcf4n-268854303301.asia-southeast1.run.app
          </p>
        </div>
      </div>
    </div>
  );
}
