/**
 * @file RoadmapPage.tsx
 * Personalized learning roadmap view.
 * Ordered by topological prerequisites, importance, and verification status.
 * Features numbered node timeline, collapsible completed steps, official documentation links,
 * and two closing capstone steps.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/common/Feedback';
import { buildRoadmap, StepProgressStatus } from '../engine/roadmapBuilder';
import { CAREER_ROLES_MAP, CAREER_ROLES } from '../data/roles';
import { SkillChip } from '../components/common/SharedComponents';
import {
  Compass,
  CheckCircle2,
  Clock,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';

export function RoadmapPage() {
  const navigate = useNavigate();
  const { profile, setProfile, verifiedSkillsMap, roadmapProgress, updateRoadmapStep } = useApp();
  const { showToast } = useToast();

  const [selectedRoleId, setSelectedRoleId] = useState<string>(profile.targetRoleId || 'data_scientist');
  const [collapsedSteps, setCollapsedSteps] = useState<Set<string>>(new Set());

  const currentRole = useMemo(() => {
    return CAREER_ROLES_MAP.get(selectedRoleId) || CAREER_ROLES[0];
  }, [selectedRoleId]);

  // Build ordered roadmap
  const roadmap = useMemo(() => {
    return buildRoadmap(currentRole, verifiedSkillsMap, roadmapProgress);
  }, [currentRole, verifiedSkillsMap, roadmapProgress]);

  const handleStatusChange = (stepId: string, status: StepProgressStatus) => {
    updateRoadmapStep(stepId, status);
    if (status === 'done') {
      // Auto-collapse completed steps as required
      setCollapsedSteps((prev) => new Set(prev).add(stepId));
      showToast('Milestone marked as Done! (Note: Only assessments update verified skill status)', 'success');
    }
  };

  const toggleCollapse = (stepId: string) => {
    setCollapsedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Role Selector & Progress Bar */}
      <div className="card-elevated p-6 bg-surface border-app space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Learning Roadmap</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-xl sm:text-2xl font-bold text-main font-heading">{currentRole.name}</h2>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-app bg-raised text-main text-xs font-semibold focus:outline-none"
              >
                {CAREER_ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    Switch to {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xl font-extrabold text-main tabular-nums font-heading">
              {roadmap.progressPercent}%
            </span>
            <div className="text-xs text-muted">
              {roadmap.completedSteps} of {roadmap.totalSteps} steps completed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 w-full bg-raised rounded-full overflow-hidden border border-app">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{ width: `${roadmap.progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-sub leading-relaxed">
          Steps are ordered by prerequisites, core before supporting importance, and developing before unverified statuses. Completed steps collapse to keep you focused on immediate priorities.
        </p>
      </div>

      {/* Vertical Timeline */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-border">
        {roadmap.steps.map((step) => {
          const isDone = step.progressStatus === 'done';
          const isInProgress = step.progressStatus === 'in_progress';
          const isCollapsed = isDone || collapsedSteps.has(step.id);

          return (
            <div key={step.id} className="relative group">
              {/* Numbered Node on Timeline */}
              <div
                className={`absolute -left-6 sm:-left-8 top-5 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border shadow-sm transition-colors ${
                  isDone
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : isInProgress
                    ? 'bg-brand text-white border-brand ring-4 ring-brand/20'
                    : 'bg-surface text-sub border-app'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.stepNumber}
              </div>

              {/* Step Card */}
              <div
                className={`card-elevated p-5 sm:p-6 bg-surface border-app space-y-4 transition-all ${
                  isDone ? 'opacity-85' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-main font-heading">{step.title}</h3>
                      {step.currentStatus && (
                        <SkillChip
                          name={step.skillId || ''}
                          status={step.currentStatus}
                          score={step.currentScore}
                        />
                      )}
                      {step.isClosingStep && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand-accent border border-brand/20">
                          Capstone Step
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-sub leading-relaxed">{step.whyItMatters}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCollapse(step.id)}
                    className="p-1 rounded-lg text-sub hover:text-main focus:outline-none"
                    aria-label={isCollapsed ? 'Expand step' : 'Collapse step'}
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>

                {/* Collapsible Body */}
                {!isCollapsed && (
                  <div className="space-y-4 pt-3 border-t border-app animate-fadeIn">
                    {/* Topics to Learn Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Core Curriculum Topics</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {step.topicsToLearn.map((topic) => (
                          <span
                            key={topic}
                            className="text-xs px-2.5 py-1 rounded-lg bg-raised border border-app text-sub"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Practical Project Showcase */}
                    <div className="p-3.5 rounded-xl bg-raised border border-app space-y-1">
                      <span className="text-[11px] font-bold text-brand-accent uppercase tracking-wider flex items-center gap-1.5">
                        <FolderGit2 className="w-3.5 h-3.5" />
                        <span>Recommended Practice Project</span>
                      </span>
                      <p className="text-xs text-main leading-relaxed">{step.practiceProject}</p>
                    </div>

                    {/* Effort Estimate and Status Controller */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <span className="text-xs text-muted flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Effort: <strong>{step.effortLabel}</strong></span>
                      </span>

                      {/* Status Segmented Controls */}
                      <div className="inline-flex rounded-xl bg-raised border border-app p-1 text-xs font-semibold">
                        {[
                          { id: 'not_started', label: 'Not Started' },
                          { id: 'in_progress', label: 'In Progress' },
                          { id: 'done', label: 'Done' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => handleStatusChange(step.id, btn.id as any)}
                            className={`px-3 py-1.5 rounded-lg transition-colors ${
                              step.progressStatus === btn.id
                                ? btn.id === 'done'
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : 'bg-brand text-white shadow-sm'
                                : 'text-sub hover:text-main'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Assessment Verify CTA if not verified */}
                    {step.skillId && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate('/assessment', { state: { preselectedSkillId: step.skillId } })}
                          className="inline-flex items-center gap-1.5 text-xs text-brand-accent hover:underline font-semibold"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Verify this skill through assessment →</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
