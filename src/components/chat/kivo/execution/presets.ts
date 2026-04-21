import type { KivoExecutionIntent, KivoExecutionPreset } from './types';

export const KIVO_EXECUTION_PRESETS: Record<KivoExecutionIntent, KivoExecutionPreset> = {
  email: {
    title: 'Checking Gmail',
    tools: ['gmail'],
    steps: [
      {
        id: 'connect',
        label: 'Connected',
        description: 'Gmail connection is ready.',
      },
      {
        id: 'fetch',
        label: 'Fetching messages',
        description: 'Getting recent emails.',
      },
      {
        id: 'review',
        label: 'Reviewing content',
        description: 'Checking important messages.',
      },
      {
        id: 'summary',
        label: 'Building summary',
        description: 'Preparing a clear result.',
      },
    ],
  },
  calendar: {
    title: 'Reviewing calendar',
    tools: ['calendar'],
    steps: [
      {
        id: 'connect',
        label: 'Connected',
        description: 'Calendar connection is ready.',
      },
      {
        id: 'fetch',
        label: 'Fetching events',
        description: 'Loading upcoming events.',
      },
      {
        id: 'review',
        label: 'Reviewing schedule',
        description: 'Sorting what matters.',
      },
      {
        id: 'summary',
        label: 'Building summary',
        description: 'Preparing the final overview.',
      },
    ],
  },
  browser: {
    title: 'Searching sources',
    tools: ['browser'],
    steps: [
      {
        id: 'search',
        label: 'Searching',
        description: 'Looking for relevant sources.',
      },
      {
        id: 'compare',
        label: 'Comparing',
        description: 'Checking the best matches.',
      },
      {
        id: 'extract',
        label: 'Extracting',
        description: 'Pulling the key details.',
      },
      {
        id: 'summary',
        label: 'Building summary',
        description: 'Preparing the final answer.',
      },
    ],
  },
  memory: {
    title: 'Searching memory',
    tools: ['memory'],
    steps: [
      {
        id: 'search',
        label: 'Searching memory',
        description: 'Looking for relevant past context.',
      },
      {
        id: 'review',
        label: 'Reviewing matches',
        description: 'Checking the best memory signals.',
      },
      {
        id: 'summary',
        label: 'Preparing context',
        description: 'Getting useful memory ready.',
      },
    ],
  },
  files: {
    title: 'Reviewing files',
    tools: ['files'],
    steps: [
      {
        id: 'open',
        label: 'Opening files',
        description: 'Preparing the uploaded content.',
      },
      {
        id: 'scan',
        label: 'Scanning content',
        description: 'Reading the important parts.',
      },
      {
        id: 'summary',
        label: 'Building summary',
        description: 'Preparing the result.',
      },
    ],
  },
  general: {
    title: 'Working on it',
    tools: ['general'],
    steps: [
      {
        id: 'plan',
        label: 'Planning',
        description: 'Understanding the request.',
      },
      {
        id: 'process',
        label: 'Processing',
        description: 'Working through the task.',
      },
      {
        id: 'summary',
        label: 'Preparing answer',
        description: 'Building the final response.',
      },
    ],
  },
};
