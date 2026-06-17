import {useEffect, useMemo, useRef, useState} from 'react';
import type {ElementType} from 'react';

type TypewriterTextProps<T extends ElementType = 'div'> = {
  as?: T;
  phrases: string[];
  active?: boolean;
  paused?: boolean;
  className?: string;
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  holdDurationMs?: number;
  initialDelayMs?: number;
};

type Phase = 'idle' | 'typing' | 'holding' | 'deleting';

export function TypewriterText<T extends ElementType = 'div'>({
  as,
  phrases,
  active = true,
  paused = false,
  className,
  typingSpeedMs = 30,
  deletingSpeedMs = 20,
  holdDurationMs = 3100,
  initialDelayMs = 240,
}: TypewriterTextProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  const safePhrases = useMemo(() => phrases.filter(Boolean), [phrases]);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleLength, setVisibleLength] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const timeoutRef = useRef<number | null>(null);

  const currentPhrase = safePhrases[phraseIndex] ?? '';
  const visibleText = currentPhrase.slice(0, visibleLength);

  useEffect(() => {
    setPhraseIndex(0);
    setVisibleLength(0);
    setPhase('idle');
  }, [active, safePhrases]);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!active || paused || safePhrases.length === 0) return;

    if (phase === 'idle') {
      timeoutRef.current = window.setTimeout(() => {
        setPhase('typing');
      }, initialDelayMs);
      return () => {
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      };
    }

    if (phase === 'typing') {
      if (visibleLength < currentPhrase.length) {
        timeoutRef.current = window.setTimeout(() => {
          setVisibleLength((current) => Math.min(current + 1, currentPhrase.length));
        }, typingSpeedMs);
      } else {
        setPhase('holding');
      }
    }

    if (phase === 'holding') {
      timeoutRef.current = window.setTimeout(() => {
        if (safePhrases.length <= 1) return;
        setPhase('deleting');
      }, holdDurationMs);
    }

    if (phase === 'deleting') {
      if (visibleLength > 0) {
        timeoutRef.current = window.setTimeout(() => {
          setVisibleLength((current) => Math.max(current - 1, 0));
        }, deletingSpeedMs);
      } else {
        setPhraseIndex((current) => (safePhrases.length <= 1 ? current : (current + 1) % safePhrases.length));
        setPhase('typing');
      }
    }

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [active, currentPhrase, deletingSpeedMs, holdDurationMs, initialDelayMs, paused, phase, safePhrases, typingSpeedMs, visibleLength]);

  const longestPhrase = safePhrases.reduce((longest, phrase) => (phrase.length > longest.length ? phrase : longest), currentPhrase);

  return (
    <Component className={className} data-phase={phase} aria-live="polite">
      <span className="typewriter-text">
        <span className="typewriter-text-sizer" aria-hidden="true">
          <span className="typewriter-text-content">{longestPhrase}</span>
        </span>
        <span className="typewriter-text-visual">
          <span className="typewriter-text-phrase is-live">
            <span className="typewriter-text-content">{visibleText}</span>
            <span className="typewriter-cursor" aria-hidden="true" />
          </span>
        </span>
      </span>
    </Component>
  );
}
