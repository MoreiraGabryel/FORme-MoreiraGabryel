import {ScrollTrigger} from 'gsap/ScrollTrigger';

let refreshFrame: number | null = null;
let dirty = false;
let observedDocument: Document | undefined;

const locked = () => typeof document !== 'undefined' && document.documentElement?.dataset.footerSceneActive === 'true';

export const hasPendingSceneRefresh = () => dirty;

/** Only the normal-flow restoration owner may flush while inputs remain locked. */
export function flushSceneRefresh() {
  if (locked() && document.documentElement.dataset.footerSceneRestoring !== 'true') return;
  if (refreshFrame !== null) window.cancelAnimationFrame(refreshFrame);
  refreshFrame = null;
  dirty = false;
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
  ScrollTrigger.update();
  for (const pin of ScrollTrigger.getAll()) {
    if (!pin.trigger?.matches('.hero-stage, .technologies-stage')) continue;
    const target = Math.min(1, Math.max(0, (pin.scroll() - pin.start) / (pin.end - pin.start)));
    // Completing an old scrub target would faithfully render the wrong scene.
    if (!Number.isFinite(target) || Math.abs(pin.progress - target) > 0.0001) throw new Error('Scene pin target is not reconciled');
    const scrubTween = pin.getTween();
    if (scrubTween) scrubTween.progress(1);
    if (pin.animation && Math.abs(pin.animation.totalProgress() - pin.progress) > 0.0001) throw new Error('Scene scrub target is not reconciled');
  }
  window.dispatchEvent(new Event('scroll'));
}

/** Reconcile sibling pin spacers after React finishes the scene layout batch. */
export function requestSceneRefresh() {
  dirty = true;
  if (typeof document !== 'undefined' && observedDocument !== document) {
    observedDocument = document;
    document.addEventListener('footer-scene-scroll-state', () => {
      if (dirty && !locked()) requestSceneRefresh();
    });
  }
  if (locked()) return;
  if (typeof window === 'undefined' || refreshFrame !== null) return;
  refreshFrame = window.requestAnimationFrame(() => {
    refreshFrame = null;
    if (locked()) return;
    dirty = false;
    // Hero phrases recreate their pin; creation order is not document order.
    // Scene refreshPriority keeps upstream spacers ahead of their consumers.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    // App also consumes document geometry, including on a stationary scroll.
    window.dispatchEvent(new Event('scroll'));
  });
}
