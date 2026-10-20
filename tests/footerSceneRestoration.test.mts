import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness, elements} from './helpers/technologyHarness.cjs';

// Geometry is an explicit fixed-body stimulus, not measured browser layout.
class Style {
  values = new Map<string, string>();
  getPropertyValue(name: string) {return this.values.get(name) ?? '';}
  getPropertyPriority() {return '';}
  setProperty(name: string, value: string) {this.values.set(name, value);}
  removeProperty(name: string) {this.values.delete(name);}
}
function environment() {
  let id = 0;
  const frames = new Map<number, () => void>(), intervals = new Map<number, {fn: () => void; delay: number}>(), tickers = new Set<() => void>();
  const win: any = Object.assign(new EventTarget(), {
    scrollX: 0, scrollY: 16000, innerWidth: 1440, innerHeight: 1000, location: {pathname: '/'},
    matchMedia: () => Object.assign(new EventTarget(), {matches: false}),
    requestAnimationFrame(fn: () => void) {frames.set(++id, fn);return id;},
    cancelAnimationFrame(key: number) {frames.delete(key);},
    setInterval(fn: () => void, delay: number) {intervals.set(++id, {fn, delay});return id;},
    clearInterval(key: number) {intervals.delete(key);},
    scrollTo({top, left}: any) {win.scrollY = top;win.scrollX = left;win.dispatchEvent(new Event('scroll'));},
  });
  const root = {inert: false};
  const doc: any = Object.assign(new EventTarget(), {
    hidden: false, visibilityState: 'visible', documentElement: {style: new Style(), dataset: {}},
    body: {style: new Style(), getBoundingClientRect: () => ({width: 1440})},
    getElementById: (id: string) => id === 'root' ? root : null, querySelectorAll: () => [],
  });
  const globals = {window: win, document: doc, Event, CustomEvent, AbortController, Image: class {}};
  return {win, doc, root, frames, intervals, tickers, globals,
    frame() {const batch = [...frames.values()];frames.clear();batch.forEach(fn => fn());},
    tick() {tickers.forEach(fn => fn());},
  };
}
const source = (name: string) => fileURLToPath(new URL(`../src/${name}`, import.meta.url));

test('App ignores fixed-body scroll and cannot restart phrase clocks during footer ownership', () => {
  const e = environment();
  function HeroIntro() {} function TechnologyAndAboutStage() {} function FakeFooterStage() {}
  const h = createHarness({
    gsap: {gsap: {ticker: {add: (fn: () => void) => e.tickers.add(fn), remove: (fn: () => void) => e.tickers.delete(fn)}}},
    './components/sections/LoadingScreen': {LoadingScreen() {}},
    './components/sections/HeroIntro': {HeroIntro},
    './components/sections/TechnologyAndAboutStage': {TechnologyAndAboutStage},
    './components/sections/FakeFooterStage': {FakeFooterStage},
    './components/sections/FinalFooterStage': {FinalFooterStage() {}},
    './components/effects/CodeBurstLayer': {CodeBurstLayer() {}},
    './components/legal/LegalPage': {LegalPage() {}},
    './i18n/useTranslation': {useTranslation: () => ({locale: 'pt', setLocale() {}})},
    './hooks/useSmoothScroll': {useSmoothScroll() {}},
  }, e.globals);
  const App = h.load(source('App.tsx')).default;
  let tree: any;
  const render = () => {tree = h.render(App, {});};
  render();
  for (const node of elements(tree, (n: any) => ['technology-flow', 'fake-footer-flow'].includes(n.props?.className))) {
    node.props.ref.current = {getBoundingClientRect: () => ({top: e.doc.body.style.getPropertyValue('position') === 'fixed' ? -11500 : 4500 - e.win.scrollY})};
  }
  h.flush();render();h.flush();
  const lock = h.load(source('utils/footerSceneInputLock.ts')).acquireFooterSceneInputLock(e.doc, e.win);
  e.win.scrollY = 0;e.win.dispatchEvent(new Event('scroll'));e.tick();render();h.flush();
  try {
    assert.equal(elements(tree, (n: any) => n.type === HeroIntro)[0].props.heroProgress, 1);
    assert.ok(![...e.intervals.values()].some(t => t.delay === 4200));
  } finally {lock.release();h.dispose();}
});

