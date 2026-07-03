import {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {CSSProperties, ElementType} from 'react';
import {gsap} from 'gsap';

type StageTitleCycleTextProps<T extends ElementType = 'div'> = {
  as?: T;
  phrases: string[];
  active?: boolean;
  className?: string;
  introTypingSpeedMs?: number;
  introHoldDurationMs?: number;
  cycleHoldDurationMs?: number;
  reelDurationMs?: number;
  initialDelayMs?: number;
};

type Phase = 'idle' | 'typing' | 'intro-hold' | 'steady' | 'reel';

export function StageTitleCycleText<T extends ElementType = 'div'>({
  as,
  phrases,
  active = true,
  className,
  introTypingSpeedMs = 30,
  introHoldDurationMs = 1400,
  cycleHoldDurationMs = 2400,
  reelDurationMs = 640,
  initialDelayMs = 220,
}: StageTitleCycleTextProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  const safePhrases = useMemo(() => phrases.filter(Boolean), [phrases]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [visibleLength, setVisibleLength] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [layoutReady, setLayoutReady] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const currentLineRef = useRef<HTMLSpanElement | null>(null);
  const nextLineRef = useRef<HTMLSpanElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const currentPhrase = safePhrases[currentIndex] ?? '';
  const upcomingPhrase = nextIndex === null ? '' : safePhrases[nextIndex] ?? '';
  const isIntro = phase === 'idle' || phase === 'typing' || phase === 'intro-hold';
  const isSteady = phase === 'steady';
  const isReel = phase === 'reel' && nextIndex !== null;

  useEffect(() => {
    let cancelled = false;
    let frameId = 0;
    setLayoutReady(false);

    const markReady = () => {
      if (!cancelled) setLayoutReady(true);
    };

    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(markReady, markReady);
    } else {
      frameId = window.requestAnimationFrame(markReady);
    }

    return () => {
      cancelled = true;
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [safePhrases]);

  useEffect(() => {
    setCurrentIndex(0);
    setNextIndex(null);
    setVisibleLength(0);
    setPhase('idle');
  }, [active, safePhrases]);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!active || !layoutReady || safePhrases.length === 0) return;
    if (phase === 'reel') return;

    if (phase === 'idle') {
      timeoutRef.current = window.setTimeout(() => {
        setPhase('typing');
      }, initialDelayMs);
      return;
    }

    if (phase === 'typing') {
      if (visibleLength < currentPhrase.length) {
        timeoutRef.current = window.setTimeout(() => {
          setVisibleLength((current) => Math.min(current + 1, currentPhrase.length));
        }, introTypingSpeedMs);
      } else {
        setPhase('intro-hold');
      }
      return;
    }

    if (phase === 'intro-hold') {
      timeoutRef.current = window.setTimeout(() => {
        setPhase(safePhrases.length > 1 ? 'steady' : 'intro-hold');
      }, introHoldDurationMs);
      return;
    }

    if (phase === 'steady' && safePhrases.length > 1) {
      timeoutRef.current = window.setTimeout(() => {
        setNextIndex((currentIndex + 1) % safePhrases.length);
        setPhase('reel');
      }, cycleHoldDurationMs);
    }

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [active, currentIndex, currentPhrase.length, cycleHoldDurationMs, initialDelayMs, introHoldDurationMs, introTypingSpeedMs, layoutReady, phase, safePhrases, visibleLength]);

  useLayoutEffect(() => {
    if (!isReel || !currentLineRef.current || !nextLineRef.current || nextIndex === null) return;

    const currentLine = currentLineRef.current;
    const nextLine = nextLineRef.current;

    timelineRef.current?.kill();

    const ctx = gsap.context(() => {
      gsap.set(currentLine, {
        yPercent: 0,
        opacity: 1,
        filter: 'blur(0px)',
        transformOrigin: '50% 50%',
      });
      gsap.set(nextLine, {
        yPercent: 108,
        opacity: 0.22,
        filter: 'blur(6px)',
        transformOrigin: '50% 50%',
      });
      gsap.set(rootRef.current, {
        y: 0,
        filter: 'drop-shadow(0 0 0 rgba(255,255,255,0))',
      });

      const tl = gsap.timeline({
        defaults: {duration: reelDurationMs / 1000},
        onComplete: () => {
          setCurrentIndex(nextIndex);
          setNextIndex(null);
          setPhase('steady');
        },
      });

      tl.to(
        currentLine,
          {
            yPercent: -116,
            opacity: 0.04,
            filter: 'blur(7px)',
            ease: 'power3.inOut',
          },
        0,
      )
        .to(
          nextLine,
          {
            yPercent: 0,
            opacity: 1,
            filter: 'blur(0px)',
            ease: 'power4.out',
          },
          0.08,
        )
        .to(
          rootRef.current,
          {
            y: -3,
            filter: 'drop-shadow(0 14px 34px rgba(255,255,255,0.11))',
            duration: Math.max(0.26, reelDurationMs / 1500),
            ease: 'sine.out',
          },
          0,
        )
        .to(
          rootRef.current,
          {
            y: 0,
            filter: 'drop-shadow(0 0 0 rgba(255,255,255,0))',
            duration: Math.max(0.3, reelDurationMs / 1300),
            ease: 'power2.out',
          },
          Math.max(0.24, reelDurationMs / 1600),
        );

      timelineRef.current = tl;
    }, rootRef);

    return () => {
      ctx.revert();
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, [isReel, nextIndex, reelDurationMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timelineRef.current?.kill();
    };
  }, []);

  return (
    <Component className={className} data-phase={phase} aria-live="polite" style={{'--reel-duration': `${reelDurationMs}ms`} as CSSProperties}>
      <span ref={rootRef} className="stage-title-cycle">
        <span className="stage-title-cycle-sizer" aria-hidden="true">
          {safePhrases.map((phrase) => (
            <span key={phrase} className="stage-title-cycle-sizer-line">
              <span className="stage-title-cycle-content">{phrase}</span>
            </span>
          ))}
        </span>

        {isIntro ? (
          <span className="stage-title-cycle-visual is-typewriter">
            <span className="stage-title-cycle-phrase is-live">
              <span className="stage-title-cycle-content">{currentPhrase.slice(0, visibleLength)}</span>
              <span className="stage-title-cycle-cursor" aria-hidden="true" />
            </span>
          </span>
        ) : null}

        {isSteady ? (
          <span className="stage-title-cycle-visual is-steady">
            <span className="stage-title-cycle-phrase is-live">
              <span className="stage-title-cycle-content">{currentPhrase}</span>
            </span>
          </span>
        ) : null}

        {isReel ? (
          <span className="stage-title-cycle-visual is-reel">
            <span className="stage-title-cycle-reel-viewport">
              <span ref={currentLineRef} className="stage-title-cycle-reel-line is-current">
                <span className="stage-title-cycle-content">{currentPhrase}</span>
              </span>
              <span ref={nextLineRef} className="stage-title-cycle-reel-line is-next" aria-hidden="true">
                <span className="stage-title-cycle-content">{upcomingPhrase}</span>
              </span>
            </span>
          </span>
        ) : null}
      </span>
    </Component>
  );
}
