'use client';

import type { Message } from '@/app/store/app-store-types';
import { buildPresentationModel } from '@/lib/presentation/build-presentation-model';
import { resolveUiMode } from '@/lib/presentation/resolve-ui-mode';
import { CasualResponseView } from './views/CasualResponseView';
import { CompareResponseView } from './views/CompareResponseView';
import { EmailResponseView } from './views/EmailResponseView';
import { OperatorResponseView } from './views/OperatorResponseView';
import { PlainResponseView } from './views/PlainResponseView';
import { SearchResponseView } from './views/SearchResponseView';
import { ShoppingResponseView } from './views/ShoppingResponseView';

type ResponseRendererProps = {
  message: Message;
  latestUserContent?: string;
};

export function ResponseRenderer({
  message,
  latestUserContent,
}: ResponseRendererProps) {
  const mode = resolveUiMode({
    message,
    metadata: message.agentMetadata,
    structured: message.structured,
    latestUserContent,
  });

  const streamingMode = message.isStreaming && mode !== 'casual' ? 'plain' : mode;

  const model = buildPresentationModel({
    mode: streamingMode,
    message,
    metadata: message.agentMetadata,
    latestUserContent,
  });

  switch (model.mode) {
    case 'casual':
      return <CasualResponseView text={model.plainText || model.summary} />;
    case 'search':
      return <SearchResponseView model={model} />;
    case 'compare':
      return <CompareResponseView model={model} />;
    case 'shopping':
      return <ShoppingResponseView model={model} />;
    case 'email':
      return <EmailResponseView model={model} />;
    case 'operator':
      return <OperatorResponseView model={model} />;
    case 'plain':
    default:
      return (
        <PlainResponseView
          title={model.title}
          lead={model.lead}
          text={model.plainText || model.summary}
        />
      );
  }
}
