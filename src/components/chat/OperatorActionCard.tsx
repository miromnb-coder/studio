'use client';

import { AlertTriangle, ArrowUpRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { OperatorResponse } from '@/types/operator-response';

type OperatorActionCardProps = {
  operatorResponse?: OperatorResponse;
  userInput?: string;
  intent?: string;
};

type CardSection = {
  key: 'next-step' | 'decision' | 'opportunity' | 'risk';
  label: string;
  value: string;
  tone?: 'neutral' | 'opportunity' | 'risk';
};

const LOW_VALUE_PATTERNS = [
  /^(hi|hello|hey|thanks|thank you|ok|okay|cool|great|nice|yo|sup)[!.\s]*$/i,
  /^(mitä kuuluu|mita kuuluu|kiitos|hei|moi)[!.\s]*$/i,
  /^(how are you|what\'s up|whats up)[!.\s]*$/i,
];

function clean(value?: string): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function isLowValuePrompt(input?: string): boolean {
  const normalized = clean(input);
  if (!normalized) return false;
  return LOW_VALUE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isLikelyHighValueIntent(intent?: string): boolean {
  if (!intent) return false;
  return ['finance', 'decision', 'productivity', 'schedule', 'follow_up', 'task'].includes(intent);
}

function sectionToneClasses(tone: CardSection['tone']): string {
  if (tone === 'risk') {
    return 'border-[rgba(245,218,198,0.85)] bg-[rgba(255,247,242,0.96)] text-[#75452a]';
  }
  if (tone === 'opportunity') {
    return 'border-[rgba(197,229,214,0.85)] bg-[rgba(245,253,249,0.96)] text-[#24563f]';
  }
  return 'border-[rgba(214,223,234,0.9)] bg-[rgba(251,253,255,0.95)] text-[#35465a]';
}

export function OperatorActionCard({
  operatorResponse,
  userInput,
  intent,
}: OperatorActionCardProps) {
  if (!operatorResponse) return null;

  const nextStep = clean(operatorResponse.nextStep);
  const decision = clean(operatorResponse.decisionBrief);
  const risk = clean(operatorResponse.risk);
  const opportunity = clean(operatorResponse.opportunity);
  const fallbackOpportunity = [
    clean(operatorResponse.savingsOpportunity),
    clean(operatorResponse.timeOpportunity),
  ]
    .filter(Boolean)
    .join(' · ');

  const actions = (operatorResponse.actions ?? [])
    .map((action) => clean(action?.label))
    .filter((label): label is string => Boolean(label))
    .slice(0, 3);

  const sections: CardSection[] = [
    nextStep
      ? {
          key: 'next-step',
          label: 'Next step',
          value: nextStep,
        }
      : null,
    decision
      ? {
          key: 'decision',
          label: 'Decision',
          value: decision,
        }
      : null,
    (opportunity || fallbackOpportunity)
      ? {
          key: 'opportunity',
          label: 'Opportunity',
          value: opportunity || fallbackOpportunity,
          tone: 'opportunity',
        }
      : null,
    risk
      ? {
          key: 'risk',
          label: 'Risk',
          value: risk,
          tone: 'risk',
        }
      : null,
  ].filter((section): section is CardSection => Boolean(section));

  const hasValue = sections.length > 0 || actions.length > 0;
  if (!hasValue) return null;

  if (isLowValuePrompt(userInput) && !isLikelyHighValueIntent(intent)) {
    return null;
  }

  return (
    <section className="mt-5 rounded-3xl border border-[rgba(218,226,237,0.85)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,251,255,0.94))] p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:mt-6 sm:p-5">
      <div className="space-y-2.5">
        {sections.map((section) => (
          <div
            key={section.key}
            className={`rounded-2xl border px-3.5 py-3.5 sm:px-4 ${sectionToneClasses(section.tone)}`}
          >
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">
              {section.label}
            </p>
            <p className="text-[14px] leading-[1.6] tracking-[-0.01em] sm:text-[15px]">{section.value}</p>
          </div>
        ))}
      </div>

      {actions.length ? (
        <div className="mt-3.5 border-t border-[rgba(220,228,238,0.9)] pt-3.5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#68798f]">Actions</p>
          <div className="flex flex-wrap gap-2">
            {actions.map((label, index) => (
              <button
                key={`${label}-${index}`}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(208,218,230,0.9)] bg-white px-3 py-1.5 text-[12px] font-medium text-[#33465f]"
              >
                {index === 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : null}
                {index === 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                {index === 2 ? <Sparkles className="h-3.5 w-3.5" /> : null}
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!actions.length && sections.some((section) => section.key === 'risk') ? (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-[#85553a]">
          <AlertTriangle className="h-3.5 w-3.5" />
          Keep this in mind before executing the next move.
        </div>
      ) : null}
    </section>
  );
}
