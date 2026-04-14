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
  | 'tool'
  | 'build'
  | 'quality'
  | 'process';

type StepUiModel = {
  id: string;
  key: StepKey;
  label: string;
  status: WorkflowStepStatus;
  helper?: string;
  priority: number;
};

const COPY: Record<
  SupportedLocale,
  {
    title: string;
    subtitle: string;
    labels: Record<StepKey, string>;
    helpers: Record<
      StepKey,
      {
        running?: string;
        failed?: string;
      }
    >;
  }
> = {
  en: {
    title: 'Workflow panel',
    subtitle: 'Agent workflow',
    labels: {
      understanding: 'Understanding request',
      memory: 'Retrieving memory',
      compare: 'Comparing options',
      tool: 'Investigating data',
      build: 'Building response',
      quality: 'Quality check',
      process: 'Processing request',
    },
    helpers: {
      understanding: {
        running: 'Interpreting the request and locking the right direction.',
        failed: 'The request interpretation step had an issue.',
      },
      memory: {
        running: 'Looking for relevant context from this conversation.',
        failed: 'Memory retrieval was incomplete.',
      },
      compare: {
        running: 'Evaluating tradeoffs and decision criteria.',
        failed: 'Comparison logic could not complete cleanly.',
      },
      tool: {
        running: 'Using the most relevant tools and context.',
        failed: 'A tool step did not complete successfully.',
      },
      build: {
        running: 'Composing the clearest final answer.',
        failed: 'Answer generation was interrupted.',
      },
      quality: {
        running: 'Doing a final quality pass.',
        failed: 'Quality verification did not complete.',
      },
      process: {
        running: 'Processing the request.',
        failed: 'Processing was incomplete.',
      },
    },
  },
  fi: {
    title: 'Workflow panel',
    subtitle: 'Agentin työnkulku',
    labels: {
      understanding: 'Ymmärretään pyyntö',
      memory: 'Haetaan muistia',
      compare: 'Verrataan vaihtoehdot',
      tool: 'Tutkitaan data',
      build: 'Rakennetaan vastaus',
      quality: 'Tarkistetaan laatu',
      process: 'Käsitellään pyyntöä',
    },
    helpers: {
      understanding: {
        running: 'Tulkitaan pyyntö ja lukitaan oikea suunta.',
        failed: 'Pyynnön tulkinnassa tuli ongelma.',
      },
      memory: {
        running: 'Haetaan tästä keskustelusta olennaista kontekstia.',
        failed: 'Muistin haku jäi kesken.',
      },
      compare: {
        running: 'Arvioidaan vaihtoehtoja ja tärkeimpiä eroja.',
        failed: 'Vertailua ei saatu tehtyä puhtaasti loppuun.',
      },
      tool: {
        running: 'Käytetään tähän tehtävään sopivia työkaluja.',
        failed: 'Jokin työkaluvaihe epäonnistui.',
      },
      build: {
        running: 'Muodostetaan paras mahdollinen lopullinen vastaus.',
        failed: 'Vastauksen rakentaminen keskeytyi.',
      },
      quality: {
        running: 'Tehdään vielä viimeinen laatutarkistus.',
        failed: 'Laatutarkistus ei valmistunut.',
      },
      process: {
        running: 'Käsitellään pyyntöä.',
        failed: 'Käsittely jäi kesken.',
      },
    },
  },
  sv: {
    title: 'Workflow panel',
    subtitle: 'Agentens arbetsflöde',
    labels: {
      understanding: 'Förstår begäran',
      memory: 'Hämtar minne',
      compare: 'Jämför alternativ',
      tool: 'Undersöker data',
      build: 'Bygger svar',
      quality: 'Kvalitetskontroll',
      process: 'Bearbetar begäran',
    },
    helpers: {
      understanding: {
        running: 'Tolkar begäran och låser rätt riktning.',
        failed: 'Det uppstod ett problem i tolkningen.',
      },
      memory: {
        running: 'Hämtar relevant kontext från denna konversation.',
        failed: 'Minneshämtningen blev ofullständig.',
      },
      compare: {
        running: 'Väger alternativ och viktiga skillnader.',
        failed: 'Jämförelsen kunde inte slutföras rent.',
      },
      tool: {
        running: 'Använder rätt verktyg för uppgiften.',
        failed: 'Ett verktygssteg misslyckades.',
      },
      build: {
        running: 'Formar det tydligaste slutliga svaret.',
        failed: 'Svarsgenereringen avbröts.',
      },
      quality: {
        running: 'Gör en sista kvalitetskontroll.',
        failed: 'Kvalitetskontrollen slutfördes inte.',
      },
      process: {
        running: 'Bearbetar begäran.',
        failed: 'Bearbetningen blev ofullständig.',
      },
    },
  },
  es: {
    title: 'Workflow panel',
    subtitle: 'Flujo del agente',
    labels: {
      understanding: 'Entendiendo solicitud',
      memory: 'Recuperando memoria',
      compare: 'Comparando opciones',
      tool: 'Investigando datos',
      build: 'Construyendo respuesta',
      quality: 'Revisión de calidad',
      process: 'Procesando solicitud',
    },
    helpers: {
      understanding: {
        running: 'Interpretando la solicitud y fijando la dirección correcta.',
        failed: 'Hubo un problema al interpretar la solicitud.',
      },
      memory: {
        running: 'Buscando contexto relevante de esta conversación.',
        failed: 'La recuperación de memoria quedó incompleta.',
      },
      compare: {
        running: 'Evaluando alternativas y diferencias importantes.',
        failed: 'La comparación no pudo terminarse limpiamente.',
      },
      tool: {
        running: 'Usando las herramientas más adecuadas.',
        failed: 'Un paso de herramienta falló.',
      },
      build: {
        running: 'Redactando la mejor respuesta final.',
        failed: 'La generación de respuesta se interrumpió.',
      },
      quality: {
        running: 'Haciendo una revisión final de calidad.',
        failed: 'La verificación de calidad no terminó.',
      },
      process: {
        running: 'Procesando la solicitud.',
        failed: 'El procesamiento quedó incompleto.',
      },
    },
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

function getStepText(step: AgentResponseStep): string {
  return [
    normalizeText(step.action),
    normalizeText(step.summary),
    normalizeText(step.tool),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function resolveStepKey(step: AgentResponseStep, index: number): StepKey {
  const id = normalizeText(step.id).toLowerCase();
  const tool = normalizeText(step.tool).toLowerCase();
  const title = getStepText(step);

  if (id.includes('intake') || /understand|interpret|request|intent|pyyntö|begäran|solicitud/.test(title)) {
    return 'understanding';
  }

  if (id.includes('memory') || tool === 'memory' || /memory|context|history|muisti|minne|historia/.test(title)) {
    return 'memory';
  }

  if (
    id.includes('criteria') ||
    id.includes('ranking') ||
    id.includes('compare') ||
    tool === 'compare' ||
    /compare|rank|criteria|option|verta|jämför|compara/.test(title)
  ) {
    return 'compare';
  }

  if (
    id.includes('generate') ||
    id.includes('synthesize') ||
    id.includes('build') ||
    /build|generate|answer|response|write|vastaus|svar|respuesta/.test(title)
  ) {
    return 'build';
  }

  if (
    id.includes('evaluate') ||
    id.includes('quality') ||
    id.includes('verify') ||
    /quality|verify|review|check|laatu|tarkistus|kvalitet|calidad/.test(title)
  ) {
    return 'quality';
  }

  if (
    id.includes('tool-') ||
    ['gmail', 'web', 'calendar', 'file', 'finance', 'notes'].includes(tool)
  ) {
    return 'tool';
  }

  if (index === 0) return 'understanding';
  if (index === 1) return 'memory';
  if (index === 2) return 'tool';
  if (index === 3) return 'build';
  return 'process';
}

function getPriority(key: StepKey): number {
  switch (key) {
    case 'understanding':
      return 10;
    case 'memory':
      return 20;
    case 'compare':
      return 30;
    case 'tool':
      return 40;
    case 'build':
      return 50;
    case 'quality':
      return 60;
    default:
      return 70;
  }
}

function mergeStatus(
  current: WorkflowStepStatus,
  next: WorkflowStepStatus,
): WorkflowStepStatus {
  const rank: Record<WorkflowStepStatus, number> = {
    failed: 4,
    running: 3,
    completed: 2,
    pending: 1,
  };

  return rank[next] > rank[current] ? next : current;
}

function buildUiSteps(
  steps: AgentResponseStep[],
  locale: SupportedLocale,
): StepUiModel[] {
  const copy = COPY[locale];
  const grouped = new Map<StepKey, StepUiModel>();

  steps.forEach((step, index) => {
    const key = resolveStepKey(step, index);
    const status = normalizeStatus(step.status);

    const existing = grouped.get(key);
    const helper =
      status === 'running'
        ? copy.helpers[key].running
        : status === 'failed'
          ? copy.helpers[key].failed
          : undefined;

    if (!existing) {
      grouped.set(key, {
        id: normalizeText(step.id) || `${key}-${index}`,
        key,
        label: copy.labels[key],
        status,
        helper,
        priority: getPriority(key),
      });
      return;
    }

    grouped.set(key, {
      ...existing,
      status: mergeStatus(existing.status, status),
      helper: helper || existing.helper,
    });
  });

  return [...grouped.values()]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
}

function shouldShowHelper(step: StepUiModel): boolean {
  return step.status === 'running' || step.status === 'failed';
}

export function AgentWorkflowBoxes({
  steps,
  locale,
}: AgentWorkflowBoxesProps) {
  if (!steps.length) return null;

  const copy = COPY[locale];
  const uiSteps = buildUiSteps(steps, locale);

  if (!uiSteps.length) return null;

  return (
    <section className="rounded-[24px] border border-[#e6eaf0] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(249,250,252,0.98))] px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
      <div className="mb-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#98a1af]">
          {copy.title}
        </div>
        <div className="mt-1 text-[16px] font-medium tracking-[-0.02em] text-[#3e4653]">
          {copy.subtitle}
        </div>
      </div>

      <div className="space-y-2.5">
        {uiSteps.map((step) => (
          <div key={step.id} className="space-y-1.5">
            <AgentWorkflowStepBox
              label={step.label}
              status={step.status}
            />

            {shouldShowHelper(step) && step.helper ? (
              <p className="px-1.5 text-[12px] leading-5 tracking-[-0.01em] text-[#7a8392]">
                {step.helper}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
