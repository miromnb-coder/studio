import type { ResponseIntent, ResponseVisibility } from './types';

export function resolveResponseVisibility(intent: ResponseIntent): ResponseVisibility {
  switch (intent) {
    case 'search':
      return {
        initialItems: 3,
        allowExpand: true,
        showTopCard: true,
        collapseSecondaryContent: true,
      };

    case 'shopping':
      return {
        initialItems: 3,
        allowExpand: true,
        showTopCard: true,
        collapseSecondaryContent: true,
      };

    case 'compare':
      return {
        initialItems: 3,
        allowExpand: true,
        showTopCard: true,
        collapseSecondaryContent: false,
      };

    case 'email':
    case 'calendar':
      return {
        initialItems: 4,
        allowExpand: true,
        showTopCard: false,
        collapseSecondaryContent: false,
      };

    case 'operator':
      return {
        initialItems: 3,
        allowExpand: false,
        showTopCard: false,
        collapseSecondaryContent: false,
      };

    case 'plain':
    default:
      return {
        initialItems: 0,
        allowExpand: false,
        showTopCard: false,
        collapseSecondaryContent: false,
      };
  }
}
