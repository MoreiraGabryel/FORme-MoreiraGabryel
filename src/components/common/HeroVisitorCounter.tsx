import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {gsap} from 'gsap';
import type {Locale} from '../../i18n/useTranslation';
import {countHeroVisitOnce} from '../../utils/heroVisitCounter';
import type {HeroVisitCount} from '../../utils/heroVisitCounter';
import './HeroVisitorCounter.css';

export function HeroVisitorCounter({active, locale}: {active: boolean; locale: Locale}) {
  const [visible, setVisible] = useState(() => !document.hidden);
  const [count, setCount] = useState<HeroVisitCount | null>(null);
  const previousRef = useRef<HTMLSpanElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const syncVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  useEffect(() => {
    if (!active || !visible) return;
    let mounted = true;
    void countHeroVisitOnce().then(value => {if (mounted) setCount(value);});
    return () => {mounted = false;};
  }, [active, visible]);

  useLayoutEffect(() => {
    const previous = previousRef.current;
    const current = currentRef.current;
    if (!count || !active || !visible || !previous || !current || animatedRef.current) return;
    animatedRef.current = true;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches) return;

    let timeline: gsap.core.Timeline;
    const context = gsap.context(() => {
      timeline = gsap.timeline({defaults: {duration: 0.65, ease: 'power3.inOut'}})
        .fromTo(previous, {yPercent: 0, autoAlpha: 1}, {yPercent: -115, autoAlpha: 0, force3D: true}, 0.12)
        .fromTo(current, {yPercent: 115, autoAlpha: 0}, {yPercent: 0, autoAlpha: 1, force3D: true}, 0.2);
    });
    const settleMotion = () => {if (motionPreference.matches) timeline.progress(1);};
    motionPreference.addEventListener('change', settleMotion);
    return () => {
      motionPreference.removeEventListener('change', settleMotion);
      context.revert();
    };
  }, [active, count, visible]);

  if (!count) return null;
  const format = new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US');
  const label = `${format.format(count.total)} ${locale === 'pt' ? 'visitas ao site' : 'site visits'}`;
  return (
    <span className="hero-visitor-counter" role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 20v-1.5a6.5 6.5 0 0 1 13 0V20" />
      </svg>
      <span className="hero-visitor-counter__digits" aria-hidden="true">
        <span ref={previousRef} className="hero-visitor-counter__previous">{format.format(count.previous)}</span>
        <span ref={currentRef} className="hero-visitor-counter__current">{format.format(count.total)}</span>
      </span>
    </span>
  );
}
