import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness} from './helpers/technologyHarness.cjs';

class Style {
  values = new Map<string, {value: string; priority: string}>();
  getPropertyValue(name: string) {return this.values.get(name)?.value ?? '';}
  getPropertyPriority(name: string) {return this.values.get(name)?.priority ?? '';}
  setProperty(name: string, value: string, priority = '') {
    if (!value) this.values.delete(name);
    else this.values.set(name, {value, priority});
  }
  removeProperty(name: string) {const value = this.getPropertyValue(name);this.values.delete(name);return value;}
  snapshot() {return [...this.values].sort(([a], [b]) => a.localeCompare(b));}
}
class Target extends EventTarget {
  listeners: {type: string; listener: any; capture: boolean; passive: boolean | undefined}[] = [];
  addEventListener(type: string, listener: any, options: any = false) {
    super.addEventListener(type, listener, options);
    this.listeners.push({type, listener, capture: typeof options === 'boolean' ? options : !!options.capture, passive: options.passive});
  }
  removeEventListener(type: string, listener: any, options: any = false) {
    const capture = typeof options === 'boolean' ? options : !!options.capture;
    // Node's EventTarget needs the options object for capture removal.
    super.removeEventListener(type, listener, {capture});
    this.listeners = this.listeners.filter(item => !(item.type === type && item.listener === listener && item.capture === capture));
  }
}
function setup({rootInert = false, dataset, width = 980}: {rootInert?: boolean; dataset?: string; width?: number} = {}) {
  const focusCalls: {id: string; options: any; inert: boolean; tabindex: string | null}[] = [];
  const nodes = new Map<string, any>();
  const doc: any = new Target();
  const element = (id: string) => {
    const attributes = new Map<string, string>();
    const node: any = {id, style: new Style(), dataset: {}, inert: false, isConnected: true, disabled: false, hidden: false,
      getBoundingClientRect: () => ({width}),
      getAttribute: (name: string) => attributes.get(name) ?? null,
      hasAttribute: (name: string) => attributes.has(name),
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      removeAttribute: (name: string) => attributes.delete(name),
      closest: () => node.inert || node.hidden || (node !== nodes.get('root') && nodes.get('root')?.inert) ? node : null,
      focus(options: any) {focusCalls.push({id, options, inert: nodes.get('root').inert, tabindex: node.getAttribute('tabindex')});doc.activeElement = node;},
    };
    nodes.set(id, node);return node;
  };
  doc.documentElement = element('html');doc.documentElement.clientWidth = width;
  doc.body = element('body');doc.body.clientWidth = width;
  const root = element('root');root.inert = rootInert;
  const home = element('home');const previousFocus = element('previous-focus');
  doc.activeElement = previousFocus;doc.visibilityState = 'visible';
  doc.getElementById = (id: string) => nodes.get(id) ?? null;
  if (dataset !== undefined) doc.documentElement.dataset.footerSceneActive = dataset;
  const win: any = new Target();win.scrollX = 23;win.scrollY = 4567;win.innerWidth = width + 20;
  const scrollCalls: any[] = [];
  win.scrollTo = (options: any) => {scrollCalls.push({...options});win.scrollX = options.left;win.scrollY = options.top;};
  win.CustomEvent = CustomEvent;doc.defaultView = win;
  const states: any[] = [];
  doc.addEventListener('footer-scene-scroll-state', (event: any) => states.push({detail: {...event.detail}, position: doc.body.style.getPropertyValue('position'), inert: root.inert}));
  const host = createHarness({}, {CustomEvent, document: doc, window: win});
  const acquire = (defaults = false) => {
    let module: any;
    try {module = host.load(fileURLToPath(new URL('../src/utils/footerSceneInputLock.ts', import.meta.url)));}
    catch (error) {assert.fail(`native footer input lock must exist: ${error}`);}
    assert.equal(typeof module.acquireFooterSceneInputLock, 'function');
    return defaults ? module.acquireFooterSceneInputLock() : module.acquireFooterSceneInputLock(doc, win);
  };
  const dispatch = (type: string, properties: Record<string, any> = {}) => {
    const event = new Event(type, {cancelable: true});
    Object.assign(event, properties);doc.dispatchEvent(event);return event;
  };
  return {doc, win, root, home, previousFocus, focusCalls, states, scrollCalls, acquire, dispatch};
}

