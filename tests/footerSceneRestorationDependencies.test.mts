import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {gsap} from 'gsap';
import {createHarness} from './helpers/technologyHarness.cjs';

const stSource = readFileSync(new URL('../node_modules/gsap/ScrollTrigger.js', import.meta.url), 'utf8');
const root = (name: string) => fileURLToPath(new URL(`../src/${name}`, import.meta.url));
function installedMethod(name: string) {
  const start = stSource.indexOf(`self.${name} = function`);
  const end = stSource.indexOf('\n    };', start) + '\n    };'.length;
  assert.ok(start >= 0 && end > start);
  return stSource.slice(start, end);
}
function scrubFixture() {
  const target = {alpha: 0};
  const animation = gsap.timeline({paused: true}).to(target, {alpha: 1, duration: 1, ease: 'none'});
  animation.totalProgress(1);
  const context: any = {_isNumber: (v: unknown) => typeof v === 'number', gsap, animation, onScrubComplete: null, self: {}};
  vm.createContext(context);
  vm.runInContext(`let scrubSmooth,scrubTween,tweenTo;${installedMethod('scrubDuration')}${installedMethod('getTween')}`, context);
  context.self.scrubDuration(.72);
  const scrub = context.self.getTween();
  return {animation, scrub, target, getTween: context.self.getTween,
    update() {scrub.resetTo('totalProgress', 0, animation._tTime / animation._tDur);},
    dispose() {scrub.kill();animation.kill();gsap.ticker.sleep();},
  };
}

test('normal-flow flush repairs the installed GSAP parser coordinate and catches up only current owned scrub targets', () => {
  const parserStart = stSource.indexOf('_parsePosition = function _parsePosition(');
  const parserEnd = stSource.indexOf('\n},', parserStart) + 2;
  const parse = vm.runInNewContext('(' + stSource.slice(parserStart + '_parsePosition = '.length, parserEnd) + ')', {
    _isFunction: (v: unknown) => typeof v === 'function', _isString: (v: unknown) => typeof v === 'string', _isNumber: (v: unknown) => typeof v === 'number',
    _getTarget: (v: unknown) => v, _getBounds: (v: any) => v.getBoundingClientRect(), _getComputedStyle: () => ({display: 'block'}),
    _offsetToPx: (v: string) => {assert.equal(v, 'top');return 0;},
  });
  const parseStart = (top: number, scroll: number) => parse('top top', {getBoundingClientRect: () => ({top, left: 0, height: 1000, width: 1440})}, 1000, {p: 'top', d: 'height'}, scroll, null, null, {}, {top: 0}, 0, true, 20000);
  assert.equal(parseStart(-16000, 0), -16000);
  const own = scrubFixture(), unrelated = scrubFixture(), calls: string[] = [];
  const pin: any = {start: -16000, end: -13000, progress: 1, scroll: () => 0, trigger: {matches: () => true}, getTween: own.getTween};
  const external = {trigger: {matches: () => false}, getTween: unrelated.getTween};
  const h = createHarness({'gsap/ScrollTrigger': {ScrollTrigger: {
    sort() {calls.push('sort');},
    refresh() {calls.push('refresh');pin.start = parseStart(0, 0);pin.end = 3000;},
    update() {calls.push('update');pin.progress = 0;own.update();}, getAll: () => [pin, external],
  }}}, {window: {dispatchEvent() {calls.push('scroll');}}, document: {documentElement: {dataset: {footerSceneActive: 'true', footerSceneRestoring: 'true'}}}, Event});
  try {
    h.load(root('utils/sceneRefresh.ts')).flushSceneRefresh();
    assert.deepEqual(calls, ['sort', 'refresh', 'update', 'scroll']);assert.equal(pin.start, 0);
    assert.equal(own.animation.totalProgress(), 0);assert.equal(own.target.alpha, 0);
    assert.equal(unrelated.animation.totalProgress(), 1, 'unrelated timelines are never forced');
    assert.equal(parseStart(-16000, 16000), parseStart(0, 0), 'native scrolled and restored coordinates have the same baseline');
  } finally {own.dispose();unrelated.dispose();}
});

test('an inconsistent current pin target cannot be acknowledged as a restored scene', () => {
  let catches = 0;
  const h = createHarness({'gsap/ScrollTrigger': {ScrollTrigger: {
    sort() {}, refresh() {}, update() {}, getAll: () => [{trigger: {matches: () => true}, scroll: () => 0, start: 0, end: 3000, progress: 1, getTween: () => ({progress() {catches++;}})}],
  }}}, {window: {dispatchEvent() {}}, Event});
  assert.throws(() => h.load(root('utils/sceneRefresh.ts')).flushSceneRefresh(), /target/i);
  assert.equal(catches, 0, 'never complete a scrub whose target is stale');
});

test('GSAP pin anticipation epsilon at the correct top is accepted, not mistaken for a stale target', () => {
  const h = createHarness({'gsap/ScrollTrigger': {ScrollTrigger: {
    sort() {}, refresh() {}, update() {}, getAll: () => [{trigger: {matches: () => true}, scroll: () => 0, start: 0, end: 3000, progress: .0001, getTween: () => undefined}],
  }}}, {window: {dispatchEvent() {}}, Event});
  assert.doesNotThrow(() => h.load(root('utils/sceneRefresh.ts')).flushSceneRefresh());
});

test('an apparently correct pin cannot hide an installed scrub still targeting the old end', () => {
  const own = scrubFixture();
  const h = createHarness({'gsap/ScrollTrigger': {ScrollTrigger: {
    sort() {}, refresh() {}, update() {}, getAll: () => [{trigger: {matches: () => true}, scroll: () => 0, start: 0, end: 3000, progress: 0, animation: own.animation, getTween: own.getTween}],
  }}}, {window: {dispatchEvent() {}}, Event});
  try {assert.throws(() => h.load(root('utils/sceneRefresh.ts')).flushSceneRefresh(), /scrub/i);}
  finally {own.dispose();}
});

