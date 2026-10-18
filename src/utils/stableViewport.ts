import {readIsMobileViewport} from './mobileViewport.ts';

type ViewportEvent = 'resize' | 'orientationchange';
type ViewportListener = () => void;

export type StableViewportSource = {
  readWidth: () => number;
  readHeight: () => number;
  publishHeight: (height: number) => void;
  addListener: (event: ViewportEvent, listener: ViewportListener) => void;
  removeListener: (event: ViewportEvent, listener: ViewportListener) => void;
};

export function createStableViewportController(source: StableViewportSource) {
  let width = 0;
  let height = 1;
  let started = false;

  const capture = (force = false) => {
    const nextWidth = Math.max(Math.round(source.readWidth()), 1);
    if (!force && nextWidth === width) return;

    width = nextWidth;
    height = Math.max(Math.round(source.readHeight()), 1);
    source.publishHeight(height);
  };

  const handleResize = () => capture(false);
  const handleOrientationChange = () => capture(true);

  return {
    start() {
      if (started) return;
      started = true;
      capture(true);
      source.addListener('resize', handleResize);
      source.addListener('orientationchange', handleOrientationChange);
    },
    stop() {
      if (!started) return;
      started = false;
      source.removeListener('resize', handleResize);
      source.removeListener('orientationchange', handleOrientationChange);
    },
    getHeight() {
      return height;
    },
  };
}

let browserController: ReturnType<typeof createStableViewportController> | undefined;
let visualViewportInitialized = false;

function initializeMobileVisualViewport() {
  if (visualViewportInitialized) return;
  visualViewportInitialized = true;
  let frame = 0;
  let previous = '';
  const publish = () => {
    frame = 0;
    if (!readIsMobileViewport()) {
      if (previous) {
        document.documentElement.style.removeProperty('--mobile-visual-vh');
        document.documentElement.style.removeProperty('--mobile-visual-top');
        previous = '';
      }
      return;
    }
    const viewport = window.visualViewport;
    // Pinch zoom remains native; do not rearrange the page underneath the gesture.
    if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
    const height = Math.round(viewport?.height ?? window.innerHeight);
    if (height <= 0) return;
    const top = Math.max(0, Math.round(viewport?.offsetTop ?? 0));
    const next = `${height}:${top}`;
    if (next === previous) return;
    previous = next;
    document.documentElement.style.setProperty('--mobile-visual-vh', `${height}px`);
    document.documentElement.style.setProperty('--mobile-visual-top', `${top}px`);
  };
  const request = () => {if (!frame) frame = window.requestAnimationFrame(publish);};
  window.addEventListener('resize', request, {passive: true});
  window.addEventListener('orientationchange', request, {passive: true});
  window.visualViewport?.addEventListener('resize', request, {passive: true});
  window.visualViewport?.addEventListener('scroll', request, {passive: true});
  document.addEventListener('visibilitychange', request);
  publish();
}

function readBrowserSceneHeight() {
  if (!readIsMobileViewport()) return window.innerHeight;
  const fallback = Math.min(window.innerHeight, document.documentElement.clientHeight || window.innerHeight);
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none;contain:strict';
  document.documentElement.appendChild(probe);
  try {
    // Freeze the small viewport in pixels; do not let browser UI resize live effects.
    const height = probe.getBoundingClientRect().height;
    probe.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    const safeBottom = Number.parseFloat(window.getComputedStyle(probe).paddingBottom) || 0;
    document.documentElement.style.setProperty('--stable-safe-area-bottom', `${Math.max(safeBottom, 0)}px`);
    return Number.isFinite(height) && height > 0 ? Math.min(height, fallback) : fallback;
  } finally {
    probe.remove();
  }
}

export function initializeStableViewport() {
  if (!browserController) {
    browserController = createStableViewportController({
      readWidth: () => window.innerWidth,
      readHeight: readBrowserSceneHeight,
      publishHeight: (height) => {
        document.documentElement.style.setProperty('--stable-vh', `${height}px`);
      },
      addListener: (event, listener) => window.addEventListener(event, listener, {passive: true}),
      removeListener: (event, listener) => window.removeEventListener(event, listener),
    });
    browserController.start();
    // Presentation follows browser chrome; scroll distances retain the captured height.
    initializeMobileVisualViewport();
  }

  return browserController;
}

export function getStableViewportHeight() {
  return initializeStableViewport().getHeight();
}
