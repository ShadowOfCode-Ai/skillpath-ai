/**
 * @file DashboardPage.tsx
 * 12-column grid dashboard displaying real candidate metrics, next best action,
 * stat cards, top career & opportunity matches, skill distribution doughnut, and score bars with 60% threshold.
 */

import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Award,
  Sparkles,
  TrendingUp,
  Compass,
  FileText,
  Briefcase,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard, ScoreRing, SkillChip, ScoreBar, EvidenceMeter } from '../components/common/SharedComponents';
import { deriveAssessedLevel } from '../engine/assessmentScorer';
import { matchOpportunities } from '../engine/opportunityMatcher';
import { SAMPLE_OPPORTUNITIES } from '../data/sampleOpportunities';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { CAREER_ROLES_MAP } from '../data/roles';
import { VERIFY_THRESHOLD } from '../config/scoring';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    profile,
    resume,
    verifiedSkillsList,
    verifiedSkillsMap,
    careerRecommendations,
    assessmentHistory,
    roadmapProgress,
  } = useApp();

  // Next Best Action logic computed from real state
  const nextBestAction = useMemo(() => {
    if (!resume || resume.detectedSkills.length === 0) {
      return {
        title: 'Upload your resume to extract skills',
        desc: 'SkillPath AI uses your resume to identify claimed technical proficiencies and seed your target role analysis.',
        buttonText: 'Upload Resume',
        action: () => navigate('/resume'),
        icon: FileText,
      };
    }
    const assessedCount = Object.keys(assessmentHistory).length;
    if (assessedCount === 0) {
      return {
        title: 'Verify your claimed skills through assessment',
        desc: 'You have unverified skills from your resume. Complete a quick technical assessment to earn your official VERIFIED status.',
        buttonText: 'Start Assessment',
        action: () => navigate('/assessment'),
        icon: Sparkles,
      };
    }
    const topRec = careerRecommendations[0];
    return {
      title: `Advance your ${topRec?.roleName || 'Career'} roadmap`,
      desc: 'Target missing core competencies to boost your career fit score and qualify for higher-probability opportunities.',
      buttonText: 'Open Learning Roadmap',
      action: () => navigate('/roadmap'),
      icon: Compass,
    };
  }, [resume, assessmentHistory, careerRecommendations, navigate]);

  // Skill status counts
  const verifiedCount = verifiedSkillsList.filter((s) => s.status === 'VERIFIED').length;
  const developingCount = verifiedSkillsList.filter((s) => s.status === 'DEVELOPING').length;
  const unverifiedCount = verifiedSkillsList.filter((s) => s.status === 'UNVERIFIED').length;
  const totalFoundSkills = resume?.detectedSkills.filter((s) => !s.removedByUser).length || 0;

  // Assessed Level vs Self-Rated Level
  const assessedSkillPercentages = Object.values(assessmentHistory).map((a) => a.percent);
  const assessedLevel = deriveAssessedLevel(assessedSkillPercentages);

  // Top career recommendation
  const topCareer = careerRecommendations[0];
  const targetRoleDef = CAREER_ROLES_MAP.get(profile.targetRoleId);

  // Top opportunity match
  const matchedOpps = useMemo(() => {
    return matchOpportunities(SAMPLE_OPPORTUNITIES, verifiedSkillsMap, targetRoleDef?.name);
  }, [verifiedSkillsMap, targetRoleDef]);
  const topOpportunity = matchedOpps[0];

  // Roadmap progress
  const roadmapDoneCount = Object.values(roadmapProgress).filter((s) => s === 'done').length;
  const targetRoleSkillsCount = targetRoleDef ? targetRoleDef.requiredSkills.length + 2 : 7;

  // Doughnut chart data
  const doughnutData = useMemo(() => {
    return [
      { name: 'Verified', value: verifiedCount, color: '#34D399' },
      { name: 'Developing', value: developingCount, color: '#FBBF24' },
      { name: 'Unverified', value: unverifiedCount, color: '#94A3B8' },
    ].filter((d) => d.value > 0);
  }, [verifiedCount, developingCount, unverifiedCount]);

  // Biggest gaps from top career role
  const biggestGaps = topCareer?.topGaps || [];

  return (
    <div className="space-y-6">
      {/* Row 1: Greeting + Accented "Next Best Action" card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Welcome greeting banner */}
        <div className="lg:col-span-5 card-elevated p-6 flex flex-col justify-between bg-surface border-app">
          <div>
            <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Candidate Dashboard</div>
            <h2 className="text-2xl font-bold text-main font-heading tracking-tight mb-2">
              Hello, {profile.name}
            </h2>
            <p className="text-xs text-sub leading-relaxed">
              Target Role: <strong className="text-main">{targetRoleDef?.name || 'Data Scientist'}</strong>
              {assessedLevel && (
                <>
                  {' '}• Assessed Level: <strong className="text-brand-accent">{assessedLevel}</strong>
                  {profile.selfRatedLevel && (
                    <span className="text-muted"> (Self-rated: {profile.selfRatedLevel})</span>
                  )}
                </>
              )}
            </p>
          </div>
          <div className="pt-4 border-t border-app flex items-center justify-between text-xs text-muted">
            <span>Resume: {resume ? 'Processed & Extracted' : 'Not Uploaded'}</span>
            <Link to="/profile" className="text-brand-accent hover:underline font-medium">
              Edit target role →
            </Link>
          </div>
        </div>

        {/* Accented Next Best Action Card */}
        <div className="lg:col-span-7 card-elevated p-6 flex flex-col justify-between border-brand/40 bg-brand/5 dark:bg-brand/10 ring-1 ring-brand/30">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-brand text-white shrink-0 mt-0.5">
              <nextBestAction.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-brand-accent mb-1">
                Next Best Action
              </div>
              <h3 className="text-lg font-bold text-main font-heading mb-1.5">{nextBestAction.title}</h3>
              <p className="text-xs text-sub leading-relaxed">{nextBestAction.desc}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-brand/20 flex justify-end">
            <button
              type="button"
              onClick={nextBestAction.action}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-white font-semibold text-xs hover:bg-brand-hover shadow-md transition-colors"
            >
              <span>{nextBestAction.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Four Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Verified Skills"
          value={verifiedCount}
          hint={`${verifiedCount} of ${totalFoundSkills} claimed verified`}
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          label="Developing / Unverified"
          value={developingCount + unverifiedCount}
          hint={`${developingCount} developing, ${unverifiedCount} unverified`}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Top Career Fit"
          value={topCareer ? `${topCareer.careerScore}%` : '0%'}
          hint={topCareer ? `${topCareer.roleName}` : 'Compute in Careers'}
        />
        <StatCard
          icon={<Compass className="w-5 h-5" />}
          label="Roadmap Progress"
          value={`${roadmapDoneCount} / ${targetRoleSkillsCount}`}
          hint="Milestones completed"
        />
      </div>

      {/* Row 3: Top Career + Top Opportunity + Roadmap Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Career Card */}
        <div className="card-elevated p-6 space-y-4 bg-surface border-app flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Top Recommended Career</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand-accent">
                Rank #1
              </span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              {topCareer && (
                <ScoreRing
                  score={topCareer.careerScore}
                  size={96}
                  strokeWidth={9}
                  isProvisional={topCareer.isProvisional}
                />
              )}
              <div>
                <h4 className="text-base font-bold text-main">{topCareer?.roleName || 'Data Scientist'}</h4>
                <div className="text-xs text-sub mt-1">
                  Skill Match: <strong className="text-main tabular-nums">{topCareer?.skillMatch}%</strong>
                </div>
                <div className="mt-1.5">
                  <EvidenceMeter coverage={topCareer?.evidenceCoverage || 0} />
                </div>
              </div>
            </div>
            {/* Matched Chips */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-muted">Matched Competencies:</div>
              <div className="flex flex-wrap gap-1">
                {topCareer?.matchedSkills.slice(0, 3).map((name) => (
                  <span
                    key={name}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium"
                  >
                    ✓ {name}
                  </span>
                ))}
                {(!topCareer || topCareer.matchedSkills.length === 0) && (
                  <span className="text-xs text-muted">No skills verified yet</span>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/careers"
            className="pt-3 border-t border-app text-xs font-semibold text-brand-accent hover:underline flex items-center justify-between"
          >
            <span>Explore all role gaps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Top Opportunity Match */}
        <div className="card-elevated p-6 space-y-4 bg-surface border-app flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Top Opportunity Match</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                Sample vacancy
              </span>
            </div>
            {topOpportunity && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-raised border border-app text-main font-bold flex items-center justify-center text-sm shrink-0">
                    {topOpportunity.opportunity.company.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-main truncate">{topOpportunity.opportunity.title}</h4>
                    <p className="text-xs text-sub truncate">{topOpportunity.opportunity.company}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <ScoreRing score={topOpportunity.opportunityScore} size={80} strokeWidth={8} />
                  <div className="text-xs space-y-1 text-sub">
                    <div>
                      Skill Match: <strong className="text-main tabular-nums">{topOpportunity.skillMatch}%</strong>
                    </div>
                    <div>
                      Text Match: <strong className="text-main tabular-nums">{topOpportunity.textSimilarityPercent}%</strong>
                    </div>
                    <div className="text-muted text-[11px]">{topOpportunity.opportunity.workMode} • {topOpportunity.opportunity.location}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link
            to="/opportunities"
            className="pt-3 border-t border-app text-xs font-semibold text-brand-accent hover:underline flex items-center justify-between"
          >
            <span>View matched listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Roadmap Progress Card */}
        <div className="card-elevated p-6 space-y-4 bg-surface border-app flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Target Role Roadmap</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-raised text-main">
                {targetRoleDef?.name || 'Data Scientist'}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums text-main">
                  {Math.round((roadmapDoneCount / targetRoleSkillsCount) * 100)}%
                </span>
                <span className="text-xs text-muted">
                  {roadmapDoneCount} of {targetRoleSkillsCount} completed
                </span>
              </div>
              <div className="h-2 w-full bg-raised rounded-full overflow-hidden border border-app">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((roadmapDoneCount / targetRoleSkillsCount) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-sub leading-relaxed pt-1">
                Ordered learning milestones for required skills. Marking milestones done prepares you for verification assessments.
              </p>
            </div>
          </div>
          <Link
            to="/roadmap"
            className="pt-3 border-t border-app text-xs font-semibold text-brand-accent hover:underline flex items-center justify-between"
          >
            <span>Open personalized roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Row 4: Skill-Status Doughnut + Assessment Scores with 60% line + Biggest Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* Skill Status Doughnut */}
        <div className="lg:col-span-4 card-elevated p-6 bg-surface border-app space-y-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Skill Verification Status</div>
          <div className="h-44 w-full flex items-center justify-center">
            {doughnutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={doughnutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {doughnutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-muted">
                No skills detected yet. Upload your resume or add skills.
              </div>
            )}
          </div>
          <div className="flex justify-around text-xs border-t border-app pt-3 text-sub">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Verified: <strong className="text-main tabular-nums">{verifiedCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Dev: <strong className="text-main tabular-nums">{developingCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Unverified: <strong className="text-main tabular-nums">{unverifiedCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Assessment Scores with 60% Threshold Line */}
        <div className="lg:col-span-5 card-elevated p-6 bg-surface border-app space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Assessment Scores</span>
            <span className="text-[11px] font-semibold text-amber-500">60% Threshold Line</span>
          </div>
          <div className="space-y-3.5">
            {Object.keys(assessmentHistory).length > 0 ? (
              Object.entries(assessmentHistory).slice(0, 4).map(([skillId, stat]) => (
                <div key={skillId} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-main capitalize">{skillId.replace('_', ' ')}</span>
                    <span className="text-sub tabular-nums font-bold">{stat.percent}%</span>
                  </div>
                  <ScoreBar score={stat.percent} threshold={VERIFY_THRESHOLD} />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-muted space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-sub opacity-50" />
                <p>No assessments completed yet.</p>
                <Link to="/assessment" className="text-brand-accent hover:underline font-semibold">
                  Take a 5-minute skill assessment →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Biggest Gaps */}
        <div className="lg:col-span-3 card-elevated p-6 bg-surface border-app space-y-4">
          <div className="text-xs font-bold text-muted uppercase tracking-wider">Priority Skill Gaps</div>
          <div className="space-y-3">
            {biggestGaps.length > 0 ? (
              biggestGaps.map((gap) => (
                <div key={gap.skillName} className="p-3 rounded-xl bg-raised border border-app space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-main">{gap.skillName}</span>
                    <span className="text-[10px] font-bold text-amber-500 uppercase">{gap.importance}</span>
                  </div>
                  <p className="text-[11px] text-muted">Status: {gap.status.toLowerCase().replace('_', ' ')}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted py-6 text-center">
                All priority skills for {topCareer?.roleName || 'target role'} are satisfied.
              </div>
            )}
          </div>
          <Link
            to="/roadmap"
            className="pt-2 text-xs font-semibold text-brand-accent hover:underline flex items-center justify-between"
          >
            <span>Close gaps in roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
