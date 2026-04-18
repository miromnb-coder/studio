'use client';

import type { Message } from '@/app/store/app-store-types';
import { ResponseRenderer } from './ResponseRenderer';

type AgentResponseMessageProps = {
  message: Message;
  latestUserContent?: string;
};

export function AgentResponseMessage({
  message,
  latestUserContent,
}: AgentResponseMessageProps) {
  return (
    <ResponseRenderer message={message} latestUserContent={latestUserContent} />
  );
}
