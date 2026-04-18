'use client';

import type { StructuredAnswer } from '@/agent/vNext/types';
import { KivoResponseBody } from './KivoResponseBody';

type StructuredAnswerViewProps = {
  answer: StructuredAnswer;
};

export function StructuredAnswerView({ answer }: StructuredAnswerViewProps) {
  return <KivoResponseBody answer={answer} />;
}
