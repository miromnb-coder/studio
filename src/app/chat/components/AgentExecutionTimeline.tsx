'use client';

import { motion } from 'framer-motion';
import { Check, CircleAlert, FileText, Search, Sparkles } from 'lucide-react';

export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export type ExecutionStep = {
  id: string;
  label: string;
  status: ExecutionStepStatus;
  summary?: string;
};

type AgentExecutionTimelineProps = {
  steps: ExecutionStep[];
};

function normalizeLabel(label: string) {
  return label.trim() || 'Working';
}

function pickStepIcon(label: string) {
  const normalized = label.toLowerCase();

  if (
    normalized.includes('read') ||
    normalized.includes('review') ||
    normalized.includes('memory') ||
    normalized.includes('file') ||
    normalized.includes('context')
  ) {
    return FileText;
  }

  if (
    normalized.includes('check') ||
    normalized.includes('search') ||
    normalized.includes('find') ||
    normalized.includes('scan') ||
    normalized.includes('inspect')
  ) {
    return Search;
  }

  return Sparkles;
}

function getStatusCopy(status: ExecutionStepStatus) {
  switch (status) {
    case 'running':
      return 'In progress';
    case 'completed':
      return 'Done';
    case 'failed':
      return 'Issue';
    case 'pending':
    default:
      return 'Queued';
  }
}

function getStatusClasses(status: ExecutionStepStatus) {
  switch (status) {
    case 'running':
      return {
        row: 'border-sky-300/16 bg-sky-300/[0.045]',
        iconWrap: 'border-sky-300/18 bg-sky-300/[0.08]',
        icon: 'text-sky-200',
        badge: 'border-sky-300/22 bg-sky-300/[0.08] text-sky-200',
        title: 'text-zinc-100',
        summary: 'text-zinc-400',
      };
    case 'completed':
      return {
        row: 'border-emerald-300/14 bg-emerald-300/[0.035]',
        iconWrap: 'border-emerald-300/16 bg-emerald-300/[0.08]',
        icon: 'text-emerald-200',
        badge: 'border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200',
        title: 'text-zinc-100/95',
        summary: 'text-zinc-500',
      };
    case 'failed':
      return {
        row: 'border-rose-300/16 bg-rose-300/[0.04]',
        iconWrap: 'border-rose-300/16 bg-rose-300/[0.08]',
        icon: 'text-rose-200',
        badge: 'border-rose-300/22 bg-rose-300/[0.08] text-rose-200',
        title: 'text-zinc-100/95',
        summary: 'text-zinc-400',
      };
    case 'pending':
    default:
      return {
        row: 'border-white/[0.05] bg-white/[0.018]',
        iconWrap: 'border-white/[0.06] bg-white/[0.03]',
        icon: 'text-zinc-500',
        badge: 'border-white/[0.06] bg-white/[0.03] text-zinc-500',
        title: 'text-zinc-300',
        summary: 'text-zinc-500',
      };
  }
}

function StepStateIcon({ status, label }: { status: ExecutionStepStatus; label: string }) {
  if (status === 'completed') {
    return (
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/16 bg-emerald-300/[0.08]">
        <Check className="h-4 w-4 text-emerald-200" />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300/16 bg-rose-300/[0.08]">
        <CircleAlert className="h-4 w-4 text-rose-200" />
      </span>
    );
  }

  if (status === 'running') {
    return (
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-300/16 bg-sky-300/[0.08]">
        <motion.span
          className="absolute h-8 w-8 rounded-full bg-sky-300/[0.12] blur-[4px]"
          animate={{ scale: [0.92, 1.18, 0.92], opacity: [0.26, 0.52, 0.26] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="relative h-2.5 w-2.5 rounded-full bg-sky-300"
          animate={{ scale: [0.92, 1.16, 0.92], opacity: [0.74, 1, 0.74] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
    );
  }

  const Icon = pickStepIcon(label);

  return (
    <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03]">
      <Icon className="h-4 w-4 text-zinc-500" />
    </span>
  );
}

export function AgentExecutionTimeline({ steps }: AgentExecutionTimelineProps) {
  if (!steps.length) return null;

  return (
    <div className="space-y-2.5">
      {steps.map((step, index) => {
        const label = normalizeLabel(step.label);
        const styles = getStatusClasses(step.status);
        const isRunning = step.status === 'running';
        const isPending = step.status === 'pending';

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.16) }}
            className={`rounded-[20px] border px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-[12px] ${styles.row}`}
          >
            <div className="flex items-start gap-3">
              <StepStateIcon status={step.status} label={label} />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-[13px] leading-5 tracking-[-0.012em] ${styles.title}`}>
                      {label}
                    </p>

                    {step.summary ? (
                      <p className={`mt-1 text-[11px] leading-[1.15rem] ${styles.summary}`}>
                        {step.summary}
                      </p>
                    ) : (
                      <p className={`mt-1 text-[11px] leading-[1.15rem] ${styles.summary}`}>
                        {isRunning
                          ? 'Working through this step now.'
                          : isPending
                            ? 'Queued in the current workflow.'
                            : 'Completed as part of the visible work trail.'}
                      </p>
                    )}
                  </div>

                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${styles.badge}`}>
                    {getStatusCopy(step.status)}
                  </span>
                </div>

                {isRunning ? (
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(125,211,252,0.88),rgba(165,180,252,0.84))]"
                      animate={{ x: ['-35%', '115%'] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ width: '42%' }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
