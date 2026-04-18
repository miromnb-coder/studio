'use client';

import type { StructuredAnswer } from '@/agent/vNext/types';
import type { Message } from '@/app/store/app-store-types';
import { ResponseRenderer } from './ResponseRenderer';

type StructuredAnswerViewProps = {
  answer: StructuredAnswer;
};

export function StructuredAnswerView({ answer }: StructuredAnswerViewProps) {
  const syntheticMessage: Message = {
    id: 'structured-answer',
    role: 'assistant',
    content: answer.plainText ?? answer.summary ?? answer.lead ?? '',
    structured: answer,
    createdAt: new Date(0).toISOString(),
  };

  return <ResponseRenderer message={syntheticMessage} />;
}
