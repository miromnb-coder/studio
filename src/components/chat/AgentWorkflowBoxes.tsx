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

const COPY: Record<SupportedLocale, { labels: Record<StepKey, string>; helpers: Record<StepKey, string> }> = {
  en: {
    labels: {
      understanding: 'Understanding request',
      memory: 'Retrieving memory',
      gmail: 'Checking Gmail context',
      research: 'Researching references',
      compare: 'Comparing options',
      finance: 'Reviewing finance context',
      file: 'Reviewing files',
      build: 'Building response',
      quality: 'Checking quality',
      process: 'Processing request',
    },
    helpers: {
      understanding: 'Interpreting the request and setting direction.',
      memory: 'Looking up relevant context from memory.',
      gmail: 'Gathering email-related details relevant to the answer.',
      research: 'Collecting and validating relevant external context.',
      compare: 'Evaluating alternatives and tradeoffs.',
      finance: 'Checking financial context and calculations.',
      file: 'Reading and extracting key points from files.',
      build: 'Structuring the best possible response.',
      quality: 'Final pass for clarity and correctness.',
      process: 'Executing the request workflow.',
    },
  },
  fi: {
    labels: {
      understanding: 'Ymmärretään pyyntö',
      memory: 'Haetaan muistia',
      gmail: 'Tarkistetaan Gmail-konteksti',
      research: 'Tutkitaan lähteitä',
      compare: 'Verrataan vaihtoehdot',
      finance: 'Tarkistetaan talouskonteksti',
      file: 'Käydään tiedostot läpi',
      build: 'Rakennetaan vastaus',
      quality: 'Tarkistetaan laatu',
      process: 'Käsitellään pyyntöä',
    },
    helpers: {
      understanding: 'Tulkitaan pyyntö ja asetetaan oikea suunta.',
      memory: 'Haetaan muistista olennaista taustaa.',
      gmail: 'Haetaan vastaukseen liittyvää sähköpostikontekstia.',
      research: 'Kerätään ja varmistetaan olennaiset lähteet.',
      compare: 'Arvioidaan vaihtoehtoja ja eroja.',
      finance: 'Tarkistetaan taloustiedot ja laskelmat.',
      file: 'Luetaan tiedostoista tärkeimmät asiat.',
      build: 'Muotoillaan paras mahdollinen vastaus.',
      quality: 'Viimeinen tarkistus selkeydelle ja laadulle.',
      process: 'Suoritetaan pyynnön työnkulku.',
    },
  },
  sv: {
    labels: {
      understanding: 'Förstår begäran',
      memory: 'Hämtar minne',
      gmail: 'Kontrollerar Gmail-kontext',
      research: 'Undersöker källor',
      compare: 'Jämför alternativ',
      finance: 'Kontrollerar finanskontext',
      file: 'Går igenom filer',
      build: 'Bygger svar',
      quality: 'Kontrollerar kvalitet',
      process: 'Bearbetar begäran',
    },
    helpers: {
      understanding: 'Tolkar begäran och sätter rätt riktning.',
      memory: 'Hämtar relevant bakgrund från minnet.',
      gmail: 'Samlar e-postkontext som behövs i svaret.',
      research: 'Samlar in och validerar relevanta källor.',
      compare: 'Väger alternativ och skillnader.',
      finance: 'Kontrollerar finansiella uppgifter och beräkningar.',
      file: 'Läser ut de viktigaste punkterna från filer.',
      build: 'Formar det bästa möjliga svaret.',
      quality: 'Sista kontroll för tydlighet och kvalitet.',
      process: 'Kör arbetsflödet för begäran.',
    },
  },
  es: {
    labels: {
      understanding: 'Entendiendo solicitud',
      memory: 'Recuperando memoria',
      gmail: 'Revisando contexto de Gmail',
      research: 'Investigando referencias',
      compare: 'Comparando opciones',
      finance: 'Revisando contexto financiero',
      file: 'Revisando archivos',
      build: 'Construyendo respuesta',
      quality: 'Verificando calidad',
      process: 'Procesando solicitud',
    },
    helpers: {
      understanding: 'Interpretando la solicitud y fijando dirección.',
      memory: 'Buscando contexto útil desde la memoria.',
      gmail: 'Recopilando contexto de correo relevante.',
      research: 'Recolectando y validando fuentes relevantes.',
      compare: 'Evaluando alternativas y diferencias.',
      finance: 'Verificando contexto financiero y cálculos.',
      file: 'Extrayendo puntos clave de archivos.',
      build: 'Estructurando la mejor respuesta posible.',
      quality: 'Última revisión de claridad y calidad.',
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
  return [normalizeText(step.id), normalizeText(step.action), normalizeText(step.summary), normalizeText(step.tool)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function resolveStepKey(step: AgentResponseStep, index: number): StepKey {
  const tool = normalizeText(step.tool).toLowerCase();
  const text = stepText(step);

  if (tool === 'memory' || /memory|context|history|muisti|minne|memoria/.test(text)) return 'memory';
  if (tool === 'gmail' || /gmail|email|mail|sähköposti|correo/.test(text)) return 'gmail';
  if (tool === 'web' || tool === 'research' || /research|search|web|browse|source|lähde|källa|fuente/.test(text)) return 'research';
  if (tool === 'compare' || /compare|rank|criteria|option|vertaa|jämför|compara/.test(text)) return 'compare';
  if (tool === 'finance' || /finance|budget|cost|price|money|talous|finans|dinero/.test(text)) return 'finance';
  if (tool === 'file' || tool === 'notes' || /file|document|pdf|docs|tiedosto|fil|archivo/.test(text)) return 'file';
  if (/quality|verify|review|check|laatu|kvalitet|calidad/.test(text)) return 'quality';
  if (/build|generate|answer|response|write|compose|vastaus|svar|respuesta/.test(text)) return 'build';
  if (/understand|interpret|intent|request|pyyntö|begäran|solicitud/.test(text)) return 'understanding';

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

function mergeStatus(current: WorkflowStepStatus, next: WorkflowStepStatus): WorkflowStepStatus {
  const rank: Record<WorkflowStepStatus, number> = { failed: 4, running: 3, completed: 2, pending: 1 };
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

function buildUiSteps(steps: AgentResponseStep[], locale: SupportedLocale): StepUiModel[] {
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
        status,
        helper: normalizeText(step.summary) || (status === 'running' ? copy.helpers[key] : ''),
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

function showHelper(step: StepUiModel): boolean {
  return Boolean(step.helper) && (step.status === 'running' || step.status === 'failed');
}

export function AgentWorkflowBoxes({ steps, locale }: AgentWorkflowBoxesProps) {
  if (!steps.length) return null;

  const uiSteps = buildUiSteps(steps, locale);
  if (!uiSteps.length) return null;

  return (
    <section className="space-y-2.5">
      {uiSteps.map((step) => (
        <div key={step.id}>
          <AgentWorkflowStepBox label={step.label} status={step.status} icon={getIcon(step.key)} />
          {showHelper(step) ? (
            <p className="ml-6 mt-1.5 text-[13px] leading-[1.45] tracking-[-0.008em] text-[#6f7d8d]">
              {step.helper}
            </p>
          ) : null}
        </div>
      ))}
    </section>
  );
}
