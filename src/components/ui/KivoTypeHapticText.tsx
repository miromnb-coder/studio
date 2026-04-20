'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type KivoTypeHapticTextProps = {
  phrases: string[];
  className?: string;
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  holdFullTextMs?: number;
  holdEmptyMs?: number;
  loop?: boolean;
  cursor?: boolean;
  hapticsEveryNthChar?: number;
};

type Phase = 'typing' | 'holding_full' | 'deleting' | 'holding_empty';

function vibrateLight(): void {
  if (typeof window === 'undefined') return;

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(8);
  }
}

export function KivoTypeHapticText({
  phrases,
  className,
  typingSpeedMs = 70,
  deletingSpeedMs = 38,
  holdFullTextMs = 1100,
  holdEmptyMs = 240,
  loop = true,
  cursor = true,
  hapticsEveryNthChar = 1,
}: KivoTypeHapticTextProps) {
  const safePhrases = useMemo(
    () => phrases.map((item) => item.trim()).filter(Boolean),
    [phrases],
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleText, setVisibleText] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  const stepRef = useRef(0);

  useEffect(() => {
    if (safePhrases.length === 0) return;

    const currentPhrase = safePhrases[phraseIndex] ?? '';
    let timeoutId: number | undefined;

    if (phase === 'typing') {
      if (visibleText.length < currentPhrase.length) {
        timeoutId = window.setTimeout(() => {
          const nextLength = visibleText.length + 1;
          const nextText = currentPhrase.slice(0, nextLength);
          setVisibleText(nextText);

          stepRef.current += 1;
          if (
            hapticsEveryNthChar > 0 &&
            stepRef.current % hapticsEveryNthChar === 0
          ) {
            vibrateLight();
          }

          if (nextLength >= currentPhrase.length) {
            setPhase('holding_full');
          }
        }, typingSpeedMs);
      } else {
        setPhase('holding_full');
      }
    }

    if (phase === 'holding_full') {
      timeoutId = window.setTimeout(() => {
        setPhase('deleting');
      }, holdFullTextMs);
    }

    if (phase === 'deleting') {
      if (visibleText.length > 0) {
        timeoutId = window.setTimeout(() => {
          const nextText = visibleText.slice(0, -1);
          setVisibleText(nextText);

          stepRef.current += 1;
          if (
            hapticsEveryNthChar > 0 &&
            stepRef.current % hapticsEveryNthChar === 0
          ) {
            vibrateLight();
          }

          if (nextText.length === 0) {
            setPhase('holding_empty');
          }
        }, deletingSpeedMs);
      } else {
        setPhase('holding_empty');
      }
    }

    if (phase === 'holding_empty') {
      timeoutId = window.setTimeout(() => {
        const isLast = phraseIndex >= safePhrases.length - 1;

        if (isLast && !loop) {
          setPhase('holding_empty');
          return;
        }

        setPhraseIndex((prev) => {
          if (prev >= safePhrases.length - 1) return 0;
          return prev + 1;
        });
        setPhase('typing');
      }, holdEmptyMs);
    }

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [
    visibleText,
    phase,
    phraseIndex,
    safePhrases,
    typingSpeedMs,
    deletingSpeedMs,
    holdFullTextMs,
    holdEmptyMs,
    loop,
    hapticsEveryNthChar,
  ]);

  if (safePhrases.length === 0) return null;

  return (
    <span className={className}>
      {visibleText}
      {cursor ? (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block animate-pulse opacity-70"
        >
          |
        </span>
      ) : null}
    </span>
  );
}
