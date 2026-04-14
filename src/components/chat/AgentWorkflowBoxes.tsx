'use client';

import type { AgentResponseStep } from '@/types/agent-response';
import {
  AgentWorkflowStepBox,
  type WorkflowStepStatus,
} from './AgentWorkflowStepBox';

type SupportedLocale = 'en' | 'fi' | 'sv' | 'es';

type AgentWorkflowBoxesProps = {
  steps: AgentResponseStep[];
  locale: SupportedLocale;
};

type StepKey =
  | 'understanding'
  | 'memory'
  | 'compare'
  | 'build'
  | 'quality'
  | 'tool'
  | 'verify'
  | 'process';

const STEP_COPY: Record<SupportedLocale, Record<StepKey, string>> = {
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
    compare: 'Verrataan vaihtoehdot',
    build: 'Rakennetaan vastaus',
    quality: 'Tarkistetaan laatu',
    process: 'Käsitellään pyyntöä',
    tool: 'Käytetään työkaluja',
    verify: 'Varmistetaan tiedot',
  },
  sv: {
    understanding: 'Förstår begäran',
    memory: 'Hämtar minne',
    compare: 'Jämför alternativ',
    build: 'Bygger svar',
    quality: 'Kvalitetskontroll',
    process: 'Bearbetar begäran',
    tool: 'Använder verktyg',
    verify: 'Verifierar detaljer',
  },
  es: {
    understanding: 'Entendiendo solicitud',
    memory: 'Recuperando memoria',
    compare: 'Comparando opciones',
    build: 'Construyendo respuesta',
    quality: 'Revisión de calidad',
    process: 'Procesando solicitud',
    tool: 'Usando herramientas',
    verify: 'Verificando detalles',
  },
};

const HELPER_COPY: Record<SupportedLocale, Partial<Record<StepKey, string>>> = {
  en: {
    memory: 'Searching previous context…',
    compare: 'Comparing the strongest options.',
    build: 'Finalizing the response.',
    quality: 'Running a quick quality check.',
    tool: 'Using the right tools for this task.',
    verify: 'Checking the important details.',
  },
  fi: {
    memory: 'Haetaan aiempaa kontekstia…',
    compare: 'Verrataan vahvimmat vaihtoehdot.',
    build: 'Viimeistellään vastausta.',
    quality: 'Tehdään nopea laatutarkistus.',
    tool: 'Käytetään tähän sopivia työkaluja.',
    verify: 'Tarkistetaan tärkeät yksityiskohdat.',
  },
  sv: {
    memory: 'Söker tidigare kontext…',
    compare: 'Jämför de starkaste alternativen.',
    build: 'Färdigställer svaret.',
    quality: 'Gör en snabb kvalitetskontroll.',
    tool: 'Använder rätt verktyg för uppgiften.',
    verify: 'Kontrollerar viktiga detaljer.',
  },
  es: {
    memory: 'Buscando contexto previo…',
    compare: 'Comparando las opciones más fuertes.',
    build: 'Finalizando la respuesta.',
    quality: 'Ejecutando una revisión rápida de calidad.',
    tool: 'Usando las herramientas adecuadas.',
    verify: 'Revisando los detalles importantes.',
  },
};

function normalizeText(value?: string): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeStatus(status?: string): WorkflowStepStatus {
  if (status === 'completed') return 'completed';
  if (status === 'running') return 'running';
  if (status === 'failed') return 'failed';
  return 'pending';
}

function dedupeSteps(steps: AgentResponseStep[]): AgentResponseStep[] {
  const seen = new Set<string>();
  const result: AgentResponseStep[] = [];

  for (const step of steps) {
    const action = normalizeText(step.action);
    const summary = normalizeText(step.summary);
    const tool = normalizeText(step.tool);
    const key = `${action.toLowerCase()}|${tool.toLowerCase()}`;

    if (!action) continue;
    if (seen.has(key)) continue;

    seen.add(key);
    result.push({
      ...step,
      action,
      summary,
      tool,
    });
  }

  return result;
}

function resolveKey(step: AgentResponseStep, index: number): StepKey {
  const normalized = `${normalizeText(step.action)} ${normalizeText(
    step.summary,
  )} ${normalizeText(step.tool)}`.toLowerCase();

  if (
    /understand|intent|request|prompt|question|pyyntö|begäran|solicitud|förstår|entend/.test(
      normalized,
    )
  ) {
    return 'understanding';
  }

  if (
    /memory|context|history|recall|muisti|konteksti|minne|historia|memoria/.test(
      normalized,
    )
  ) {
    return 'memory';
  }

  if (
    /compare|option|tradeoff|alternativ|vaihtoehto|vertaa|jämför|opciones/.test(
      normalized,
    )
  ) {
    return 'compare';
  }

  if (
    /build|generate|write|draft|respond|response|answer|vastaus|rakenn|svar|respuesta|bygger|constru/.test(
      normalized,
    )
  ) {
    return 'build';
  }

  if (
    /quality|check|review|verify|validate|laatu|tarkist|kvalitet|kontroll|calidad|revisión/.test(
      normalized,
    )
  ) {
    return 'quality';
  }

  if (
    /tool|search|fetch|lookup|run|execute|inspect|scan|verktyg|työkalu|herramienta/.test(
      normalized,
    )
  ) {
    return 'tool';
  }

  if (/detail|fact|verify|varmist|verifier|detalle/.test(normalized)) {
    return 'verify';
  }

  if (index === 0) return 'understanding';
  if (index === 1) return 'memory';
  if (index === 2) return 'compare';
  if (index === 3) return 'build';
  if (index === 4) return 'quality';

  return 'process';
}

function shouldShowHelper(
  status: WorkflowStepStatus,
  key: StepKey,
  stepCount: number,
): boolean {
  if (status === 'running') return true;
  if (status === 'failed') return true;
  if (stepCount <= 2 && key === 'memory') return true;
  return false;
}

function helperTextForStep(
  locale: SupportedLocale,
  key: StepKey,
  status: WorkflowStepStatus,
): string | null {
  if (status === 'failed') {
    if (locale === 'fi') return 'Tässä vaiheessa tuli pieni ongelma.';
    if (locale === 'sv') return 'Det uppstod ett litet problem i detta steg.';
    if (locale === 'es') return 'Hubo un pequeño problema en este paso.';
    return 'There was a small issue in this step.';
  }

  return HELPER_COPY[locale][key] ?? null;
}

export function AgentWorkflowBoxes({
  steps,
  locale,
}: AgentWorkflowBoxesProps) {
  const safeSteps = dedupeSteps(steps).slice(0, 5);

  if (!safeSteps.length) return null;

  const labels = STEP_COPY[locale];

  return (
    <section className="mb-4">
      <div className="flex flex-col gap-2.5">
        {safeSteps.map((step, index) => {
          const key = resolveKey(step, index);
          const status = normalizeStatus(step.status);
          const helperText = helperTextForStep(locale, key, status);

          return (
            <div key={`${step.action}-${index}`} className="space-y-1.5">
              <AgentWorkflowStepBox
                label={labels[key]}
                status={status}
              />

              {helperText && shouldShowHelper(status, key, safeSteps.length) ? (
                <p className="px-1.5 text-[12px] leading-5 tracking-[-0.01em] text-[#758091]">
                  {helperText}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
