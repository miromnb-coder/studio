import type { LiveStep } from './live-steps-types';

const labelsByKind: Record<string, string> = {
  memory: 'Used Memory',
  planning: 'Planned',
  writing: 'Wrote answer',
  search: 'Searched sources',
  calendar: 'Checked calendar',
  tool: 'Used tools',
};

export function summarizeLiveSteps(steps: LiveStep[]): string | null {
  const completed = steps.filter((step) => step.status === 'done');
  if (completed.length < 2) return null;

  const parts: string[] = [];
  for (const step of completed) {
    const label = labelsByKind[step.kind];
    if (label && !parts.includes(label)) parts.push(label);
    if (parts.length >= 3) break;
  }

  return parts.length ? parts.join(' • ') : null;
}
