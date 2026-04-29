export type RunningTaskStatus = 'running' | 'completed' | 'failed';

export type RunningTaskPreviewType = 'calendar' | 'research' | 'memory' | 'tool' | 'generic';

export type RunningTask = {
  title: string;
  status: RunningTaskStatus;
  elapsedSeconds: number;
  currentStep: string;
  nextStep?: string;
  progressCurrent: number;
  progressTotal: number;
  toolName?: string;
  previewType: RunningTaskPreviewType;
};
