import type { LiveStep, LiveStepKind, LiveStepStatus, LiveStepStreamEvent } from './live-steps-types';

function normalizeStatus(event: LiveStepStreamEvent): LiveStepStatus {
  if (event.type === 'tool_failed' || event.type === 'error' || event.status === 'failed') return 'error';
  if (event.type === 'tool_completed' || event.type === 'answer_completed' || event.status === 'completed') return 'done';
  if (event.status === 'pending' || event.status === 'queued') return 'queued';
  return 'running';
}

function fromToolName(tool?: string): { kind: LiveStepKind; label: string } {
  const name = (tool || '').toLowerCase();
  if (name.includes('productivity.next_action')) return { kind: 'planning', label: 'Finding best next step' };
  if (name.includes('memory')) return { kind: 'memory', label: 'Checking saved context' };
  if (name.includes('calendar')) return { kind: 'calendar', label: 'Checking calendar' };
  if (name.includes('web') || name.includes('search')) return { kind: 'search', label: 'Searching sources' };
  if (name.includes('response_generator')) return { kind: 'writing', label: 'Writing response' };
  if (name) return { kind: 'tool', label: 'Using tool' };
  return { kind: 'tool', label: 'Using tool' };
}

function mapEventToStep(event: LiveStepStreamEvent, idx: number): LiveStep {
  const type = (event.type || '').toLowerCase();
  const status = normalizeStatus(event);

  if (type.includes('thinking') || type === 'status') return { id: `live-${idx}`, kind: 'understanding', status, label: event.label || 'Understanding request', at: event.at, sourceEventType: event.type };
  if (type.includes('planning')) return { id: `live-${idx}`, kind: 'planning', status, label: event.label || 'Planning approach', at: event.at, sourceEventType: event.type };
  if (type.includes('memory')) return { id: `live-${idx}`, kind: 'memory', status, label: status === 'done' ? 'Context checked' : 'Checking saved context', at: event.at, sourceEventType: event.type };
  if (type.includes('tool')) {
    const mapped = fromToolName(event.tool);
    return { id: `live-${idx}`, kind: mapped.kind, status, label: event.label || mapped.label, at: event.at, tool: event.tool, sourceEventType: event.type };
  }
  if (type.includes('response_generator') || type.includes('answer_delta')) return { id: `live-${idx}`, kind: 'writing', status, label: event.label || 'Writing response', at: event.at, sourceEventType: event.type };
  if (type.includes('answer_completed') || type === 'done') return { id: `live-${idx}`, kind: 'completed', status: 'done', label: 'Done', at: event.at, sourceEventType: event.type, collapsible: true };
  return { id: `live-${idx}`, kind: 'generic', status, label: event.label || 'Processing', at: event.at, sourceEventType: event.type };
}

export function mapStreamEventsToLiveSteps(events: LiveStepStreamEvent[]): LiveStep[] {
  const mapped = events.map(mapEventToStep);
  const deduped: LiveStep[] = [];
  for (const step of mapped) {
    const existingIndex = deduped.findIndex((item) => item.kind === step.kind && item.label === step.label && item.tool === step.tool);
    if (existingIndex === -1) deduped.push(step);
    else deduped[existingIndex] = { ...deduped[existingIndex], ...step, id: deduped[existingIndex].id };
  }
  return deduped.filter((step, index, arr) => step.kind !== 'completed' || arr.findIndex((s) => s.kind === 'completed') === index);
}
