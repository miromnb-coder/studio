'use client';

import {
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  SplitSquareVertical,
} from 'lucide-react';

type SupportedLocale = 'en' | 'fi' | 'sv' | 'es';

type ActionSuggestionsProps = {
  actions: string[];
  locale: SupportedLocale;
  onActionClick?: (action: string) => void;
};

const fallbackActions: Record<SupportedLocale, string[]> = {
  en: ['Refine answer', 'Show alternatives'],
  fi: ['Tarkenna vastausta', 'Näytä vaihtoehdot'],
  sv: ['Förfina svaret', 'Visa alternativ'],
  es: ['Refinar respuesta', 'Mostrar alternativas'],
};

const actionLabelMap: Record<SupportedLocale, Record<string, string>> = {
  en: {},
  fi: {
    'Refine answer': 'Tarkenna vastausta',
    'Show alternatives': 'Näytä vaihtoehdot',
    'Try again': 'Yritä uudelleen',
    Continue: 'Jatka',
  },
  sv: {
    'Refine answer': 'Förfina svaret',
    'Show alternatives': 'Visa alternativ',
    'Try again': 'Försök igen',
    Continue: 'Fortsätt',
  },
  es: {
    'Refine answer': 'Refinar respuesta',
    'Show alternatives': 'Mostrar alternativas',
    'Try again': 'Intentar de nuevo',
    Continue: 'Continuar',
  },
};

function localizeAction(action: string, locale: SupportedLocale) {
  return actionLabelMap[locale][action] ?? action;
}

function iconForAction(action: string, index: number) {
  const normalized = action.toLowerCase();

  if (
    normalized.includes('refine') ||
    normalized.includes('tarkenna') ||
    normalized.includes('förfina') ||
    normalized.includes('refinar')
  ) {
    return Sparkles;
  }

  if (
    normalized.includes('alternative') ||
    normalized.includes('vaihtoehto') ||
    normalized.includes('alternativ')
  ) {
    return SplitSquareVertical;
  }

  if (
    normalized.includes('again') ||
    normalized.includes('uudelleen') ||
    normalized.includes('försök')
  ) {
    return RefreshCw;
  }

  if (
    normalized.includes('continue') ||
    normalized.includes('jatka') ||
    normalized.includes('continuar')
  ) {
    return ArrowUpRight;
  }

  return index % 2 === 0 ? Sparkles : ArrowUpRight;
}

export function ActionSuggestions({
  actions,
  locale,
  onActionClick,
}: ActionSuggestionsProps) {
  const actionItems = actions.length ? actions : fallbackActions[locale];

  if (!actionItems.length) return null;

  return (
    <div className="rounded-[24px] border border-[rgba(226,233,241,0.84)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(249,251,255,0.96))] p-3.5 shadow-[0_10px_26px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8c99aa]">
          Smart follow-ups
        </p>
        <p className="text-[11px] text-[#a0aab7]">{Math.min(actionItems.length, 4)} ready</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {actionItems.slice(0, 4).map((action, index) => {
          const Icon = iconForAction(action, index);

          return (
            <button
              key={`${action}-${index}`}
              type="button"
              onClick={() => onActionClick?.(action)}
              className="group inline-flex items-center gap-2 rounded-full border border-[rgba(216,223,233,0.95)] bg-[linear-gradient(180deg,#ffffff,#f8fbff)] px-3.5 py-2 text-[12.5px] font-medium text-[#415164] transition duration-200 hover:-translate-y-[1px] hover:border-[rgba(193,205,221,1)] hover:shadow-[0_10px_22px_rgba(15,23,42,0.06)]"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(228,234,241,0.95)] bg-white text-[#60748b]">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span>{localizeAction(action, locale)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
