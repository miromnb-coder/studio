'use client';

import type { StructuredAnswer } from '@/agent/vNext/types';
import type { Message } from '@/app/store/app-store-types';
import { ResponseRenderer } from './ResponseRenderer';

type KivoResponseBodyProps = {
  answer: StructuredAnswer;
};

export function KivoResponseBody({ answer }: KivoResponseBodyProps) {
  const syntheticMessage: Message = {
    id: 'kivo-response-body',
    role: 'assistant',
    content: answer.plainText ?? answer.summary ?? answer.lead ?? '',
    structured: answer,
    createdAt: new Date(0).toISOString(),
  };

  return <ResponseRenderer message={syntheticMessage} />;
}
