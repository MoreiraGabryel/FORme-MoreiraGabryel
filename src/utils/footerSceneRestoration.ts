import {gsap} from 'gsap';
import {hasPendingSceneRefresh} from './sceneRefresh';

function visibleFrame(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    let frame: number | undefined;
    const cleanup = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', schedule);
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {cleanup();reject(signal.reason);};
    const schedule = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
      if (document.hidden) return;
      frame = window.requestAnimationFrame(() => {
        frame = undefined;
        if (document.hidden) return;
        cleanup();resolve();
      });
    };
    signal.addEventListener('abort', abort, {once: true});
    document.addEventListener('visibilitychange', schedule);
    if (signal.aborted) abort();else schedule();
  });
}

/** Drain commits/rebuilds, not a guessed number of milliseconds of black. */
export async function restoreFooterScene(signal: AbortSignal, reconcile: () => void) {
  const busy = () => hasPendingSceneRefresh() || gsap.getTweensOf('.hero-statement-character').some(tween =>
    tween.isActive() || (tween.parent !== gsap.globalTimeline && tween.parent?.isActive()),
  );
  for (;;) {
    await visibleFrame(signal);
    signal.throwIfAborted();
    reconcile();
    await visibleFrame(signal);
    signal.throwIfAborted();
    // flushSync in the owner also commits a phrase completion queued this frame.
    reconcile();
    if (!document.hidden && !busy()) return;
  }
}
