'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { PLAN_CONFIG, type PlanId } from '@/lib/plans';

type UpgradeReason = 'default' | 'limit_reached' | 'premium_feature';

type PlanCardProps = {
  plan: PlanId;
  selected: boolean;
  currentPlan: PlanId;
  onSelect: (plan: PlanId) => void;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'cancel',
    question: 'Can I cancel anytime?',
    answer:
      'Yes. You can cancel whenever you want, and your paid features remain active until the current billing period ends.',
  },
  {
    id: 'free',
    question: 'What happens if I stay on Free?',
    answer:
      'You can still use Kivo on the Free plan, but with lower monthly limits and fewer premium features.',
  },
  {
    id: 'history',
    question: 'Will my conversations stay?',
    answer:
      'Yes. Your conversations remain in your account. Upgrading mainly changes limits and feature access.',
  },
  {
    id: 'reset',
    question: 'When do limits reset?',
    answer:
      'Monthly limits reset at the start of your next billing or usage cycle, depending on your plan setup.',
  },
];

export function KivoUpgradeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('plus');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const reason = (searchParams.get('reason') as UpgradeReason | null) ?? 'default';
  const currentPlan = ((searchParams.get('plan') as PlanId | null) ?? 'free') as PlanId;
  const currentUsage = searchParams.get('current');
  const currentLimit = searchParams.get('limit');

  const heroCopy = useMemo(() => {
    if (reason === 'limit_reached') {
      return {
        title: 'You reached your current limit',
        subtitle:
          'Upgrade to keep using Kivo with more messages, more agent runs, and deeper tools.',
      };
    }

    if (reason === 'premium_feature') {
      return {
        title: 'Unlock premium Kivo features',
        subtitle:
          'Upgrade to access memory, premium tools, and more advanced workflows.',
      };
    }

    return {
      title: 'Choose your Kivo plan',
      subtitle:
        'More messages, more agent runs, and deeper tools when you need them.',
    };
  }, [reason]);

  const currentPlanLabel = PLAN_CONFIG[currentPlan]?.label ?? 'Free';
  const selectedConfig = PLAN_CONFIG[selectedPlan];

  const currentPlanBlockText = (() => {
    if (reason === 'limit_reached' && currentUsage && currentLimit) {
      return `You’ve used ${currentUsage} / ${currentLimit} available runs.`;
    }

    if (reason === 'premium_feature') {
      return 'You opened a feature that is available in a paid plan.';
    }

    return `You are currently on the ${currentPlanLabel} plan.`;
  })();

  const comparisonRows = [
    {
      label: 'Messages',
      free: `${PLAN_CONFIG.free.limits.messages_month}/mo`,
      plus: `${PLAN_CONFIG.plus.limits.messages_month}/mo`,
      pro: `${PLAN_CONFIG.pro.limits.messages_month}/mo`,
    },
    {
      label: 'Agent runs',
      free: `${PLAN_CONFIG.free.limits.agent_runs_month}/mo`,
      plus: `${PLAN_CONFIG.plus.limits.agent_runs_month}/mo`,
      pro: `${PLAN_CONFIG.pro.limits.agent_runs_month}/mo`,
    },
    {
      label: 'File analysis',
      free: `${PLAN_CONFIG.free.limits.file_analyses_month}/mo`,
      plus: `${PLAN_CONFIG.plus.limits.file_analyses_month}/mo`,
      pro: `${PLAN_CONFIG.pro.limits.file_analyses_month}/mo`,
    },
    {
      label: 'Memory',
      free: PLAN_CONFIG.free.limits.memory_enabled ? 'Included' : '—',
      plus: PLAN_CONFIG.plus.limits.memory_enabled ? 'Included' : '—',
      pro: PLAN_CONFIG.pro.limits.memory_enabled ? 'Included' : '—',
    },
    {
      label: 'Premium tools',
      free: PLAN_CONFIG.free.limits.premium_tools_enabled ? 'Included' : '—',
      plus: PLAN_CONFIG.plus.limits.premium_tools_enabled ? 'Included' : '—',
      pro: PLAN_CONFIG.pro.limits.premium_tools_enabled ? 'Included' : '—',
    },
    {
      label: 'Automations',
      free: String(PLAN_CONFIG.free.limits.automations_max),
      plus: String(PLAN_CONFIG.plus.limits.automations_max),
      pro: String(PLAN_CONFIG.pro.limits.automations_max),
    },
  ];

  const handleChoosePlan = (plan: PlanId) => {
    setSelectedPlan(plan);

    // TODO: replace with Stripe checkout / billing flow
    window.alert(`Connect billing for ${PLAN_CONFIG[plan].label}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#2f3640]">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.92),rgba(245,245,247,1)_58%)] shadow-[0_24px_80px_rgba(31,41,55,0.08)]">
        <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-[rgba(245,245,247,0.78)] px-5 pb-3 pt-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.05] bg-white/60 text-[#3c4450] transition-all duration-200 ease-out hover:bg-white active:scale-[0.985]"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>

            <h1 className="text-[21px] font-medium tracking-[-0.04em] text-[#2f3640]">
              Upgrade
            </h1>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-full px-2 text-[14px] font-medium text-[#6f7785]"
            >
              Restore
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-5 pb-[124px] pt-5">
          <section className="mb-6">
            <h2 className="text-[34px] font-semibold tracking-[-0.06em] text-[#2f3640]">
              {heroCopy.title}
            </h2>

            <p className="mt-3 max-w-[480px] text-[15px] leading-7 text-[#6f7785]">
              {heroCopy.subtitle}
            </p>

            <p className="mt-3 text-[14px] leading-6 text-[#8a919e]">
              Built to stay lighter and more affordable than many AI apps.
            </p>
          </section>

          <section className="mb-6 rounded-[24px] border border-black/[0.05] bg-white/80 px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[#4467a8]">
                <Sparkles className="h-5 w-5" strokeWidth={1.9} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium tracking-[-0.02em] text-[#2f3640]">
                  Current plan: {currentPlanLabel}
                </p>
                <p className="mt-1 text-[14px] leading-6 text-[#7a8190]">
                  {currentPlanBlockText}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <PlanCard
              plan="free"
              selected={selectedPlan === 'free'}
              currentPlan={currentPlan}
              onSelect={setSelectedPlan}
            />
            <PlanCard
              plan="plus"
              selected={selectedPlan === 'plus'}
              currentPlan={currentPlan}
              onSelect={setSelectedPlan}
            />
            <PlanCard
              plan="pro"
              selected={selectedPlan === 'pro'}
              currentPlan={currentPlan}
              onSelect={setSelectedPlan}
            />
          </section>

          <section className="mt-8">
            <h3 className="text-[18px] font-medium tracking-[-0.03em] text-[#2f3640]">
              Compare plans
            </h3>

            <div className="mt-4 overflow-hidden rounded-[22px] border border-black/[0.05] bg-white/72 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-2 border-b border-black/[0.05] px-4 py-3 text-[13px] font-medium text-[#7a8190]">
                <span>Feature</span>
                <span className="text-center">Free</span>
                <span className="text-center">Plus</span>
                <span className="text-center">Pro</span>
              </div>

              {comparisonRows.map((row, index) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] gap-2 px-4 py-3 text-[13px] ${
                    index !== comparisonRows.length - 1
                      ? 'border-b border-black/[0.05]'
                      : ''
                  }`}
                >
                  <span className="font-medium text-[#374151]">{row.label}</span>
                  <span className="text-center text-[#7a8190]">{row.free}</span>
                  <span className="text-center text-[#374151]">{row.plus}</span>
                  <span className="text-center text-[#374151]">{row.pro}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-[18px] font-medium tracking-[-0.03em] text-[#2f3640]">
              What changes when you upgrade
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <ValueCard
                title="Use Kivo more often"
                description="Higher limits for regular daily use."
              />
              <ValueCard
                title="Run deeper workflows"
                description="More room for agent tasks and planning."
              />
              <ValueCard
                title="Unlock premium tools"
                description="Access more advanced features and tools."
              />
              <ValueCard
                title="Handle files reliably"
                description="Better support for analysis and attachments."
              />
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-[18px] font-medium tracking-[-0.03em] text-[#2f3640]">
              Questions
            </h3>

            <div className="mt-4 overflow-hidden rounded-[22px] border border-black/[0.05] bg-white/72 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              {FAQ_ITEMS.map((item, index) => {
                const open = openFaqId === item.id;

                return (
                  <div
                    key={item.id}
                    className={
                      index !== FAQ_ITEMS.length - 1
                        ? 'border-b border-black/[0.05]'
                        : ''
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFaqId((prev) => (prev === item.id ? null : item.id))
                      }
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-all duration-200 ease-out hover:bg-white/70 active:scale-[0.995]"
                    >
                      <span className="text-[15px] font-medium tracking-[-0.02em] text-[#2f3640]">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#98a0ad] transition-transform duration-200 ${
                          open ? 'rotate-180' : ''
                        }`}
                        strokeWidth={2}
                      />
                    </button>

                    {open ? (
                      <div className="px-4 pb-4">
                        <p className="text-[14px] leading-6 text-[#7a8190]">
                          {item.answer}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] border-t border-black/[0.05] bg-[rgba(245,245,247,0.9)] px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-2xl">
          <div className="flex items-center gap-3 rounded-[24px] border border-black/[0.05] bg-white/88 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-[-0.01em] text-[#8a919e]">
                Selected plan
              </p>
              <p className="mt-1 text-[16px] font-medium tracking-[-0.03em] text-[#2f3640]">
                {selectedConfig.label} · €
                {selectedConfig.monthlyPriceEur.toFixed(2)}
                <span className="ml-1 text-[14px] font-normal text-[#8a919e]">
                  / month
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleChoosePlan(selectedPlan)}
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#111111] px-5 text-[14px] font-medium text-white transition-all duration-200 ease-out hover:opacity-95 active:scale-[0.985]"
            >
              {selectedPlan === 'free'
                ? 'Stay on Free'
                : `Choose ${selectedConfig.label}`}
              <ChevronRight className="ml-2 h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  currentPlan,
  onSelect,
}: PlanCardProps) {
  const config = PLAN_CONFIG[plan];
  const isCurrent = currentPlan === plan;
  const isPlus = plan === 'plus';

  const highlights =
    plan === 'free'
      ? [
          'Good for trying Kivo',
          `${config.limits.messages_month} messages / month`,
          `${config.limits.agent_runs_month} agent runs / month`,
          'Basic tools',
        ]
      : plan === 'plus'
        ? [
            'Best for most users',
            `${config.limits.messages_month} messages / month`,
            `${config.limits.agent_runs_month} agent runs / month`,
            'Memory included',
            'Premium tools included',
          ]
        : [
            'For heavier use',
            `${config.limits.messages_month} messages / month`,
            `${config.limits.agent_runs_month} agent runs / month`,
            'Higher automation limits',
            'Premium tools included',
          ];

  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className={`relative w-full rounded-[28px] border p-5 text-left transition-all duration-200 ease-out active:scale-[0.992] ${
        selected
          ? 'border-black/[0.08] bg-white shadow-[0_16px_34px_rgba(15,23,42,0.08)]'
          : 'border-black/[0.05] bg-white/72 shadow-[0_10px_24px_rgba(15,23,42,0.05)] hover:bg-white hover:shadow-[0_16px_34px_rgba(15,23,42,0.07)]'
      }`}
    >
      {isPlus ? (
        <div className="mb-3 inline-flex rounded-full bg-[#111111] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-white">
          Best value
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[24px] font-semibold tracking-[-0.05em] text-[#2f3640]">
            {config.label}
          </h3>
          <p className="mt-2 text-[28px] font-semibold tracking-[-0.06em] text-[#2f3640]">
            €{config.monthlyPriceEur.toFixed(2)}
            <span className="ml-1 text-[14px] font-normal text-[#8a919e]">
              / month
            </span>
          </p>
        </div>

        <div
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${
            selected
              ? 'border-[#111111] bg-[#111111] text-white'
              : 'border-black/[0.08] bg-white text-transparent'
          }`}
        >
          <Check className="h-4 w-4" strokeWidth={2.2} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {highlights.map((item) => (
          <div key={item} className="flex items-center gap-2 text-[14px] text-[#5f6672]">
            <Check className="h-4 w-4 shrink-0 text-[#3b4656]" strokeWidth={2.2} />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-5">
        {isCurrent ? (
          <div className="inline-flex h-11 items-center justify-center rounded-full border border-black/[0.06] bg-[#f7f8fb] px-4 text-[14px] font-medium text-[#6f7785]">
            Current plan
          </div>
        ) : (
          <div
            className={`inline-flex h-11 items-center justify-center rounded-full px-4 text-[14px] font-medium ${
              isPlus
                ? 'bg-[#111111] text-white'
                : 'border border-black/[0.06] bg-white text-[#374151]'
            }`}
          >
            {plan === 'free' ? 'Choose Free' : `Choose ${config.label}`}
          </div>
        )}
      </div>
    </button>
  );
}

function ValueCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-black/[0.05] bg-white/72 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <p className="text-[15px] font-medium tracking-[-0.02em] text-[#2f3640]">
        {title}
      </p>
      <p className="mt-2 text-[14px] leading-6 text-[#7a8190]">
        {description}
      </p>
    </div>
  );
}
