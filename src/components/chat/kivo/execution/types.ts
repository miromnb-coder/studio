export type KivoExecutionMode = 'text_only' | 'thinking' | 'status' | 'execution';

export type KivoExecutionTool =
  | 'gmail'
  | 'calendar'
  | 'browser'
  | 'memory'
  | 'files'
  | 'general';

export type KivoExecutionStepState = 'pending' | 'active' | 'done' | 'error';

export type KivoExecutionStep = {
  id: string;
  label: string;
  description?: string;
  state: KivoExecutionStepState;
};

export type KivoExecutionPresentation = {
  mode: KivoExecutionMode;
  title?: string;
  introText?: string;
  statusText?: string;
  tools?: KivoExecutionTool[];
  steps?: KivoExecutionStep[];
};

export type KivoExecutionPreset = {
  title: string;
  tools: KivoExecutionTool[];
  steps: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
};

export type KivoExecutionIntent =
  | 'email'
  | 'calendar'
  | 'browser'
  | 'memory'
  | 'files'
  | 'general';

export type KivoExecutionInput = {
  intent?: KivoExecutionIntent;
  toolCount?: number;
  introText?: string;
  statusText?: string;
  activeStepId?: string;
  doneStepIds?: string[];
  errorStepIds?: string[];
  forceMode?: KivoExecutionMode;
};
