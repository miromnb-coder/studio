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
      understanding: 'Understanding what you really need.',
      memory: 'Looking for useful prior context.',
      gmail: 'Reviewing email context that may matter.',
      research: 'Checking relevant sources and signals.',
      compare: 'Weighing the strongest options.',
      finance: 'Reviewing cost and money-related context.',
      file: 'Extracting the most relevant details from files.',
      build: 'Composing the clearest possible answer.',
      quality: 'Running a final clarity and quality pass.',
      process: 'Processing the request workflow.',
    },
  },

  fi: {
    labels: {
      understanding: 'Ymmärretään pyyntö',
      memory: 'Haetaan muistia',
      gmail: 'Tarkistetaan Gmail',
      research: 'Tutkitaan lähteitä',
      compare: 'Verrataan vaihtoehtoja',
      finance: 'Tarkistetaan talous',
      file: 'Käydään tiedostot läpi',
      build: 'Rakennetaan vastaus',
      quality: 'Tarkistetaan laatu',
      process: 'Käsitellään pyyntöä',
    },
    helpers: {
      understanding: 'Varmistetaan mitä oikeasti tarvitset.',
      memory: 'Haetaan hyödyllistä aiempaa taustaa.',
      gmail: 'Tarkistetaan olennainen sähköpostikonteksti.',
      research: 'Käydään läpi olennaiset lähteet ja signaalit.',
      compare: 'Punnitaan parhaat vaihtoehdot.',
      finance: 'Tarkistetaan raha- ja kustannuskonteksti.',
      file: 'Poimitaan tärkeimmät kohdat tiedostoista.',
      build: 'Muotoillaan mahdollisimman selkeä vastaus.',
      quality: 'Tehdään viimeinen laatu- ja selkeyskierros.',
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
      understanding: 'Säkerställer vad du faktiskt behöver.',
      memory: 'Hämtar relevant tidigare kontext.',
      gmail: 'Granskar viktig e-postkontext.',
      research: 'Kontrollerar relevanta källor och signaler.',
      compare: 'Väger de bästa alternativen.',
      finance: 'Ser över ekonomi och kostnader.',
      file: 'Plockar ut viktiga punkter från filer.',
      build: 'Formar det tydligaste möjliga svaret.',
      quality: 'Sista kvalitets- och tydlighetskontroll.',
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
      understanding: 'Aclarando lo que realmente necesitas.',
      memory: 'Buscando contexto útil previo.',
      gmail: 'Revisando el contexto del correo relevante.',
      research: 'Comprobando fuentes y señales importantes.',
      compare: 'Evaluando las mejores opciones.',
      finance: 'Revisando costes y contexto financiero.',
      file: 'Extrayendo los puntos clave de los archivos.',
      build: 'Redactando la respuesta más clara posible.',
      quality: 'Haciendo una revisión final de calidad.',
      process: 'Ejecutando el flujo de la solicitud.',
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
  ) {
    return 'memory';
  }

  if (tool === 'gmail' || /gmail|mail|email|sähköposti|correo/.test(text)) {
    return 'gmail';
  }

  if (
    tool === 'web' ||
    /research|search|browse|source|web|lähde|fuente/.test(text)
  ) {
    return 'research';
  }

  if (
    tool === 'compare' ||
    /compare|rank|criteria|option|vertaa|jämför/.test(text)
  ) {
    return 'compare';
  }

  if (
    tool === 'finance' ||
    /finance|budget|price|cost|money|talous/.test(text)
  ) {
    return 'finance';
  }

  if (
    tool === 'file' ||
    tool === 'notes' ||
    /file|document|pdf|docs|tiedosto/.test(text)
  ) {
    return 'file';
  }

  if (/quality|verify|review|check|laatu/.test(text)) {
    return 'quality';
  }

  if (/build|generate|answer|response|compose|write|vastaus/.test(text)) {
    return 'build';
  }

  if (/understand|intent|request|pyyntö/.test(text)) {
    return 'understanding';
  }

  if (index === 0) return 'understanding';
  if (index === 1) return 'memory';
  if (index === 2) return 'research';
  if (index === 3) return 'build';

  return 'process';
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
    const summary = normalizeText(step.summary);

    if (!existing) {
      grouped.set(key, {
        id: normalizeText(step.id) || `${key}-${index}`,
        key,
        label: copy.labels[key],
        helper: summary || copy.helpers[key],
        status,
        priority: priority(key),
      });
      return;
    }

    grouped.set(key, {
      ...existing,
      status: mergeStatus(existing.status, status),
      helper:
        existing.helper && existing.helper !== COPY[locale].helpers[key]
          ? existing.helper
          : summary || existing.helper || copy.helpers[key],
    });
  });

  return [...grouped.values()]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5);
}

function showHelper(step: StepUiModel) {
  return Boolean(step.helper) &&
    (step.status === 'running' ||
      step.status === 'failed' ||
      step.status === 'completed');
}

export function AgentWorkflowBoxes({
  steps,
  locale,
}: AgentWorkflowBoxesProps) {
  if (!steps?.length) return null;

  const uiSteps = buildUiSteps(steps, locale);

  if (!uiSteps.length) return null;

  return (
    <section className="space-y-3">
      {uiSteps.map((step, index) => (
        <div
          key={step.id}
          className="animate-[fadeInUp_0.4s_ease_forwards] opacity-0"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <AgentWorkflowStepBox
            label={step.label}
            status={step.status}
            icon={getIcon(step.key)}
          />

          {showHelper(step) ? (
            <p className="ml-7 mt-2 max-w-[92%] text-[13px] leading-[1.5] tracking-[-0.012em] text-[#72808f]">
              {step.helper}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}
