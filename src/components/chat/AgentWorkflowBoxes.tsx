'use client';

import type { AgentResponseStep } from '@/types/agent-response';
import {
  AgentWorkflowStepBox,
  type WorkflowStepIcon,
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
  | 'gmail'
  | 'research'
  | 'compare'
  | 'finance'
  | 'file'
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
    labels: Record<StepKey, string>;
    helpers: Record<StepKey, string>;
  }
> = {
  en: {
    labels: {
      understanding: 'Understanding request',
      memory: 'Retrieving memory',
      gmail: 'Checking Gmail',
      research: 'Researching sources',
      compare: 'Comparing options',
      finance: 'Reviewing finances',
      file: 'Reviewing files',
      build: 'Building response',
      quality: 'Checking quality',
      process: 'Processing request',
    },
    helpers: {
      understanding: 'Understanding the request.',
      memory: 'Searching relevant memory.',
      gmail: 'Collecting email context.',
      research: 'Reviewing relevant sources.',
      compare: 'Evaluating best options.',
      finance: 'Checking costs and money context.',
      file: 'Extracting key points from files.',
      build: 'Composing the best answer.',
      quality: 'Final clarity and quality pass.',
      process: 'Running request workflow.',
    },
  },

  fi: {
    labels: {
      understanding: 'Ymmärretään pyyntö',
      memory: 'Haetaan muistia',
      gmail: 'Tarkistetaan Gmail',
      research: 'Tutkitaan lähteitä',
      compare: 'Verrataan vaihtoehdot',
      finance: 'Tarkistetaan talous',
      file: 'Käydään tiedostot läpi',
      build: 'Rakennetaan vastaus',
      quality: 'Tarkistetaan laatu',
      process: 'Käsitellään pyyntöä',
    },
    helpers: {
      understanding: 'Tulkitaan pyyntö oikein.',
      memory: 'Haetaan olennaista taustaa.',
      gmail: 'Kerätään sähköpostikontekstia.',
      research: 'Tarkistetaan olennaiset lähteet.',
      compare: 'Arvioidaan vaihtoehtoja.',
      finance: 'Katsotaan kulut ja raha-asiat.',
      file: 'Luetaan tärkeät kohdat tiedostoista.',
      build: 'Muotoillaan paras vastaus.',
      quality: 'Viimeinen laadun tarkistus.',
      process: 'Suoritetaan työnkulku.',
    },
  },

  sv: {
    labels: {
      understanding: 'Förstår begäran',
      memory: 'Hämtar minne',
      gmail: 'Kontrollerar Gmail',
      research: 'Undersöker källor',
      compare: 'Jämför alternativ',
      finance: 'Kontrollerar ekonomi',
      file: 'Går igenom filer',
      build: 'Bygger svar',
      quality: 'Kontrollerar kvalitet',
      process: 'Bearbetar begäran',
    },
    helpers: {
      understanding: 'Tolkar begäran.',
      memory: 'Hämtar relevant minne.',
      gmail: 'Samlar e-postkontext.',
      research: 'Granskar relevanta källor.',
      compare: 'Väger alternativen.',
      finance: 'Ser över ekonomi.',
      file: 'Läser viktiga delar från filer.',
      build: 'Formar bästa svaret.',
      quality: 'Sista kvalitetskontroll.',
      process: 'Kör arbetsflödet.',
    },
  },

  es: {
    labels: {
      understanding: 'Entendiendo solicitud',
      memory: 'Recuperando memoria',
      gmail: 'Revisando Gmail',
      research: 'Investigando fuentes',
      compare: 'Comparando opciones',
      finance: 'Revisando finanzas',
      file: 'Revisando archivos',
      build: 'Construyendo respuesta',
      quality: 'Verificando calidad',
      process: 'Procesando solicitud',
    },
    helpers: {
      understanding: 'Interpretando la solicitud.',
      memory: 'Buscando contexto útil.',
      gmail: 'Reuniendo contexto de correo.',
      research: 'Revisando fuentes relevantes.',
      compare: 'Evaluando alternativas.',
      finance: 'Revisando dinero y costes.',
      file: 'Leyendo puntos clave.',
      build: 'Creando la mejor respuesta.',
      quality: 'Revisión final.',
      process: 'Ejecutando flujo.',
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

function stepText(step: AgentResponseStep): string {
  return [
    normalizeText(step.id),
    normalizeText(step.action),
    normalizeText(step.summary),
    normalizeText(step.tool),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function resolveStepKey(step: AgentResponseStep, index: number): StepKey {
  const tool = normalizeText(step.tool).toLowerCase();
  const text = stepText(step);

  if (
    tool === 'memory' ||
    /memory|history|context|muisti|minne|memoria/.test(text)
  )
    return 'memory';

  if (
    tool === 'gmail' ||
    /gmail|mail|email|sähköposti|correo/.test(text)
  )
    return 'gmail';

  if (
    tool === 'web' ||
    /research|search|browse|source|web|lähde|fuente/.test(text)
  )
    return 'research';

  if (
    tool === 'compare' ||
    /compare|rank|criteria|option|vertaa|jämför/.test(text)
  )
    return 'compare';

  if (
    tool === 'finance' ||
    /finance|budget|price|cost|money|talous/.test(text)
  )
    return 'finance';

  if (
    tool === 'file' ||
    tool === 'notes' ||
    /file|document|pdf|docs|tiedosto/.test(text)
  )
    return 'file';

  if (/quality|verify|review|check|laatu/.test(text)) return 'quality';

  if (/build|generate|answer|response|compose|write|vastaus/.test(text))
    return 'build';

  if (/understand|intent|request|pyyntö/.test(text))
    return 'understanding';

  if (index === 0) return 'understanding';
  if (index === 1) return 'memory';
  if (index === 2) return 'research';
  if (index === 3) return 'build';

  return 'quality';
}

function priority(key: StepKey): number {
  const order: StepKey[] = [
    'understanding',
    'memory',
    'gmail',
    'research',
    'compare',
    'finance',
    'file',
    'build',
    'quality',
    'process',
  ];

  return order.indexOf(key) + 1;
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

function getIcon(key: StepKey): WorkflowStepIcon {
  if (key === 'memory') return 'memory';
  if (key === 'gmail') return 'gmail';
  if (key === 'research') return 'research';
  if (key === 'compare') return 'compare';
  if (key === 'finance') return 'finance';
  if (key === 'file') return 'file';
  if (key === 'quality') return 'quality';
  if (key === 'build' || key === 'understanding') return 'build';
  return 'process';
}

function buildUiSteps(
  steps: AgentResponseStep[],
  locale: SupportedLocale,
): StepUiModel[] {
  const grouped = new Map<StepKey, StepUiModel>();
  const copy = COPY[locale];

  steps.forEach((step, index) => {
    const key = resolveStepKey(step, index);
    const status = normalizeStatus(step.status);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        id: normalizeText(step.id) || `${key}-${index}`,
        key,
        label: copy.labels[key],
        helper:
          normalizeText(step.summary) ||
          (status === 'running' ? copy.helpers[key] : ''),
        status,
        priority: priority(key),
      });
      return;
    }

    grouped.set(key, {
      ...existing,
      status: mergeStatus(existing.status, status),
      helper: existing.helper || normalizeText(step.summary),
    });
  });

  return [...grouped.values()]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
}

function showHelper(step: StepUiModel) {
  return Boolean(step.helper) &&
    (step.status === 'running' || step.status === 'failed');
}

export function AgentWorkflowBoxes({
  steps,
  locale,
}: AgentWorkflowBoxesProps) {
  if (!steps?.length) return null;

  const uiSteps = buildUiSteps(steps, locale);

  if (!uiSteps.length) return null;

  return (
    <section className="space-y-2.5">
      {uiSteps.map((step, index) => (
        <div key={step.id} className="animate-[fadeInUp_0.35s_ease_forwards] opacity-0"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <AgentWorkflowStepBox
            label={step.label}
            status={step.status}
            icon={getIcon(step.key)}
          />

          {showHelper(step) ? (
            <p className="ml-7 mt-1.5 max-w-[92%] text-[13px] leading-[1.45] tracking-[-0.01em] text-[#72808f]">
              {step.helper}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}
