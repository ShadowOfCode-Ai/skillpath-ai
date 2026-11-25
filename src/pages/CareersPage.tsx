/**
 * @file CareersPage.tsx
 * Top 3 career recommendations as rich cards with score rings, formula panels, and gap breakdowns,
 * followed by a ranked list of all roles and an in-depth Gap Analysis modal/view with RadarChart.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ScoreRing, ScoreBar, SkillChip, EvidenceMeter, FormulaPanel } from '../components/common/SharedComponents';
import { analyzeSkillGap, RoleGapAnalysis } from '../engine/gapAnalyzer';
import { explainCareerRecommendation } from '../engine/explain';
import { CAREER_ROLES, CAREER_ROLES_MAP, CareerRole } from '../data/roles';
import {
  TrendingUp,
  Target,
  Compass,
  ArrowRight,
  Radar,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function CareersPage() {
  const navigate = useNavigate();
  const { profile, setProfile, verifiedSkillsMap, careerRecommendations } = useApp();

  const [selectedRoleForGap, setSelectedRoleForGap] = useState<CareerRole | null>(null);

  // Top 3 careers & remaining careers
  const topThree = careerRecommendations.slice(0, 3);
  const remainingRoles = careerRecommendations.slice(3);

  // Gap analysis computation for modal/drawer
  const gapAnalysisData: RoleGapAnalysis | null = useMemo(() => {
    if (!selectedRoleForGap) return null;
    return analyzeSkillGap(selectedRoleForGap, verifiedSkillsMap);
  }, [selectedRoleForGap, verifiedSkillsMap]);

  const handleSetTargetRole = (roleId: string) => {
    setProfile((prev) => ({ ...prev, targetRoleId: roleId }));
    setSelectedRoleForGap(null);
  };

  const handleBuildRoadmap = (roleId: string) => {
    setProfile((prev) => ({ ...prev, targetRoleId: roleId }));
    navigate('/roadmap');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-main font-heading">Career Recommendations & Gap Analysis</h2>
        <p className="text-xs text-sub">
          Ranked deterministically: 70% weighted skill match + 30% assessment confidence. Every score is explainable.
        </p>
      </div>

      {/* Top 3 Career Cards */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-muted uppercase tracking-wider">Top 3 Recommended Paths</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {topThree.map((rec) => {
            const explanation = explainCareerRecommendation(rec);
            const roleDef = CAREER_ROLES_MAP.get(rec.roleId);

            return (
              <div
                key={rec.roleId}
                className="card-elevated p-6 bg-surface border-app flex flex-col justify-between space-y-4 relative"
              >
                <div>
                  {/* Rank Badge & Target Tag */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand-accent">
                      Rank #{rec.rank}
                    </span>
                    {rec.isTargetRole && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Target Role
                      </span>
                    )}
                  </div>

                  {/* Header Title & Score Ring */}
                  <div className="flex items-center gap-4 mb-4">
                    <ScoreRing
                      score={rec.careerScore}
                      size={96}
                      strokeWidth={9}
                      isProvisional={rec.isProvisional}
                      label="Career Fit"
                    />
                    <div>
                      <h3 className="text-base font-bold text-main">{rec.roleName}</h3>
                      <div className="text-xs text-sub mt-1">
                        Skill match: <strong className="text-main tabular-nums">{rec.skillMatch}%</strong>
                      </div>
                      <div className="mt-1.5">
                        <EvidenceMeter coverage={rec.evidenceCoverage} />
                      </div>
                    </div>
                  </div>

                  {/* Why recommended */}
                  <div className="space-y-2 text-xs">
                    <p className="text-sub leading-snug">{explanation.evidenceSummary}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rec.matchedSkills.map((name) => (
                        <span
                          key={name}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium"
                        >
                          ✓ {name}
                        </span>
                      ))}
                      {rec.topGaps.map((g) => (
                        <span
                          key={g.skillName}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium"
                        >
                          ! {g.skillName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Formula Breakdown & Action */}
                <div className="space-y-3 pt-3 border-t border-app">
                  <FormulaPanel formula={rec.formulaBreakdown} />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => roleDef && setSelectedRoleForGap(roleDef)}
                      className="flex-1 py-2 rounded-xl border border-app bg-raised hover:bg-surface text-main text-xs font-semibold shadow-sm transition-colors text-center"
                    >
                      Analyze Skill Gap
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBuildRoadmap(rec.roleId)}
                      className="p-2 rounded-xl bg-brand text-white hover:bg-brand-hover shadow-sm transition-colors"
                      title="Build Roadmap for this role"
                    >
                      <Compass className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ranked List of All Roles */}
      <div className="card-elevated p-6 bg-surface border-app space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-app">
          <h3 className="text-sm font-bold text-main">All Career Roles ({careerRecommendations.length})</h3>
          <span className="text-xs text-muted">Sorted deterministically by fit score</span>
        </div>

        <div className="space-y-3">
          {careerRecommendations.map((rec) => {
            const roleDef = CAREER_ROLES_MAP.get(rec.roleId);
            return (
              <div
                key={rec.roleId}
                className="p-4 rounded-xl bg-raised border border-app hover:border-brand/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-surface border border-app text-xs font-bold text-sub flex items-center justify-center shrink-0">
                    #{rec.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-main truncate">{rec.roleName}</span>
                      {rec.isTargetRole && (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-500">
                          Target
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted truncate max-w-md">{rec.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <div className="w-32 hidden sm:block">
                    <ScoreBar score={rec.careerScore} />
                  </div>
                  <span className="text-sm font-extrabold text-main tabular-nums w-12 text-right">
                    {rec.careerScore}%
                  </span>
                  <button
                    type="button"
                    onClick={() => roleDef && setSelectedRoleForGap(roleDef)}
                    className="px-3.5 py-1.5 rounded-xl border border-app bg-surface hover:bg-raised text-brand-accent text-xs font-semibold shadow-sm transition-colors"
                  >
                    View Gaps
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gap Analysis Modal / Drawer */}
      {selectedRoleForGap && gapAnalysisData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedRoleForGap(null)}
          />
          <div className="relative w-full max-w-4xl bg-surface border border-app rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto z-10 animate-fadeIn space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-app">
              <div>
                <span className="text-xs font-bold text-brand-accent uppercase tracking-wider">Gap Analysis</span>
                <h3 className="text-xl font-bold text-main font-heading">{selectedRoleForGap.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoleForGap(null)}
                className="p-1.5 rounded-lg text-sub hover:text-main focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Radar Chart: Required Level vs Current Assessed Level */}
            <div className="card-elevated p-6 bg-raised border-app flex flex-col items-center">
              <span className="text-xs font-bold text-muted uppercase tracking-wider mb-2">
                Competency Radar (Target vs Current Mastery)
              </span>
              <div className="h-64 w-full max-w-lg">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={gapAnalysisData.radarData}>
                    <PolarGrid stroke="#94A3B8" opacity={0.2} />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" opacity={0.2} />
                    <RechartsRadar
                      name="Role Requirement"
                      dataKey="required"
                      stroke="#2563EB"
                      fill="#2563EB"
                      fillOpacity={0.15}
                    />
                    <RechartsRadar
                      name="Candidate Evidence"
                      dataKey="current"
                      stroke="#34D399"
                      fill="#34D399"
                      fillOpacity={0.35}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Three Mutually Exclusive Buckets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Matched (VERIFIED) */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Matched ({gapAnalysisData.matched.length})</span>
                </div>
                <div className="space-y-2">
                  {gapAnalysisData.matched.map((item) => (
                    <div key={item.skillId} className="p-2.5 rounded-lg bg-surface border border-emerald-500/20 text-xs">
                      <div className="font-bold text-main flex justify-between">
                        <span>{item.skillName}</span>
                        <span className="tabular-nums font-bold text-emerald-500">{item.score || 85}%</span>
                      </div>
                      <p className="text-[11px] text-sub mt-1 leading-tight">{item.whyItMatters}</p>
                    </div>
                  ))}
                  {gapAnalysisData.matched.length === 0 && (
                    <span className="text-xs text-muted">No skills currently verified</span>
                  )}
                </div>
              </div>

              {/* Developing (DEVELOPING) */}
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                  <Clock className="w-4 h-4" />
                  <span>Developing ({gapAnalysisData.developing.length})</span>
                </div>
                <div className="space-y-2">
                  {gapAnalysisData.developing.map((item) => (
                    <div key={item.skillId} className="p-2.5 rounded-lg bg-surface border border-amber-500/20 text-xs">
                      <div className="font-bold text-main flex justify-between">
                        <span>{item.skillName}</span>
                        <span className="tabular-nums font-bold text-amber-500">{item.score}%</span>
                      </div>
                      <p className="text-[11px] text-sub mt-1 leading-tight">{item.whyItMatters}</p>
                    </div>
                  ))}
                  {gapAnalysisData.developing.length === 0 && (
                    <span className="text-xs text-muted">No skills in developing bucket</span>
                  )}
                </div>
              </div>

              {/* Missing (UNVERIFIED or NOT_FOUND) */}
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Missing ({gapAnalysisData.missing.length})</span>
                </div>
                <div className="space-y-2">
                  {gapAnalysisData.missing.map((item) => (
                    <div key={item.skillId} className="p-2.5 rounded-lg bg-surface border border-red-500/20 text-xs">
                      <div className="font-bold text-main flex justify-between">
                        <span>{item.skillName}</span>
                        <span className="text-[10px] uppercase font-bold text-muted">
                          {item.status === 'UNVERIFIED' ? 'Claimed' : 'Not Found'}
                        </span>
                      </div>
                      <p className="text-[11px] text-sub mt-1 leading-tight">{item.whyItMatters}</p>
                    </div>
                  ))}
                  {gapAnalysisData.missing.length === 0 && (
                    <span className="text-xs text-muted">Zero missing skills!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-app">
              <button
                type="button"
                onClick={() => handleSetTargetRole(selectedRoleForGap.id)}
                className="px-4 py-2 rounded-xl border border-app bg-raised hover:bg-surface text-main text-xs font-semibold"
              >
                Set as Target Role
              </button>
              <button
                type="button"
                onClick={() => handleBuildRoadmap(selectedRoleForGap.id)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover shadow-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Build Roadmap for {selectedRoleForGap.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
