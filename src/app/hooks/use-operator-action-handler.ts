'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/store/app-store';
import { trackEvent } from '@/app/lib/analytics-client';
import type { OperatorAction, OperatorResponse } from '@/types/operator-response';
import { executeOperatorAction } from '@/lib/operator/action-engine';

type UseOperatorActionHandlerArgs = {
  messageId: string;
  responseMode?: string;
  operatorResponse?: OperatorResponse;
  latestUserContent?: string;
  intent?: string;
};

export function useOperatorActionHandler({
  messageId,
  responseMode,
  operatorResponse,
  latestUserContent,
  intent,
}: UseOperatorActionHandlerArgs) {
  const router = useRouter();
  const sendMessage = useAppStore((s) => s.sendMessage);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);
  const conversationId = useAppStore((s) => s.activeConversationId);

  return useCallback(
    async (action: OperatorAction) => {
      const executed = executeOperatorAction({
        action,
        context: {
          answer: operatorResponse?.answer,
          nextStep: operatorResponse?.nextStep,
          userInput: latestUserContent,
          intent,
        },
        navigate: (route) => router.push(route),
        enqueuePrompt: (prompt) => {
          if (isAgentResponding) {
            enqueuePromptAndGoToChat(prompt);
            return;
          }
          void sendMessage(prompt);
        },
      });

      trackEvent('operator_action_clicked', {
        conversationId,
        messageId,
        properties: {
          actionId: executed.id,
          actionLabel: executed.label,
          actionKind: executed.kind,
          actionBehavior: executed.behavior,
          responseMode: responseMode || 'unknown',
          intent: intent || 'unknown',
        },
      });

      if (/\b(resume|continue|revisit|finish)\b/i.test(executed.label)) {
        trackEvent('memory_resume_action_clicked', {
          conversationId,
          messageId,
          properties: {
            actionId: executed.id,
            actionLabel: executed.label,
            intent: intent || 'unknown',
          },
        });
      }
    },
    [
      conversationId,
      enqueuePromptAndGoToChat,
      intent,
      isAgentResponding,
      latestUserContent,
      messageId,
      operatorResponse?.answer,
      operatorResponse?.nextStep,
      responseMode,
      router,
      sendMessage,
    ],
  );
}
