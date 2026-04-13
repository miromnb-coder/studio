'use client';

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
    'Continue': 'Jatka',
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

export function ActionSuggestions({ actions, locale, onActionClick }: ActionSuggestionsProps) {
  const actionItems = actions.length ? actions : fallbackActions[locale];

  if (!actionItems.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actionItems.slice(0, 4).map((action, index) => (
        <button
          key={`${action}-${index}`}
          type="button"
          onClick={() => onActionClick?.(action)}
          className="rounded-full border border-[#d8dee8] bg-white px-3 py-1.5 text-[12px] font-medium text-[#4b5566] transition hover:border-[#c2cadd] hover:bg-[#f8f9fc]"
        >
          {localizeAction(action, locale)}
        </button>
      ))}
    </div>
  );
}
