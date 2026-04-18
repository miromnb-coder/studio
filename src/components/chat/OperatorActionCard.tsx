'use client';

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { OperatorResponse } from '@/types/operator-response';
import type { ResponseMode } from '@/agent/types/response-mode';

type OperatorActionCardProps = {
  operatorResponse?: OperatorResponse;
  userInput?: string;
  intent?: string;
  responseMode?: ResponseMode;
  onActionClick?: (actionId: string) => void;
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
  return [
    'finance',
    'decision',
    'productivity',
    'schedule',
    'follow_up',
    'task',
    'compare',
    'research',
  ].includes(intent);
}

function sectionToneClasses(tone: CardSection['tone']): string {
  if (tone === 'risk') {
    return 'border-[rgba(245,218,198,0.9)] bg-[linear-gradient(180deg,rgba(255,249,245,0.98),rgba(255,244,238,0.94))] text-[#78462c]';
  }

  if (tone === 'opportunity') {
    return 'border-[rgba(201,232,217,0.9)] bg-[linear-gradient(180deg,rgba(245,253,249,0.98),rgba(239,250,244,0.94))] text-[#24563f]';
  }

  return 'border-[rgba(217,226,237,0.92)] bg-[linear-gradient(180deg,rgba(252,253,255,0.98),rgba(247,250,254,0.94))] text-[#34475c]';
}

function sectionIcon(key: CardSection['key']) {
  switch (key) {
    case 'next-step':
      return ArrowUpRight;
    case 'decision':
      return CheckCircle2;
    case 'opportunity':
      return Zap;
    case 'risk':
      return ShieldAlert;
    default:
      return Sparkles;
  }
}

function actionIcon(index: number) {
  if (index === 0) return ArrowUpRight;
  if (index === 1) return CheckCircle2;
  return Sparkles;
}

export function OperatorActionCard({
  operatorResponse,
  userInput,
  intent,
  responseMode,
  onActionClick,
}: OperatorActionCardProps) {
  if (!operatorResponse) return null;
  if (responseMode === 'casual') return null;

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
    .map((action) => ({
      id: clean(action?.id),
      label: clean(action?.label),
      detail: clean(action?.detail),
    }))
    .filter(
      (action): action is { id: string; label: string; detail: string } =>
        Boolean(action.id && action.label),
    )
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
    opportunity || fallbackOpportunity
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

  if (responseMode === 'fast' && !isLikelyHighValueIntent(intent)) {
    return null;
  }

  if (responseMode === 'fallback' && actions.length === 0 && sections.length < 2) {
    return null;
  }

  if (isLowValuePrompt(userInput) && !isLikelyHighValueIntent(intent)) {
    return null;
  }

  const primarySection = sections[0];
  const riskSection = sections.find((section) => section.key === 'risk');
  const opportunitySection = sections.find((section) => section.key === 'opportunity');

  return (
    <section className="mt-5 sm:mt-6">
      <div className="overflow-hidden rounded-[30px] border border-[rgba(218,226,237,0.84)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,255,0.94))] shadow-[0_18px_48px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="relative border-b border-[rgba(225,232,241,0.92)] px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(115,177,255,0.16),transparent_45%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_40%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(214,224,235,0.95)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6e7e93]">
                <Sparkles className="h-3.5 w-3.5" />
                Operator action
              </span>

              {primarySection ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(219,228,238,0.95)] bg-[rgba(250,252,255,0.9)] px-3 py-1.5 text-[11px] font-medium text-[#5f7086]">
                  <Clock3 className="h-3.5 w-3.5" />
                  Best next move ready
                </span>
              ) : null}
            </div>

            {primarySection ? (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a98aa]">
                  Immediate focus
                </p>
                <h3 className="mt-2 max-w-[860px] text-[20px] font-semibold leading-[1.2] tracking-[-0.03em] text-[#1f2937] sm:text-[24px]">
                  {primarySection.value}
                </h3>
              </div>
            ) : null}

            {(opportunitySection || riskSection) ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {opportunitySection ? (
                  <div className="rounded-[22px] border border-[rgba(201,232,217,0.9)] bg-[linear-gradient(180deg,rgba(244,252,247,0.96),rgba(238,249,242,0.92))] p-4">
                    <div className="flex items-center gap-2 text-[#2f6b49]">
                      <Zap className="h-4 w-4" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                        Opportunity
                      </p>
                    </div>
                    <p className="mt-2 text-[14px] leading-[1.6] text-[#2d4e3d]">
                      {opportunitySection.value}
                    </p>
                  </div>
                ) : null}

                {riskSection ? (
                  <div className="rounded-[22px] border border-[rgba(245,218,198,0.9)] bg-[linear-gradient(180deg,rgba(255,249,245,0.96),rgba(255,244,238,0.92))] p-4">
                    <div className="flex items-center gap-2 text-[#8b5531]">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                        Risk
                      </p>
                    </div>
                    <p className="mt-2 text-[14px] leading-[1.6] text-[#6e462e]">
                      {riskSection.value}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {sections.length > 1 ? (
          <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-5 sm:py-5">
            {sections.slice(1).map((section) => {
              const Icon = sectionIcon(section.key);

              return (
                <div
                  key={section.key}
                  className={`rounded-[24px] border px-4 py-4 sm:px-4.5 sm:py-4.5 ${sectionToneClasses(section.tone)}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-current/10 bg-white/70">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">
                      {section.label}
                    </p>
                  </div>
                  <p className="mt-3 text-[14px] leading-[1.65] tracking-[-0.01em] sm:text-[15px]">
                    {section.value}
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}

        {actions.length ? (
          <div className="border-t border-[rgba(226,233,242,0.9)] px-4 py-4 sm:px-5 sm:py-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#72849a]">
                Execute next
              </p>
              <p className="text-[11px] text-[#98a4b3]">{actions.length} options</p>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {actions.map((action, index) => {
                const Icon = actionIcon(index);

                return (
                  <button
                    key={`${action.id}-${index}`}
                    type="button"
                    onClick={() => onActionClick?.(action.id)}
                    className="group rounded-[22px] border border-[rgba(215,224,235,0.95)] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(249,251,255,0.96))] p-3 text-left transition duration-200 hover:-translate-y-[1px] hover:border-[rgba(190,205,224,1)] hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(224,231,239,0.95)] bg-white text-[#53677f]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9aa6b5] transition group-hover:text-[#314154]" />
                    </div>

                    <p className="mt-3 text-[14px] font-semibold leading-[1.45] text-[#253244]">
                      {action.label}
                    </p>

                    {action.detail ? (
                      <p className="mt-1 text-[12px] leading-[1.55] text-[#7a8798]">
                        {action.detail}
                      </p>
                    ) : (
                      <p className="mt-1 text-[12px] leading-[1.55] text-[#8d98a7]">
                        Run this as the next guided step.
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {!actions.length && riskSection ? (
          <div className="border-t border-[rgba(226,233,242,0.9)] px-4 py-3.5 text-[12px] text-[#85553a] sm:px-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              Keep this risk in mind before executing the next move.
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
