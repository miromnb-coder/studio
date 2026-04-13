import type { AgentRequest } from './types';

export const vNextSampleRequest: AgentRequest = {
  requestId: 'req-demo-001',
  userId: 'user-demo-001',
  message: 'Please compare two budget apps and recommend the best one for my goals.',
  conversation: [
    { role: 'user', content: 'I need help choosing finance apps.' },
    { role: 'assistant', content: 'Sure, what matters most to you?' },
  ],
};
