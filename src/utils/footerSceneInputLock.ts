import type {FooterSceneLock} from './footerSceneController';

type SavedProperty = {name: string; value: string; priority: string};

function captureStyle(style: CSSStyleDeclaration, names: string[]): SavedProperty[] {
  return names.map(name => ({name, value: style.getPropertyValue(name), priority: style.getPropertyPriority(name)}));
}

function restoreStyle(style: CSSStyleDeclaration, properties: SavedProperty[]) {
  for (const {name, value, priority} of properties) {
    if (value) style.setProperty(name, value, priority);
    else style.removeProperty(name);
  }
}

/** Native guard only. The scene's smooth-scroll owner observes the state events. */
export function acquireFooterSceneInputLock(doc: Document = document, win: Window = window, reconcile?: (signal: AbortSignal) => Promise<void>): FooterSceneLock {
  const html = doc.documentElement;
  const body = doc.body;
  const root = doc.getElementById('root');
  const x = win.scrollX;
  const y = win.scrollY;
  const width = body.getBoundingClientRect().width;
  const priorActive = html.dataset.footerSceneActive;
  const priorRestoring = html.dataset.footerSceneRestoring;
  const priorInert = root?.inert;
  const previousFocus = doc.activeElement;
  const positioning = captureStyle(body.style, ['position', 'top', 'left', 'width', 'box-sizing']);
  const bodyOverflow = captureStyle(body.style, ['overflow-x', 'overflow-y']);
  const htmlOverflow = captureStyle(html.style, ['overflow-x', 'overflow-y', 'scroll-behavior']);
  let returnedToTop = false;
  let returning = false;
  let restoration: Promise<void> | undefined;
  let restorationSignal: AbortSignal | undefined;
  let abortRestoration: (() => void) | undefined;
  let released = false;
  const announce = (detail: {active: boolean; resetToTop?: boolean; scrollY?: number}) => {
    doc.dispatchEvent(new CustomEvent('footer-scene-scroll-state', {detail}));
  };
  html.dataset.footerSceneActive = 'true';
  announce({active: true});
  if (root) root.inert = true;
  for (const style of [html.style, body.style]) {
    style.setProperty('overflow-x', 'hidden', 'important');
    style.setProperty('overflow-y', 'hidden', 'important');
  }
  for (const [name, value] of [['position', 'fixed'], ['top', `${-y}px`], ['left', `${-x}px`], ['width', `${width}px`], ['box-sizing', 'border-box']]) {
    body.style.setProperty(name, value, 'important');
  }
  const guardedEvents = ['wheel', 'touchmove', 'keydown', 'click', 'auxclick'];
  const scrollingKeys = new Set([' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']);
  const guard = (event: Event) => {
    const input = event as KeyboardEvent & TouchEvent;
    // Browser commands, trackpad zoom and multi-touch zoom are not scene inputs.
    if (input.ctrlKey || input.metaKey || input.altKey) return;
    if (event.type === 'touchmove' && input.touches.length > 1) return;
    if (event.type === 'keydown' && !scrollingKeys.has(input.key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const capture = {capture: true, passive: false};
  for (const type of guardedEvents) doc.addEventListener(type, guard, capture);
  let leavingPage = false;
  const canFocus = (element: Element | null): element is HTMLElement => Boolean(
    element?.isConnected && element !== body && element !== html &&
    'focus' in element && typeof element.focus === 'function' &&
    !('disabled' in element && element.disabled) && !element.closest('[inert], [hidden]')
  );
  const onPageHide = () => {leavingPage = true;lock.release();};
  const holdTop = () => {
    if (returning && !released && (win.scrollY !== 0 || win.scrollX !== 0)) win.scrollTo({top: 0, left: 0, behavior: 'instant'});
  };
  const lock: FooterSceneLock = {
    returnToTop(signal) {
      if (released || signal?.aborted) return;
      if (returning && !restorationSignal?.aborted) return restoration;
      if (!returning) {
        returning = true;
        restoreStyle(body.style, positioning);
        restoreStyle(body.style, bodyOverflow);
        restoreStyle(html.style, htmlOverflow);
        html.dataset.footerSceneRestoring = 'true';
        html.style.setProperty('scroll-behavior', 'auto', 'important');
        win.scrollTo({top: 0, left: 0, behavior: 'instant'});
        win.addEventListener('scroll', holdTop);
        announce({active: true, resetToTop: true});
      }
      if (released || signal?.aborted) return;
      if (reconcile) {
        abortRestoration?.();
        restorationSignal = signal;
        const request = new AbortController();
        const abort = () => request.abort();
        abortRestoration = () => {signal?.removeEventListener('abort', abort);abort();};
        signal?.addEventListener('abort', abort, {once: true});
        restoration = reconcile(request.signal).then(() => {
          if (!released && !request.signal.aborted) returnedToTop = true;
        }).finally(() => signal?.removeEventListener('abort', abort));
        return restoration;
      }
      returnedToTop = true;
    },
    release() {
      if (released) return;
      released = true;
      abortRestoration?.();
      win.removeEventListener('pagehide', onPageHide);
      win.removeEventListener('scroll', holdTop);
      for (const type of guardedEvents) doc.removeEventListener(type, guard, capture);
      if (!returnedToTop) {
        restoreStyle(body.style, positioning);
        html.style.setProperty('scroll-behavior', 'auto', 'important');
        win.scrollTo({top: y, left: x, behavior: 'instant'});
        if (returning) announce({active: true, scrollY: y});
      }
      restoreStyle(body.style, bodyOverflow);
      restoreStyle(html.style, htmlOverflow);
      if (root) root.inert = priorInert!;
      if (priorActive === undefined) delete html.dataset.footerSceneActive;
      else html.dataset.footerSceneActive = priorActive;
      if (priorRestoring === undefined) delete html.dataset.footerSceneRestoring;
      else html.dataset.footerSceneRestoring = priorRestoring;
      announce({active: false});
      if (leavingPage || doc.visibilityState === 'hidden') return;
      if (returnedToTop) {
        const home = doc.getElementById('home');
        if (canFocus(home)) {
          const tabindex = home.getAttribute('tabindex');
          home.setAttribute('tabindex', '-1');
          try {home.focus({preventScroll: true});}
          finally {
            if (tabindex === null) home.removeAttribute('tabindex');
            else home.setAttribute('tabindex', tabindex);
          }
        }
      } else if (canFocus(previousFocus)) previousFocus.focus({preventScroll: true});
    },
  };
  win.addEventListener('pagehide', onPageHide);
  return lock;
}