test('restoration waits through an actual Hero phrase timeline gap and drains its late rebuild', async () => {
  let id = 0, ready = false, flushes = 0;
  const frames = new Map<number, () => void>(), character = {alpha: 1};
  const document = Object.assign(new EventTarget(), {hidden: false, documentElement: {dataset: {footerSceneActive: 'true', footerSceneRestoring: 'true'}}});
  const window = {requestAnimationFrame(fn: () => void) {frames.set(++id, fn);return id;}, cancelAnimationFrame(key: number) {frames.delete(key);}, dispatchEvent() {}};
  const h = createHarness({gsap: {gsap: {globalTimeline: gsap.globalTimeline, getTweensOf: () => gsap.getTweensOf(character)}}, 'gsap/ScrollTrigger': {ScrollTrigger: {sort() {}, refresh() {flushes++;}, update() {}, getAll: () => []}}}, {window, document, Event});
  const scene = h.load(root('utils/sceneRefresh.ts'));
  const phrase = gsap.timeline({onComplete: () => scene.requestSceneRefresh()}).to(character, {alpha: 0, duration: .1}).add(() => {}, '+=.4');
  phrase.totalTime(.2);
  assert.equal(gsap.getTweensOf(character)[0].isActive(), false, 'the actual tween is idle during its parent phrase gap');
  assert.equal(phrase.isActive(), true);
  const request = new AbortController();
  const pending = h.load(root('utils/footerSceneRestoration.ts')).restoreFooterScene(request.signal, () => scene.flushSceneRefresh()).then(() => {ready = true;});
  const frame = async () => {const batch = [...frames.values()];frames.clear();batch.forEach(fn => fn());await Promise.resolve();await Promise.resolve();};
  try {
    await frame();await frame();await frame();
    assert.equal(ready, false, 'a phrase gap is still pending work, not restoration completion');
    phrase.totalProgress(1);
    for (let i = 0; i < 8 && !ready; i++) await frame();
    await pending;assert.equal(ready, true);assert.ok(flushes > 2);assert.equal(scene.hasPendingSceneRefresh(), false);
  } finally {request.abort();phrase.kill();gsap.ticker.sleep();}
});

test('the real Lenis resize/reset/scrollTo methods synchronize final dimensions even for the equal-zero early return', async () => {
  const {default: Lenis} = await import(new URL('../node_modules/lenis/dist/lenis.mjs', import.meta.url).href);
  const previousHTMLElement = (globalThis as any).HTMLElement;
  (globalThis as any).HTMLElement = class {};
  const document = Object.assign(new EventTarget(), {documentElement: {dataset: {}}, querySelectorAll: () => []});
  let nativeY = 16000, height = 20000, cachedHeight = 0, updates = 0, emissions = 0, stops = 0;
  const callbacks = new Set<() => void>();
  const fixture: any = {
    options: {infinite: false, autoToggle: false}, prefersReducedMotion: false, isStopped: false, isLocked: false, isScrolling: false,
    targetScroll: 18000, animatedScroll: 16000, lastVelocity: 100, velocity: 100, limit: 30000,
    get actualScroll() {return nativeY;}, get scroll() {return this.animatedScroll;},
    animate: {stop() {stops++;}}, dimensions: {resize() {cachedHeight = height;}},
    emitter: {emit() {emissions++;callbacks.forEach(fn => fn());}},
    on(_name: string, fn: () => void) {callbacks.add(fn);}, off(_name: string, fn: () => void) {callbacks.delete(fn);}, destroy() {},
    setScroll(value: number) {nativeY = value;}, preventNextNativeScrollEvent() {},
  };
  for (const method of ['resize', 'reset', 'stop', 'start', 'internalStop', 'internalStart', 'emit', 'scrollTo']) fixture[method] = Lenis.prototype[method];
  const h = createHarness({lenis: class {constructor() {return fixture;}}, gsap: {gsap: {registerPlugin() {}, ticker: {add() {}, remove() {}, lagSmoothing() {}}}}, 'gsap/ScrollTrigger': {ScrollTrigger: {update() {updates++;}}}}, {document, window: {matchMedia: () => ({matches: false})}});
  try {
    h.render(() => h.load(root('hooks/useSmoothScroll.ts')).useSmoothScroll(true));h.flush();
    const notify = (detail: object) => document.dispatchEvent(new CustomEvent('footer-scene-scroll-state', {detail}));
    notify({active: true});assert.equal(fixture.isStopped, true);assert.equal(stops, 1);
    assert.equal(fixture.targetScroll, 16000);assert.equal(fixture.velocity, 0);
    nativeY = 0;height = 1;fixture.emit();assert.equal(updates, 0, 'the installed emitter is blocked under fixed-body ownership');
    height = 24000;
    notify({active: true, resetToTop: true});
    assert.equal(cachedHeight, 24000);assert.equal(fixture.targetScroll, 0);assert.equal(fixture.animatedScroll, 0);
    const before = emissions;
    fixture.scrollTo(0, {immediate: true, force: true});assert.equal(emissions, before, 'installed Lenis really emits nothing at equal target');
    nativeY = 16000;notify({active: true, scrollY: 16000});
    assert.equal(fixture.targetScroll, 16000);assert.equal(fixture.animatedScroll, 16000);assert.equal(fixture.isStopped, true);
    notify({active: false});assert.equal(fixture.isStopped, false);assert.ok(updates >= 2);
  } finally {h.dispose();(globalThis as any).HTMLElement = previousHTMLElement;}
});
