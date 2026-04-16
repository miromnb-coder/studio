'use client';

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CircleDollarSign,
  Clock3,
  ListChecks,
} from 'lucide-react';
import type { OperatorResponse } from '@/types/operator-response';

type OperatorResponseCardProps = {
  operatorResponse?: OperatorResponse;
};

type FieldTone = 'neutral' | 'risk' | 'opportunity';

type FieldRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: FieldTone;
};

function normalizeValue(value?: string): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function toneClasses(tone: FieldTone): string {
  if (tone === 'risk') {
    return 'border-[rgba(245,205,175,0.58)] bg-[rgba(255,245,237,0.82)] text-[#7f4a2f]';
  }

  if (tone === 'opportunity') {
    return 'border-[rgba(188,224,210,0.62)] bg-[rgba(240,252,247,0.82)] text-[#275f49]';
  }

  return 'border-[rgba(207,216,228,0.72)] bg-[rgba(246,249,252,0.8)] text-[#405064]';
}

function FieldRow({ icon, label, value, tone = 'neutral' }: FieldRowProps) {
  return (
    <div
      className={[
        'rounded-2xl border px-3.5 py-3 sm:px-4',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]',
        toneClasses(tone),
      ].join(' ')}
    >
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-[14px] leading-[1.6] tracking-[-0.01em] sm:text-[15px]">{value}</p>
    </div>
  );
}

function ActionPill({ label }: { label: string }) {
  return (
    <li className="rounded-full border border-[rgba(207,216,228,0.82)] bg-white/82 px-3 py-1.5 text-[12px] font-medium tracking-[-0.008em] text-[#344255] shadow-[0_6px_16px_rgba(15,23,42,0.04)]">
      {label}
    </li>
  );
}

export function OperatorResponseCard({ operatorResponse }: OperatorResponseCardProps) {
  if (!operatorResponse) return null;

  const nextStep = normalizeValue(operatorResponse.nextStep);
  const decisionBrief = normalizeValue(operatorResponse.decisionBrief);
  const risk = normalizeValue(operatorResponse.risk);
  const savingsOpportunity = normalizeValue(operatorResponse.savingsOpportunity);
  const timeOpportunity = normalizeValue(operatorResponse.timeOpportunity);

  const actions = (operatorResponse.actions ?? [])
    .map((action) => normalizeValue(action?.label))
    .filter((label): label is string => Boolean(label))
    .slice(0, 4);

  const hasRenderableData = Boolean(
    nextStep ||
      decisionBrief ||
      risk ||
      savingsOpportunity ||
      timeOpportunity ||
      actions.length,
  );

  if (!hasRenderableData) return null;

  return (
    <section className="mt-5 overflow-hidden rounded-[22px] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,249,253,0.84))] p-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:mt-6 sm:p-4">
      <div className="mb-3.5 flex items-center gap-2.5 px-0.5">
        <div className="h-1.5 w-1.5 rounded-full bg-[rgba(103,125,159,0.7)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f7e93]">
          Operator insight
        </span>
      </div>

      <div className="space-y-2.5">
        {nextStep ? (
          <FieldRow
            icon={<ArrowRight className="h-3.5 w-3.5" />}
            label="Next Step"
            value={nextStep}
          />
        ) : null}

        {decisionBrief ? (
          <FieldRow
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Decision Brief"
            value={decisionBrief}
          />
        ) : null}

        {risk ? (
          <FieldRow
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            label="Risk Warning"
            value={risk}
            tone="risk"
          />
        ) : null}

        {savingsOpportunity ? (
          <FieldRow
            icon={<CircleDollarSign className="h-3.5 w-3.5" />}
            label="Savings Opportunity"
            value={savingsOpportunity}
            tone="opportunity"
          />
        ) : null}

        {timeOpportunity ? (
          <FieldRow
            icon={<Clock3 className="h-3.5 w-3.5" />}
            label="Time Opportunity"
            value={timeOpportunity}
            tone="opportunity"
          />
        ) : null}
      </div>

      {actions.length > 0 ? (
        <div className="mt-3.5 rounded-2xl border border-[rgba(207,216,228,0.72)] bg-white/64 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:px-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#637287]">
            <ListChecks className="h-3.5 w-3.5" />
            Actions
          </div>
          <ul className="flex flex-wrap gap-2">
            {actions.map((label, index) => (
              <ActionPill key={`${label}-${index}`} label={label} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