test('acquisition announces the lock before fixed-body positioning and freezes the captured geometry', () => {
  const h = setup();
  const lock = h.acquire();
  assert.equal(h.doc.documentElement.dataset.footerSceneActive, 'true');
  assert.deepEqual(h.states.map(state => state.detail), [{active: true}]);
  assert.equal(h.states[0].position, '', 'Lenis must stop before the body moves');
  assert.equal(h.root.inert, true);
  assert.equal(h.doc.body.style.getPropertyValue('position'), 'fixed');
  assert.equal(h.doc.body.style.getPropertyValue('top'), '-4567px');
  assert.equal(h.doc.body.style.getPropertyValue('left'), '-23px');
  assert.equal(h.doc.body.style.getPropertyValue('width'), '980px');
  assert.equal(h.doc.body.style.getPropertyValue('box-sizing'), 'border-box');
  for (const node of [h.doc.body, h.doc.documentElement]) {
    for (const axis of ['overflow-x', 'overflow-y']) {
      assert.equal(node.style.getPropertyValue(axis), 'hidden');
      assert.equal(node.style.getPropertyPriority(axis), 'important');
    }
  }
  lock.release();
});

test('returnToTop unfixes the body before instant scroll and keeps the guard through the Lenis reset', () => {
  const h = setup();
  h.doc.body.style.setProperty('position', 'relative', 'important');
  h.doc.body.style.setProperty('width', '75%');
  h.doc.documentElement.style.setProperty('scroll-behavior', 'smooth', 'important');
  const lock = h.acquire();
  h.doc.addEventListener('footer-scene-scroll-state', (event: any) => {
    if (!event.detail.resetToTop) return;
    assert.equal(h.win.scrollY, 0);
    assert.equal(h.doc.body.style.getPropertyValue('position'), 'relative');
    assert.equal(h.doc.body.style.getPropertyPriority('position'), 'important');
    assert.equal(h.doc.body.style.getPropertyValue('width'), '75%');
    assert.equal(h.doc.body.style.getPropertyValue('top'), '');
    assert.equal(h.doc.documentElement.style.getPropertyValue('scroll-behavior'), 'auto');
    assert.equal(h.root.inert, true);
    assert.equal(h.dispatch('wheel').defaultPrevented, true);
  });
  lock.returnToTop();
  assert.deepEqual(h.scrollCalls, [{top: 0, left: 0, behavior: 'instant'}]);
  assert.deepEqual(h.states.map(state => state.detail), [{active: true}, {active: true, resetToTop: true}]);
  assert.equal(h.doc.documentElement.dataset.footerSceneActive, 'true');
  assert.equal(h.root.inert, true);
  assert.equal(h.focusCalls.length, 0, 'focus waits until release');
  for (const node of [h.doc.body, h.doc.documentElement]) assert.equal(node.style.getPropertyValue('overflow-y'), '', 'overflow is final before any measurements; guards remain installed');
  for (const type of ['wheel', 'touchmove', 'click', 'auxclick']) assert.equal(h.dispatch(type, {touches: [{}]}).defaultPrevented, true);
  lock.returnToTop();
  assert.equal(h.scrollCalls.length, 1, 'repeated top handoff is inert');
  assert.equal(h.states.length, 2);
  lock.release();
});

