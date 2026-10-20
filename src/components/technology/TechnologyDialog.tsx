import {useCallback, useLayoutEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import type {CSSProperties} from 'react';
import {gsap} from 'gsap';
import type {Locale} from '../../i18n/useTranslation';
import {TECHNOLOGY_UI_COPY, type Technology} from '../../config/technologies';
import {createTechnologyCardTimeline, closeTechnologyCardTimeline} from '../../utils/technologyCardMotion';
import {TechnologyIcon} from './TechnologyIcon';

export function TechnologyDialog({technology, locale, reducedMotion, onClosed}: {
  technology: Technology;
  locale: Locale;
  reducedMotion: boolean;
  onClosed: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const shadeRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef(false);
  const uiCopy = TECHNOLOGY_UI_COPY[locale];

  const finishClose = useCallback(() => {
    if (dialogRef.current?.open) dialogRef.current.close();
    onClosed();
  }, [onClosed]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const timeline = timelineRef.current;
    if (timeline) closeTechnologyCardTimeline(timeline, finishClose, reducedMotion);
    else finishClose();
  }, [finishClose, reducedMotion]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const card = cardRef.current;
    if (!dialog || !card) return;
    if (closingRef.current) {
      finishClose();
      return;
    }

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
    document.dispatchEvent(new CustomEvent('technology-modal-state', {detail: {dialog, open: true}}));

    const ctx = gsap.context(() => {
      const timeline = createTechnologyCardTimeline({
        root: card,
        blades: Array.from(card.querySelectorAll('.technology-card-blade')),
        seam: card.querySelector('.technology-card-seam'),
        content: Array.from(card.querySelectorAll('[data-card-content]')),
        shade: shadeRef.current,
      }, 'dialog', reducedMotion);
      timelineRef.current = timeline;
      timeline.play(0);
    }, card);

    return () => {
      ctx.revert();
      timelineRef.current = null;
      if (dialog.open) dialog.close();
      document.documentElement.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
      document.dispatchEvent(new CustomEvent('technology-modal-state', {detail: {dialog, open: false}}));
    };
  }, [technology.id, reducedMotion, finishClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="technology-modal-backdrop"
      data-lenis-prevent
      aria-labelledby={`technology-modal-title-${technology.id}`}
      aria-describedby={`technology-modal-description-${technology.id}`}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget || event.target === shadeRef.current) requestClose();
      }}
    >
      <div ref={shadeRef} className="technology-modal-shade" aria-hidden="true" />
      <div ref={cardRef} className="technology-modal-card">
        <div className="technology-card-blade is-leading" aria-hidden="true" />
        <div className="technology-card-blade is-trailing" aria-hidden="true" />
        <span className="technology-card-seam" aria-hidden="true" />
        <span className="technology-card-corner" aria-hidden="true" />
        <button type="button" className="technology-modal-close" aria-label={uiCopy.close} onClick={requestClose}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <div className="technology-modal-heading" data-card-content>
          <div className="technology-modal-icon-wrap">
            <TechnologyIcon
              className="technology-modal-icon"
              src={technology.icon}
              label={technology.label}
              style={{
                '--icon-scale': technology.iconScale ?? 1,
                '--icon-offset-x': `${technology.iconOffsetX ?? 0}px`,
                '--icon-offset-y': `${technology.iconOffsetY ?? 0}px`,
              } as CSSProperties}
            />
          </div>
          <div>
            <span className="technology-card-category">{technology.category[locale]}</span>
            <h3 id={`technology-modal-title-${technology.id}`}>{technology.label}</h3>
          </div>
        </div>
        <div className="technology-modal-application" data-card-content>
          <span className="technology-card-category">{uiCopy.application}</span>
          <p id={`technology-modal-description-${technology.id}`}>{technology.description[locale]}</p>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
