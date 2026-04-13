'use client';

import type { Message } from '@/app/store/app-store';
import type { AgentResponseStep, AgentSuggestedAction } from '@/types/agent-response';
import { AgentExecutionPanel, type AgentWorkflowStatus } from './AgentExecutionPanel';
import type { AgentExecutionStepStatus } from './AgentExecutionStepRow';
import { ActionSuggestions } from './ActionSuggestions';

type AgentResponseMessageProps = {
  message: Message;
  latestUserContent?: string;
};

type LocaleCopy = {
  intro: string[];
  workflowTitle: string;
  status: {
    running: string;
    completed: string;
    needs_attention: string;
  };
  nowLabel: string;
  fallbackStep: string;
};

const COPY: Record<'en' | 'fi' | 'sv', LocaleCopy> = {
  en: {
    intro: [
      'Got it — I\'ll analyze this for you.',
      'I\'ll review this step by step and give you the best answer.',
      'Let me examine this and give you a clear recommendation.',
    ],
    workflowTitle: 'Agent workflow',
    status: {
      running: 'Running',
      completed: 'Completed',
      needs_attention: 'Needs attention',
    },
    nowLabel: 'Now:',
    fallbackStep: 'Processing request',
  },
  fi: {
    intro: [
      'Selvä — analysoin tämän sinulle.',
      'Käyn tämän läpi vaihe vaiheelta ja annan parhaan vastauksen.',
      'Tutkin tämän ja annan selkeän suosituksen.',
    ],
    workflowTitle: 'Agentin työnkulku',
    status: {
      running: 'Käynnissä',
      completed: 'Valmis',
      needs_attention: 'Vaatii huomiota',
    },
    nowLabel: 'Nyt:',
    fallbackStep: 'Pyyntöä käsitellään',
  },
  sv: {
    intro: [
      'Absolut — jag analyserar detta åt dig.',
      'Jag går igenom detta steg för steg och ger dig det bästa svaret.',
      'Låt mig granska detta och ge en tydlig rekommendation.',
    ],
    workflowTitle: 'Agentens arbetsflöde',
    status: {
      running: 'Pågår',
      completed: 'Slutförd',
      needs_attention: 'Behöver åtgärd',
    },
    nowLabel: 'Nu:',
    fallbackStep: 'Bearbetar begäran',
  },
};

function detectLanguage(input?: string): keyof typeof COPY {
  const text = input?.trim().toLowerCase();
  if (!text) return 'en';

  if (/[åäö]/.test(text) || /\b(och|inte|jag|detta|för|att|som)\b/.test(text)) {
    return 'sv';
  }

  if (/[äö]/.test(text) || /\b(ja|ei|että|sinulle|tämä|vaihe|kanssa)\b/.test(text)) {
    return 'fi';
  }

  return 'en';
}

function normalizeStepStatus(status?: string): AgentExecutionStepStatus {
  if (status === 'completed') return 'completed';
  if (status === 'running') return 'running';
  if (status === 'failed') return 'failed';
  return 'pending';
}

function panelStatus(steps: AgentResponseStep[]): AgentWorkflowStatus {
  if (steps.some((step) => step.status === 'failed')) return 'needs_attention';
  if (steps.some((step) => step.status === 'running' || step.status === 'pending')) {
    return 'running';
  }
  return 'completed';
}

function hashIndex(value: string, mod: number) {
  return [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0) % mod;
}

function mapActions(actions?: AgentSuggestedAction[] | string[]) {
  if (!actions) return [] as string[];
  return actions
    .map((action) => (typeof action === 'string' ? action : action.label))
    .filter((label): label is string => Boolean(label));
}

export function AgentResponseMessage({ message, latestUserContent }: AgentResponseMessageProps) {
  const locale = detectLanguage(latestUserContent);
  const copy = COPY[locale];

  const metadata = message.agentMetadata;
  const steps = metadata?.steps ?? [];
  const actions = mapActions(metadata?.suggestedActions);

  const runningStep = steps.find((step) => step.status === 'running');
  const currentFocus = runningStep?.action ?? runningStep?.summary;

  const introIndex = hashIndex(message.id, copy.intro.length);

  return (
    <>
      <p className="mb-2 text-[14px] text-[#4f5969]">{copy.intro[introIndex]}</p>

      {steps.length > 0 ? (
        <AgentExecutionPanel
          title={copy.workflowTitle}
          status={panelStatus(steps)}
          statusLabel={copy.status[panelStatus(steps)]}
          currentFocusLabel={copy.nowLabel}
          currentFocus={currentFocus}
          steps={steps.map((step) => ({
            label: step.action || copy.fallbackStep,
            detail: step.summary,
            status: normalizeStepStatus(step.status),
          }))}
        />
      ) : null}

      <p className="whitespace-pre-wrap text-[14px] leading-6 text-[#424a59]">{message.content}</p>

      <ActionSuggestions actions={actions} />
    </>
  );
}