test('cancellation restores captured scroll and only owned styles, flags and listeners once', () => {
  const h = setup({rootInert: true, dataset: 'preexisting-owner'});
  for (const node of [h.doc.body, h.doc.documentElement]) {
    node.style.setProperty('overflow-x', 'clip', 'important');
    node.style.setProperty('overflow-y', 'scroll');
    node.style.setProperty('color', 'red');
  }
  for (const [name, value] of [['position', 'absolute'], ['top', '2vh'], ['left', '3%'], ['width', '80%'], ['box-sizing', 'content-box']]) {
    h.doc.body.style.setProperty(name, value, 'important');
  }
  h.doc.documentElement.style.setProperty('scroll-behavior', 'smooth', 'important');
  h.doc.documentElement.dataset.unrelated = 'keep';
  const bodyBefore = h.doc.body.style.snapshot();const htmlBefore = h.doc.documentElement.style.snapshot();
  const listenersBefore = [...h.doc.listeners];const windowListenersBefore = [...h.win.listeners];
  const lock = h.acquire();
  h.doc.body.style.setProperty('background', 'blue');
  h.win.scrollX = 0;h.win.scrollY = 0;
  const scrollTo = h.win.scrollTo;
  h.win.scrollTo = (options: any) => {
    assert.equal(h.doc.body.style.getPropertyValue('position'), 'absolute');
    assert.equal(h.doc.documentElement.style.getPropertyValue('scroll-behavior'), 'auto');
    scrollTo(options);
  };
  lock.release();
  assert.deepEqual(h.scrollCalls, [{top: 4567, left: 23, behavior: 'instant'}]);
  assert.deepEqual(h.doc.body.style.snapshot(), [...bodyBefore, ['background', {value: 'blue', priority: ''}]].sort(([a], [b]) => String(a).localeCompare(String(b))));
  assert.deepEqual(h.doc.documentElement.style.snapshot(), htmlBefore);
  assert.equal(h.root.inert, true);
  assert.deepEqual(h.doc.documentElement.dataset, {footerSceneActive: 'preexisting-owner', unrelated: 'keep'});
  assert.deepEqual(h.doc.listeners, listenersBefore);
  assert.deepEqual(h.win.listeners, windowListenersBefore);
  assert.deepEqual(h.states.map(state => state.detail), [{active: true}, {active: false}]);
  const scrollCount = h.scrollCalls.length;const focusCount = h.focusCalls.length;
  lock.release();lock.returnToTop();h.win.dispatchEvent(new Event('pagehide'));
  assert.equal(h.scrollCalls.length, scrollCount, 'released handles must never scroll again');
  assert.equal(h.focusCalls.length, focusCount);
  assert.equal(h.states.length, 2);
  assert.equal(h.dispatch('wheel').defaultPrevented, false, 'input guards were really removed');
});

test('pagehide releases native ownership and keeps the correct cancellation or completion scroll position', () => {
  for (const completed of [false, true]) {
    const h = setup();const baselineDoc = [...h.doc.listeners];const baselineWin = [...h.win.listeners];
    const lock = h.acquire();
    assert.ok(h.win.listeners.some((item: any) => item.type === 'pagehide'));
    if (completed) lock.returnToTop();
    h.win.dispatchEvent(new Event('pagehide'));
    assert.equal(h.root.inert, false);
    assert.equal(h.doc.body.inert, false, 'the body portal must never be inert');
    assert.equal(h.doc.documentElement.inert, false);
    assert.equal(Object.hasOwn(h.doc.documentElement.dataset, 'footerSceneActive'), false);
    assert.equal(h.doc.body.style.getPropertyValue('position'), '');
    assert.equal(h.win.scrollY, completed ? 0 : 4567);
    assert.deepEqual(h.doc.listeners, baselineDoc);assert.deepEqual(h.win.listeners, baselineWin);
    const calls = h.scrollCalls.length;lock.release();lock.returnToTop();
    assert.equal(h.scrollCalls.length, calls);
    assert.deepEqual(h.states.at(-1).detail, {active: false});
  }
});

test('successful release focuses home only after removing inert and restores temporary tabindex', () => {
  for (const tabindex of [null, '0', '-1']) {
    const h = setup();
    if (tabindex !== null) h.home.setAttribute('tabindex', tabindex);
    const lock = h.acquire();lock.returnToTop();
    assert.equal(h.focusCalls.length, 0);
    lock.release();
    assert.equal(h.win.scrollY, 0);
    assert.equal(h.scrollCalls.length, 1, 'success must not scroll again during release');
    assert.equal(h.focusCalls.length, 1);
    assert.equal(h.focusCalls[0].id, 'home');
    assert.equal(h.focusCalls[0].inert, false);
    assert.equal(h.focusCalls[0].tabindex, '-1');
    assert.equal(h.focusCalls[0].options.preventScroll, true);
    assert.equal(h.home.getAttribute('tabindex'), tabindex);
    lock.release();lock.returnToTop();
    assert.equal(h.focusCalls.length, 1);
  }
});

test('cancellation restores the preexisting connected focus with preventScroll', () => {
  const h = setup();const lock = h.acquire();
  h.doc.activeElement = h.doc.body;
  lock.release();
  assert.equal(h.focusCalls.length, 1);
  assert.equal(h.focusCalls[0].id, 'previous-focus');
  assert.equal(h.focusCalls[0].inert, false);
  assert.equal(h.focusCalls[0].options.preventScroll, true);
  assert.equal(h.previousFocus.getAttribute('tabindex'), null);
});

