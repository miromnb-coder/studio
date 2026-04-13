'use client';

import type { AgentResponseStep } from '@/types/agent-response';
import {
  AgentWorkflowStepBox,
  type WorkflowStepStatus,
} from './AgentWorkflowStepBox';

type AgentWorkflowBoxesProps = {
  steps: AgentResponseStep[];
  locale: SupportedLocale;
};

type SupportedLocale = 'en' | 'fi' | 'sv' | 'es';

const STEP_COPY: Record<SupportedLocale, Record<string, string>> = {
  en: {
    understanding: 'Understanding request',
    memory: 'Retrieving memory',
    compare: 'Comparing options',
    build: 'Building response',
    quality: 'Quality check',
    process: 'Processing request',
    tool: 'Running tools',
    verify: 'Verifying details',
  },
  fi: {
    understanding: 'Ymmärretään pyyntö',
    memory: 'Haetaan muistia',
    compare: 'Verrataan vaihtoehtoja',
    build: 'Rakennetaan vastaus',
    quality: 'Tarkistetaan laatu',
    process: 'Käsitellään pyyntöä',
    tool: 'Suoritetaan työkaluja',
    verify: 'Varmistetaan tiedot',
  },
  sv: {
    understanding: 'Förstår begäran',
    memory: 'Hämtar minne',
    compare: 'Jämför alternativ',
    build: 'Bygger svar',
    quality: 'Kvalitetskontroll',
    process: 'Bearbetar begäran',
    tool: 'Kör verktyg',
    verify: 'Verifierar detaljer',
  },
  es: {
    understanding: 'Entendiendo solicitud',
    memory: 'Recuperando memoria',
    compare: 'Comparando opciones',
    build: 'Construyendo respuesta',
    quality: 'Revisión de calidad',
    process: 'Procesando solicitud',
    tool: 'Ejecutando herramientas',
    verify: 'Verificando detalles',
  },
};

const HELPER_COPY: Record<SupportedLocale, Record<string, string>> = {
  en: {
    memory: 'Searching previous context…',
    compare: 'Comparing the best options.',
    build: 'Finalizing answer.',
    quality: 'Running a quick quality check.',
  },
  fi: {
    memory: 'Haetaan aiempaa kontekstia…',
    compare: 'Verrataan parhaat vaihtoehdot.',
    build: 'Viimeistellään vastausta.',
    quality: 'Tehdään nopea laatutarkistus.',
  },
  sv: {
    memory: 'Söker tidigare kontext…',
    compare: 'Jämför de bästa alternativen.',
    build: 'Färdigställer svaret.',
    quality: 'Gör en snabb kvalitetskontroll.',
  },
  es: {
    memory: 'Buscando contexto previo…',
    compare: 'Comparando las mejores opciones.',
    build: 'Finalizando la respuesta.',
    quality: 'Ejecutando una revisión rápida de calidad.',
  },
};

function normalizeStatus(status?: string): WorkflowStepStatus {
  if (status === 'completed') return 'completed';
  if (status === 'running') return 'running';
  if (status === 'failed') return 'failed';
  return 'pending';
}

function resolveKey(step: AgentResponseStep, index: number): keyof (typeof STEP_COPY)['en'] {
  const normalized = `${step.action} ${step.summary} ${step.tool}`.toLowerCase();

  if (/memory|context|muisti|minne|memoria/.test(normalized)) return 'memory';
  if (/compare|option|vaihtoehto|alternativ|opcion/.test(normalized)) return 'compare';
  if (/verify|check|quality|review|laatu|kvalitet|calidad/.test(normalized)) return 'quality';
  if (/tool|search|fetch|run|execute|verktyg|työkalu|herramienta/.test(normalized)) {
    return 'tool';
  }
  if (/understand|intent|request|pyyntö|begäran|solicitud/.test(normalized)) {
    return 'understanding';
  }
  if (/build|write|draft|synth|response|vastaus|svar|respuesta/.test(normalized)) return 'build';
  if (/verify|fact|detail|varm|verifier/.test(normalized)) return 'verify';

  if (index === 0) return 'understanding';
  if (index === 1) return 'memory';
  if (index === 2) return 'compare';
  if (index === 3) return 'build';

  return 'process';
}

export function AgentWorkflowBoxes({ steps, locale }: AgentWorkflowBoxesProps) {
  if (!steps.length) return null;

  const labels = STEP_COPY[locale];
  const helper = HELPER_COPY[locale];

  return (
    <section className="mb-3">
      <div className="flex flex-col gap-2">
        {steps.map((step, index) => {
          const key = resolveKey(step, index);
          const detailKey = key in helper ? (key as keyof typeof helper) : undefined;

          return (
            <div key={`${step.action}-${index}`} className="space-y-1.5">
              <AgentWorkflowStepBox label={labels[key]} status={normalizeStatus(step.status)} />
              {step.status === 'running' && detailKey ? (
                <p className="px-1 text-[12px] text-[#6c7687]">{helper[detailKey]}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
