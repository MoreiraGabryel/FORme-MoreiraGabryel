import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import type {Locale} from '../../i18n/useTranslation';
import {createFooterVisitCounter, FOOTER_MAX_VISITS} from '../../utils/footerScenePolicy';
import {createFooterSceneController} from '../../utils/footerSceneController';
import type {FooterSceneState} from '../../utils/footerSceneController';
import {acquireFooterSceneInputLock} from '../../utils/footerSceneInputLock';
import './FinalFooterStage.css';

type Props = {enabled: boolean; locale: Locale; onRestore?: (signal: AbortSignal) => Promise<void>};
const isActive = (state: FooterSceneState) => state === 'loading' || state === 'playing' || state === 'blackout' || state === 'revealing';

/** The black section remains in the journey; playback lives outside the inert app. */
export function FinalFooterStage({enabled, locale, onRestore}: Props) {
  const restoreRef = useRef(onRestore);
  useLayoutEffect(() => {restoreRef.current = onRestore;}, [onRestore]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<FooterSceneState>('idle');

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!enabled || !section || !video || !overlay) return;
    let storage: Storage | undefined;
    try {storage = window.localStorage;} catch { /* Local-only fallback when site storage is denied. */ }
    const counter = createFooterVisitCounter(storage);
    const applyState = (next: FooterSceneState) => {
      overlay.dataset.state = next;
      overlay.hidden = !isActive(next);
      if (next === 'loading') {
        overlay.dataset.frameReady = 'false';
        overlay.dataset.mediaPhase = 'entrance';
      }
      setState(next);
    };
    const controller = createFooterSceneController({
      video, counter,
      acquireLock: () => acquireFooterSceneInputLock(document, window, signal => {
        if (!restoreRef.current) return Promise.reject(new Error('Scene restoration owner is missing'));
        return restoreRef.current(signal);
      }),
      onState: applyState,
      onTime(mediaTime) {
        overlay.dataset.frameReady = 'true';
        const phase = mediaTime < 2.8 ? 'entrance' : mediaTime < 6.4 ? 'character' : mediaTime < 9.1 ? 'interference' : 'collapse';
        if (overlay.dataset.mediaPhase !== phase) overlay.dataset.mediaPhase = phase;
      },
    });
    applyState(controller.getState());
    controller.setVisible(!document.hidden);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => {overlay.dataset.reducedMotion = String(reduced.matches);};
    updateMotionPreference();
    reduced.addEventListener('change', updateMotionPreference);
    let prepared = false;
    let request: number | undefined;
    const check = () => {
      request = undefined;
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      const rect = section.getBoundingClientRect();
      if (!prepared && !document.hidden && counter.read() < FOOTER_MAX_VISITS && rect.top < offset + height * 2 && rect.bottom > offset) {
        prepared = true;
        video.preload = 'auto';
        video.load();
      }
      controller.checkViewport({top: rect.top - offset, bottom: rect.bottom - offset}, height);
    };
    const requestCheck = () => {if (request === undefined) request = window.requestAnimationFrame(check);};
    const visibilityChanged = () => {controller.setVisible(!document.hidden);requestCheck();};
    const pageHidden = () => controller.cancel();
    const pageRestored = () => {controller.setVisible(!document.hidden);requestCheck();};
    window.addEventListener('scroll', requestCheck, {passive: true});
    window.addEventListener('resize', requestCheck);
    window.visualViewport?.addEventListener('resize', requestCheck);
    window.visualViewport?.addEventListener('scroll', requestCheck);
    window.addEventListener('pagehide', pageHidden);
    window.addEventListener('pageshow', pageRestored);
    document.addEventListener('visibilitychange', visibilityChanged);
    check();
    return () => {
      window.removeEventListener('scroll', requestCheck);
      window.removeEventListener('resize', requestCheck);
      window.visualViewport?.removeEventListener('resize', requestCheck);
      window.visualViewport?.removeEventListener('scroll', requestCheck);
      window.removeEventListener('pagehide', pageHidden);
      window.removeEventListener('pageshow', pageRestored);
      document.removeEventListener('visibilitychange', visibilityChanged);
      reduced.removeEventListener('change', updateMotionPreference);
      if (request !== undefined) window.cancelAnimationFrame(request);
      controller.dispose();
      overlay.hidden = true;
    };
  }, [enabled]);

  const active = enabled && isActive(state);
  return (
    <>
      <section ref={sectionRef} className="final-blackout-stage" data-section="final-blackout" aria-hidden="true" />
      {typeof document !== 'undefined' && createPortal(
        <div
          ref={overlayRef}
          className="footer-scene-overlay"
          data-footer-scene-overlay=""
          data-state={state}
          hidden={!active}
          aria-busy={active}
        >
          <span className="sr-only" role="status">{locale === 'en' ? 'Final sequence in progress.' : 'Cena de encerramento em andamento.'}</span>
          <video
            ref={videoRef}
            className="footer-scene-character"
            preload="none"
            playsInline
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
          >
            <source src="/media/footer-character.webm" type="video/webm" />
            <source src="/media/footer-character.mp4" type="video/mp4" />
          </video>
        </div>,
        document.body,
      )}
    </>
  );
}