test('cleanup never focuses disconnected, disabled, hidden or preexisting inert content or a leaving page', () => {
  for (const completed of [false, true]) {
    for (const condition of ['disconnected', 'disabled', 'hidden', 'inert', 'pagehide', 'hidden-document']) {
      const h = setup({rootInert: condition === 'inert'});
      const target = completed ? h.home : h.previousFocus;
      if (condition === 'disconnected') target.isConnected = false;
      if (condition === 'disabled') target.disabled = true;
      if (condition === 'hidden') target.hidden = true;
      const lock = h.acquire();
      if (completed) lock.returnToTop();
      if (condition === 'hidden-document') h.doc.visibilityState = 'hidden';
      if (condition === 'pagehide') h.win.dispatchEvent(new Event('pagehide'));
      else lock.release();
      assert.equal(h.focusCalls.length, 0, `${completed ? 'complete' : 'cancel'}: ${condition}`);
      assert.equal(target.getAttribute('tabindex'), null);
    }
  }
});

test('default host parameters work without root or home nodes', () => {
  const h = setup();h.doc.getElementById = () => null;
  const lock = h.acquire(true);
  assert.equal(h.root.inert, false);
  assert.equal(h.dispatch('click').defaultPrevented, true);
  lock.returnToTop();lock.release();
  assert.equal(h.focusCalls.length, 0);
  assert.equal(h.win.scrollY, 0);
  assert.equal(h.doc.body.style.values.size, 0);
  assert.equal(h.doc.documentElement.style.values.size, 0);
});

test('scroll capture precedes a smooth-scroll listener changing the live offset', () => {
  const h = setup();
  h.doc.addEventListener('footer-scene-scroll-state', (event: any) => {
    if (event.detail.active && !event.detail.resetToTop) {h.win.scrollX = 0;h.win.scrollY = 0;}
  });
  const lock = h.acquire();
  assert.equal(h.doc.body.style.getPropertyValue('top'), '-4567px');
  assert.equal(h.doc.body.style.getPropertyValue('left'), '-23px');
  lock.release();
  assert.equal(h.win.scrollY, 4567);assert.equal(h.win.scrollX, 23);
});

test('capture guards stop scroll and activation without taking browser shortcuts or pinch zoom', () => {
  const h = setup();const lock = h.acquire();
  const guarded = ['wheel', 'touchmove', 'keydown', 'click', 'auxclick'];
  for (const type of guarded) {
    const listener = h.doc.listeners.find((item: any) => item.type === type);
    assert.ok(listener, `${type} needs a guard`);
    assert.equal(listener.capture, true);
    assert.equal(listener.passive, false);
  }
  let reachedLaterHandler = 0;
  h.doc.addEventListener('click', () => reachedLaterHandler++);
  for (const type of ['wheel', 'touchmove', 'click', 'auxclick']) {
    assert.equal(h.dispatch(type, {touches: [{}]}).defaultPrevented, true, type);
  }
  assert.equal(reachedLaterHandler, 0, 'captured #home clicks cannot reach navigation handlers');
  for (const key of [' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End']) {
    assert.equal(h.dispatch('keydown', {key}).defaultPrevented, true, key);
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
      assert.equal(h.dispatch('keydown', {key, [modifier]: true}).defaultPrevented, false, `${modifier}+${key}`);
    }
  }
  for (const key of ['Escape', 'F5', 'Tab', 'a']) assert.equal(h.dispatch('keydown', {key}).defaultPrevented, false);
  assert.equal(h.doc.documentElement.dataset.footerSceneActive, 'true', 'Escape must never release the scene');
  assert.equal(h.dispatch('wheel', {ctrlKey: true}).defaultPrevented, false, 'trackpad/browser zoom survives');
  assert.equal(h.dispatch('touchmove', {touches: [{}, {}]}).defaultPrevented, false, 'pinch zoom survives');
  for (const modifier of ['ctrlKey', 'metaKey', 'altKey']) {
    assert.equal(h.dispatch('click', {[modifier]: true}).defaultPrevented, false, 'browser-modified clicks survive');
  }
  lock.release();
});
