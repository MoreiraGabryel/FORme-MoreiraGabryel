import {useLayoutEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import type {RefObject} from 'react';
import {gsap} from 'gsap';
import type {Locale} from '../../i18n/useTranslation';
import {TECHNOLOGY_UI_COPY, type Technology} from '../../config/technologies';
import {createTechnologyCardTimeline, closeTechnologyCardTimeline} from '../../utils/technologyCardMotion';
import {getTechnologyTooltipPosition} from '../../utils/technologyTooltipPosition';

export function TechnologyHoverCard({technology, locale, open, reducedMotion, buttonsRef, onExited}: {
  technology: Technology;
  locale: Locale;
  open: boolean;
  reducedMotion: boolean;
  buttonsRef: RefObject<Record<string, HTMLButtonElement | null>>;
  onExited?: (id: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const uiCopy = TECHNOLOGY_UI_COPY[locale];

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const ctx = gsap.context(() => {
      timelineRef.current = createTechnologyCardTimeline({
        root: card,
        blades: Array.from(card.querySelectorAll('.technology-card-blade')),
        seam: card.querySelector('.technology-card-seam'),
        content: Array.from(card.querySelectorAll('[data-card-content]')),
      }, 'hover', reducedMotion);
    }, card);
    return () => {
      ctx.revert();
      timelineRef.current = null;
    };
  }, [technology.id, reducedMotion]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    const timeline = timelineRef.current;
    if (!card || !timeline) return;

    if (!open) {
      closeTechnologyCardTimeline(timeline, () => {
        card.style.visibility = 'hidden';
        onExited?.(technology.id);
      }, reducedMotion);
      return;
    }

    const syncPosition = () => {
      const anchor = buttonsRef.current[technology.id];
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const position = getTechnologyTooltipPosition(rect, {
        width: card.offsetWidth,
        height: card.offsetHeight,
      }, {width: window.innerWidth, height: window.innerHeight});
      card.style.left = `${position.left}px`;
      card.style.top = `${position.top}px`;
    };
    card.style.visibility = 'visible';
    syncPosition();
    timeline.eventCallback('onReverseComplete', null);
    timeline.timeScale(1).play();
    if (!reducedMotion) gsap.ticker.add(syncPosition);
    return () => { gsap.ticker.remove(syncPosition); };
  }, [open, technology.id, locale, reducedMotion, buttonsRef, onExited]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={cardRef} className="technology-hover-card" id={`technology-tooltip-${technology.id}`} role="tooltip" aria-hidden={!open}>
      <div className="technology-card-blade is-leading" aria-hidden="true" />
      <div className="technology-card-blade is-trailing" aria-hidden="true" />
      <span className="technology-card-seam" aria-hidden="true" />
      <div className="technology-hover-heading" data-card-content>
        <span className="technology-card-category">{technology.category[locale]}</span>
        <strong>{technology.label}</strong>
      </div>
      <p data-card-content>{technology.tooltip[locale]}</p>
      <span className="technology-hover-action" data-card-content>
        {uiCopy.inspect}
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" /></svg>
      </span>
    </div>,
    document.body,
  );
}
