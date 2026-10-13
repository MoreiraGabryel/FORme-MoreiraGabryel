import {ScrollTrigger} from 'gsap/ScrollTrigger';

let refreshFrame: number | null = null;

/** Reconcile sibling pin spacers after React finishes the scene layout batch. */
export function requestSceneRefresh() {
  if (typeof window === 'undefined' || refreshFrame !== null) return;
  refreshFrame = window.requestAnimationFrame(() => {
    refreshFrame = null;
    // Hero phrases recreate their pin; creation order is not document order.
    // Scene refreshPriority keeps upstream spacers ahead of their consumers.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    // App also consumes document geometry, including on a stationary scroll.
    window.dispatchEvent(new Event('scroll'));
  });
}
