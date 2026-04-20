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
  hapticsEnabled?: boolean;
};

type Phase = 'typing' | 'holding_full' | 'deleting' | 'holding_empty';

const MIN_HAPTIC_INTERVAL_MS = 32;

function canUseNavigatorVibrate(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
}

function triggerWebHaptic(): void {
  if (canUseNavigatorVibrate()) {
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
  hapticsEnabled = true,
}: KivoTypeHapticTextProps) {
  const safePhrases = useMemo(
    () => phrases.map((item) => item.trim()).filter(Boolean),
    [phrases],
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleText, setVisibleText] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');

  const stepRef = useRef(0);
  const lastHapticAtRef = useRef(0);

  const maybeTriggerHaptic = () => {
    if (!hapticsEnabled) return;
    if (hapticsEveryNthChar <= 0) return;

    stepRef.current += 1;

    if (stepRef.current % hapticsEveryNthChar !== 0) return;

    const now = Date.now();
    if (now - lastHapticAtRef.current < MIN_HAPTIC_INTERVAL_MS) return;

    lastHapticAtRef.current = now;
    triggerWebHaptic();
  };

  useEffect(() => {
    if (safePhrases.length === 0) return;

    const currentPhrase = safePhrases[phraseIndex] ?? '';
    let timeoutId: number | undefined;

    if (phase === 'typing') {
      if (visibleText.length < currentPhrase.length) {
        timeoutId = window.setTimeout(() => {
          const nextLength = visibleText.length + 1;
          const nextText = currentPhrase.slice(0, nextLength);

          if (nextText !== visibleText) {
            setVisibleText(nextText);
            maybeTriggerHaptic();
          }

          if (nextLength >= currentPhrase.length) {
            setPhase('holding_full');
          }
        }, typingSpeedMs);
      } else {
        setPhase('holding_full');
      }
    } else if (phase === 'holding_full') {
      timeoutId = window.setTimeout(() => {
        setPhase('deleting');
      }, holdFullTextMs);
    } else if (phase === 'deleting') {
      if (visibleText.length > 0) {
        timeoutId = window.setTimeout(() => {
          const nextText = visibleText.slice(0, -1);

          if (nextText !== visibleText) {
            setVisibleText(nextText);
            maybeTriggerHaptic();
          }

          if (nextText.length === 0) {
            setPhase('holding_empty');
          }
        }, deletingSpeedMs);
      } else {
        setPhase('holding_empty');
      }
    } else if (phase === 'holding_empty') {
      timeoutId = window.setTimeout(() => {
        const isLast = phraseIndex >= safePhrases.length - 1;

        if (isLast && !loop) {
          return;
        }

        setPhraseIndex((prev) =>
          prev >= safePhrases.length - 1 ? 0 : prev + 1,
        );
        setPhase('typing');
      }, holdEmptyMs);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    deletingSpeedMs,
    holdEmptyMs,
    holdFullTextMs,
    loop,
    phase,
    phraseIndex,
    safePhrases,
    typingSpeedMs,
    visibleText,
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
