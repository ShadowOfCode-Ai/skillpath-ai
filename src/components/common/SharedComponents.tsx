/**
 * @file SharedComponents.tsx
 * Design-token compliant shared UI components:
 * ScoreRing, SkillChip, ScoreBar, EvidenceMeter, FormulaPanel, StatCard, and JourneyStepper.
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { SkillStatus, VERIFY_THRESHOLD } from '../../config/scoring';

// ---------------------------------------------------------------------------
// 1. StatCard
// ---------------------------------------------------------------------------
export interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  hint: string;
  accent?: boolean;
}

export function StatCard({ icon, value, label, hint, accent }: StatCardProps) {
  return (
    <div
      className={`card-elevated p-5 transition-all duration-200 ${
        accent ? 'border-brand/40 bg-brand/5 dark:bg-brand/10 ring-1 ring-brand/30' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sub text-xs uppercase tracking-wider font-semibold">{label}</span>
        <div className="p-2 rounded-xl bg-raised border border-app text-brand-accent">{icon}</div>
      </div>
      <div className="text-3xl font-extrabold tracking-tight tabular-nums text-main mb-1">
        {value}
      </div>
      <p className="text-xs text-muted truncate">{hint}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. ScoreRing (SVG, 96-120px, stroke 10, tabular numbers, provisional badge)
// ---------------------------------------------------------------------------
export interface ScoreRingProps {
  score: number; // 0 - 100
  size?: number; // default 104
  strokeWidth?: number; // default 10
  isProvisional?: boolean;
  label?: string;
}

export function ScoreRing({
  score,
  size = 104,
  strokeWidth = 10,
  isProvisional = false,
  label,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const offset = circumference - (safeScore / 100) * circumference;

  // Band colors: 75+ emerald, 50-74 blue, 25-49 amber, <25 slate
  let strokeColor = '#94A3B8'; // Slate
  if (safeScore >= 75) {
    strokeColor = '#34D399'; // Emerald
  } else if (safeScore >= 50) {
    strokeColor = '#3B82F6'; // Blue
  } else if (safeScore >= 25) {
    strokeColor = '#FBBF24'; // Amber
  }

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-border opacity-30"
        />
        {/* Animated score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Centered Score */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold tabular-nums tracking-tight text-main leading-none">
          {safeScore}%
        </span>
        {label && <span className="text-[10px] text-muted font-medium mt-0.5">{label}</span>}
        {isProvisional && (
          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mt-0.5 px-1 py-0.2 rounded bg-amber-500/10">
            Provisional
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. SkillChip
// ---------------------------------------------------------------------------
export interface SkillChipProps {
  name: string;
  status: SkillStatus;
  score?: number;
  reason?: string;
  onClick?: () => void;
  onRemove?: () => void;
}

export function SkillChip({
  name,
  status,
  score,
  reason,
  onClick,
  onRemove,
}: SkillChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  let icon = <HelpCircle className="w-3.5 h-3.5" />;
  let chipClass = 'chip-unverified';
  let statusText = 'Unverified';

  if (status === 'VERIFIED') {
    icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    chipClass = 'chip-verified';
    statusText = 'Verified';
  } else if (status === 'DEVELOPING') {
    icon = <Clock className="w-3.5 h-3.5 text-amber-500" />;
    chipClass = 'chip-developing';
    statusText = 'Developing';
  } else if (status === 'NOT_FOUND') {
    icon = <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    chipClass = 'chip-missing';
    statusText = 'Missing';
  }

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={onClick}
        className={`chip ${chipClass} ${
          onClick ? 'cursor-pointer hover:opacity-90' : ''
        } transition-all duration-150 select-none`}
      >
        {icon}
        <span className="font-semibold">{name}</span>
        {score !== undefined && (
          <span className="tabular-nums font-bold text-[11px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
            {score}%
          </span>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 text-muted hover:text-red-400 focus:outline-none"
            aria-label={`Remove ${name}`}
          >
            ×
          </button>
        )}
      </span>

      {/* Tooltip with plain-language reason */}
      {showTooltip && (reason || statusText) && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-xl bg-surface border border-app shadow-xl text-xs text-main pointer-events-none animate-fadeIn">
          <div className="font-semibold text-brand-accent mb-0.5">{statusText}</div>
          <p className="text-sub leading-snug">{reason || `Status: ${statusText}`}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. ScoreBar with 60% threshold tick & EvidenceMeter (5 segments)
// ---------------------------------------------------------------------------
export interface ScoreBarProps {
  score: number; // 0 - 100
  threshold?: number; // default 60
  label?: string;
}

export function ScoreBar({ score, threshold = VERIFY_THRESHOLD, label }: ScoreBarProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const isPassing = safeScore >= threshold;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-sub font-medium">{label}</span>
          <span className="text-main font-bold tabular-nums">{safeScore}%</span>
        </div>
      )}
      <div className="relative h-2.5 w-full bg-raised rounded-full overflow-hidden border border-app">
        {/* Threshold marker tick at 60% */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-text-muted z-10 opacity-70"
          style={{ left: `${threshold}%` }}
          title={`Verification threshold: ${threshold}%`}
        />
        {/* Progress fill */}
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isPassing ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
          style={{ width: `${safeScore}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1 tabular-nums">
        <span>0%</span>
        <span className="text-amber-500 font-medium">Req {threshold}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export function EvidenceMeter({ coverage }: { coverage: number }) {
  // coverage: 0.0 - 1.0; 5 segments
  const filledSegments = Math.round(coverage * 5);
  const percentage = Math.round(coverage * 100);

  return (
    <div className="flex items-center gap-1.5" title={`Evidence coverage: ${percentage}% of required skills assessed`}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((seg) => (
          <div
            key={seg}
            className={`h-1.5 w-4 rounded-sm ${
              seg <= filledSegments ? 'bg-blue-500' : 'bg-border opacity-40'
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted tabular-nums font-medium">{percentage}% assessed</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. FormulaPanel (Monospace arithmetic breakdown)
// ---------------------------------------------------------------------------
export function FormulaPanel({ formula, title = 'Formula Breakdown' }: { formula: string; title?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-app bg-raised/50 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-2.5 text-sub hover:text-main font-medium focus:outline-none transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-brand-accent" />
          <span>{title}</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="p-3 border-t border-app bg-surface font-mono text-[11px] text-brand-accent tracking-wide whitespace-pre-wrap break-all">
          {formula}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. JourneyStepper (Real state: Profile · Resume · Skills · Assess · Careers · Roadmap · Matches)
// ---------------------------------------------------------------------------
export interface JourneyStep {
  id: string;
  name: string;
  path: string;
}

export const JOURNEY_STEPS: JourneyStep[] = [
  { id: 'profile', name: 'Profile', path: '/profile' },
  { id: 'resume', name: 'Resume', path: '/resume' },
  { id: 'skills', name: 'Skills', path: '/skills' },
  { id: 'assess', name: 'Assess', path: '/assessment' },
  { id: 'careers', name: 'Careers', path: '/careers' },
  { id: 'roadmap', name: 'Roadmap', path: '/roadmap' },
  { id: 'matches', name: 'Matches', path: '/opportunities' },
];

export function JourneyStepper({ currentStepId }: { currentStepId: string }) {
  const currentIndex = JOURNEY_STEPS.findIndex((s) => s.id === currentStepId);

  return (
    <div className="w-full overflow-x-auto py-2 no-scrollbar">
      <div className="flex items-center min-w-max gap-2 text-xs">
        {JOURNEY_STEPS.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors ${
                  isCurrent
                    ? 'bg-brand text-white shadow-sm ring-2 ring-brand/30'
                    : isDone
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'text-muted bg-raised border border-app'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                )}
                <span>{step.name}</span>
              </div>
              {idx < JOURNEY_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-3 rounded ${
                    currentIndex > idx ? 'bg-emerald-500/60' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