test('scene refresh defers fixed-body requests and drains the dirty batch after release', () => {
  const e = environment(), measured: string[] = [];
  const h = createHarness({'gsap/ScrollTrigger': {ScrollTrigger: {sort() {}, refresh() {measured.push(e.doc.body.style.getPropertyValue('position'));}}}}, e.globals);
  const refresh = h.load(source('utils/sceneRefresh.ts'));
  const lock = h.load(source('utils/footerSceneInputLock.ts')).acquireFooterSceneInputLock(e.doc, e.win);
  refresh.requestSceneRefresh();e.frame();
  try {assert.deepEqual(measured, [], 'fixed-body geometry must never reach the pin refresh');}
  finally {lock.release();}
  e.frame();assert.deepEqual(measured, ['']);
});

test('return restores final overflow before reconciliation without releasing native guards', () => {
  const e = environment();
  e.doc.body.style.setProperty('overflow-y', 'scroll');
  const h = createHarness({}, e.globals);
  const lock = h.load(source('utils/footerSceneInputLock.ts')).acquireFooterSceneInputLock(e.doc, e.win);
  lock.returnToTop();
  try {
    assert.equal(e.doc.body.style.getPropertyValue('overflow-y'), 'scroll', 'measure only the final scrollbar geometry');
    assert.equal(e.root.inert, true);
    const wheel = new Event('wheel', {cancelable: true});e.doc.dispatchEvent(wheel);assert.equal(wheel.defaultPrevented, true);
    assert.equal(e.doc.documentElement.dataset.footerSceneActive, 'true');
  } finally {lock.release();}
});

test('restoration suspends frame work while hidden and abort removes visibility and frame subscriptions', async () => {
  const e = environment();
  e.doc.hidden = true;
  const listeners = new Set<any>();
  const add = e.doc.addEventListener.bind(e.doc), remove = e.doc.removeEventListener.bind(e.doc);
  e.doc.addEventListener = (type: string, fn: any, options: any) => {if (type === 'visibilitychange') listeners.add(fn);add(type, fn, options);};
  e.doc.removeEventListener = (type: string, fn: any, options: any) => {if (type === 'visibilitychange') listeners.delete(fn);remove(type, fn, options);};
  const h = createHarness({gsap: {gsap: {getTweensOf: () => []}}}, e.globals);
  const request = new AbortController();let reconciles = 0;
  const pending = h.load(source('utils/footerSceneRestoration.ts')).restoreFooterScene(request.signal, () => {reconciles++;});
  assert.equal(e.frames.size, 0);assert.equal(listeners.size, 1);
  request.abort();await assert.rejects(pending, {name: 'AbortError'});
  assert.equal(listeners.size, 0);assert.equal(e.frames.size, 0);
  e.doc.hidden = false;e.doc.dispatchEvent(new Event('visibilitychange'));e.frame();
  assert.equal(reconciles, 0);
});

test('hidden between restoration frames cannot acknowledge ready until a visible reconciliation', async () => {
  const e = environment();
  const h = createHarness({gsap: {gsap: {getTweensOf: () => []}}}, e.globals);
  const request = new AbortController();let ready = false, reconciles = 0;
  const pending = h.load(source('utils/footerSceneRestoration.ts')).restoreFooterScene(request.signal, () => {reconciles++;}).then(() => {ready = true;});
  e.frame();await Promise.resolve();assert.equal(reconciles, 1);
  e.doc.hidden = true;e.doc.dispatchEvent(new Event('visibilitychange'));e.frame();await Promise.resolve();
  assert.equal(ready, false);assert.equal(reconciles, 1);
  e.doc.hidden = false;e.doc.dispatchEvent(new Event('visibilitychange'));
  e.frame();await pending;assert.equal(reconciles, 2);assert.equal(e.frames.size, 0);
});

