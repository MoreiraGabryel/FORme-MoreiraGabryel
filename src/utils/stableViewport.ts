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

export function initializeStableViewport() {
  if (!browserController) {
    browserController = createStableViewportController({
      readWidth: () => window.innerWidth,
      readHeight: () => window.innerHeight,
      publishHeight: (height) => {
        document.documentElement.style.setProperty('--stable-vh', `${height}px`);
      },
      addListener: (event, listener) => window.addEventListener(event, listener, {passive: true}),
      removeListener: (event, listener) => window.removeEventListener(event, listener),
    });
    browserController.start();
  }

  return browserController;
}

export function getStableViewportHeight() {
  return initializeStableViewport().getHeight();
}