function controllerFixture() {
  const e = environment(), h = createHarness({}, e.globals);
  let now = 0, id = 0, released = 0, signal: AbortSignal;
  const tasks = new Map<number, {at: number; fn: () => void}>();
  let resolve!: () => void, reject!: (error: Error) => void;
  const completion = new Promise<void>((yes, no) => {resolve = yes;reject = no;});
  const video: any = Object.assign(new EventTarget(), {pause() {}, play: () => Promise.resolve()});
  const controller = h.load(source('utils/footerSceneController.ts')).createFooterSceneController({
    video, counter: {read: () => 0},
    acquireLock: () => ({returnToTop(value: AbortSignal) {signal = value;return completion;}, release() {released++;}}),
    onState() {}, clock: {now: () => now, set(fn: () => void, delay: number) {tasks.set(++id, {at: now + delay, fn});return id;}, clear(key: number) {tasks.delete(key);}},
  });
  const advance = (ms: number) => {
    const end = now + ms;
    for (let loops = 0; loops < 100; loops++) {
      const next = [...tasks].sort((a, b) => a[1].at - b[1].at).find(([, task]) => task.at <= end);
      if (!next) break;
      now = next[1].at;tasks.delete(next[0]);next[1].fn();
    }
    now = end;
  };
  controller.checkViewport({top: 0, bottom: 1000}, 1000);video.dispatchEvent(new Event('ended'));advance(180);
  return {controller, tasks, advance, resolve, reject, get released() {return released;}, get signal() {return signal;}};
}

test('controller keeps black and ownership until restoration resolves, including hidden completion', async () => {
  const h = controllerFixture();
  try {
    assert.equal(h.controller.getState(), 'blackout', 'returnToTop starting is not restoration completion');
    h.advance(800);assert.equal(h.released, 0);
    h.controller.setVisible(false);h.resolve();await Promise.resolve();h.advance(10000);
    assert.equal(h.controller.getState(), 'blackout');assert.equal(h.released, 0);
    h.controller.setVisible(true);h.advance(0);
    assert.equal(h.controller.getState(), 'revealing');assert.equal(h.released, 0);
    h.advance(240);assert.equal(h.released, 1);
  } finally {h.controller.dispose();}
});

test('cancel invalidates pending restoration and a stale completion cannot reveal a later owner', async () => {
  const h = controllerFixture();
  h.controller.cancel();
  assert.equal(h.signal?.aborted, true);
  h.controller.checkViewport({top: 500, bottom: 1500}, 1000);
  h.controller.checkViewport({top: 0, bottom: 1000}, 1000);
  h.resolve();await Promise.resolve();h.advance(300);
  assert.equal(h.controller.getState(), 'loading');assert.equal(h.released, 1);
  h.controller.dispose();assert.equal(h.tasks.size, 0);
});

test('failed or missing restoration completion has bounded cleanup, never a successful reveal', async () => {
  for (const failure of ['reject', 'deadline']) {
    const h = controllerFixture();
    if (failure === 'reject') {h.reject(new Error('layout failed'));await Promise.resolve();}
    h.advance(5000);
    assert.equal(h.released, 1);assert.equal(h.controller.getState(), 'idle');
    assert.equal(h.signal?.aborted, true);assert.equal(h.tasks.size, 0);
    h.resolve();await Promise.resolve();assert.equal(h.controller.getState(), 'idle');
    h.controller.dispose();
  }
});

test('native lock awaits App reconciliation and cancellation before its ack restores captured position', async () => {
  const e = environment(), h = createHarness({}, e.globals);
  let resolve!: () => void, calls = 0, callbackSignal: AbortSignal;
  const lock = h.load(source('utils/footerSceneInputLock.ts')).acquireFooterSceneInputLock(e.doc, e.win, (signal: AbortSignal) => {
    callbackSignal = signal;
    calls++;
    assert.equal(e.doc.body.style.getPropertyValue('position'), '');
    assert.equal(e.doc.body.style.getPropertyValue('overflow-y'), '');
    assert.equal(e.root.inert, true);
    return new Promise<void>(yes => {resolve = yes;});
  });
  const request = new AbortController();
  const pending = lock.returnToTop(request.signal);
  try {
    assert.equal(calls, 1, 'restoration must actually consume the App callback');
    assert.equal(typeof pending?.then, 'function');
    lock.release();
    assert.equal(callbackSignal!.aborted, true, 'native release must also cancel work when its caller did not abort');
    assert.equal(e.win.scrollY, 16000, 'unfinished restoration is cancellation, not completed top navigation');
    resolve();await pending;
    assert.equal(e.win.scrollY, 16000, 'late completion cannot reapply the top');
  } finally {lock.release();}
});

test('synchronous cancellation during the native top announcement cannot start stale App work', () => {
  const e = environment(), h = createHarness({}, e.globals);
  let calls = 0;
  const lock = h.load(source('utils/footerSceneInputLock.ts')).acquireFooterSceneInputLock(e.doc, e.win, () => {calls++;return Promise.resolve();});
  e.doc.addEventListener('footer-scene-scroll-state', (event: any) => {if (event.detail.resetToTop) lock.release();});
  lock.returnToTop(new AbortController().signal);
  assert.equal(calls, 0);assert.equal(e.win.scrollY, 16000);assert.equal(e.root.inert, false);
});

test('App supplies a restoration barrier that republishes pin progress and resets local clocks before ready', async () => {
  const e = environment();
  function HeroIntro() {} function TechnologyAndAboutStage() {} function FakeFooterStage() {} function FinalFooterStage() {}
  let tree: any, h: any, refreshes = 0;
  const render = () => {tree = h.render(App, {});h.flush();};
  h = createHarness({
    gsap: {gsap: {getTweensOf: () => [], ticker: {add: (fn: () => void) => e.tickers.add(fn), remove: (fn: () => void) => e.tickers.delete(fn)}}},
    'react-dom': {flushSync(fn: () => void) {fn();render();}},
    'gsap/ScrollTrigger': {ScrollTrigger: {sort() {}, update() {}, getAll: () => [], refresh() {
      refreshes++;
      assert.equal(e.doc.body.style.getPropertyValue('position'), '');
      assert.equal(e.doc.body.style.getPropertyValue('overflow-y'), 'scroll');
      elements(tree, (n: any) => n.type === TechnologyAndAboutStage)[0].props.onProgress(0);
      elements(tree, (n: any) => n.type === FakeFooterStage)[0].props.onProgress(0);
    }}},
    './components/sections/LoadingScreen': {LoadingScreen() {}},
    './components/sections/HeroIntro': {HeroIntro}, './components/sections/TechnologyAndAboutStage': {TechnologyAndAboutStage},
    './components/sections/FakeFooterStage': {FakeFooterStage}, './components/sections/FinalFooterStage': {FinalFooterStage},
    './components/effects/CodeBurstLayer': {CodeBurstLayer() {}}, './components/legal/LegalPage': {LegalPage() {}},
    './i18n/useTranslation': {useTranslation: () => ({locale: 'pt', setLocale() {}})}, './hooks/useSmoothScroll': {useSmoothScroll() {}},
  }, e.globals);
  const App = h.load(source('App.tsx')).default;
  tree = h.render(App, {});
  for (const node of elements(tree, (n: any) => ['technology-flow', 'fake-footer-flow'].includes(n.props?.className))) {
    node.props.ref.current = {getBoundingClientRect: () => ({top: 4500 - e.win.scrollY})};
  }
  h.flush();render();
  elements(tree, (n: any) => n.type === TechnologyAndAboutStage)[0].props.onProgress(1);
  elements(tree, (n: any) => n.type === FakeFooterStage)[0].props.onProgress(1);render();
  const restore = elements(tree, (n: any) => n.type === FinalFooterStage)[0].props.onRestore;
  assert.equal(typeof restore, 'function', 'the actual App must own and wire the restoration callback');
  e.doc.body.style.setProperty('overflow-y', 'scroll');
  const lock = h.load(source('utils/footerSceneInputLock.ts')).acquireFooterSceneInputLock(e.doc, e.win, restore);
  const request = new AbortController();let ready = false;
  const pending = lock.returnToTop(request.signal).then(() => {ready = true;});
  assert.equal(ready, false);
  for (let i = 0; i < 8; i++) {e.frame();await Promise.resolve();}
  await pending;
  assert.ok(refreshes >= 1);
  const hero = elements(tree, (n: any) => n.type === HeroIntro)[0].props;
  const stage = elements(tree, (n: any) => n.type === TechnologyAndAboutStage)[0].props;
  const footer = elements(tree, (n: any) => n.type === FakeFooterStage)[0].props;
  assert.equal(hero.heroProgress, 0);assert.equal(stage.rawStageProgress, 0);
  assert.equal(stage.stageStyle['--hero-handoff'], '0');assert.equal(footer.footerProgress, 0);
  assert.equal(footer.stageStyle['--fake-footer-reverse'], '0');assert.equal(e.root.inert, true);
  lock.release();render();e.win.scrollY = 1;e.win.dispatchEvent(new Event('scroll'));e.tick();render();
  assert.equal(elements(tree, (n: any) => n.type === FakeFooterStage)[0].props.stageStyle['--fake-footer-reverse'], '0');
  h.dispose();
});
