import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness} from './helpers/technologyHarness.cjs';

function setup({stopped = false, initialFooter = false} = {}) {
  const document = Object.assign(new EventTarget(), {documentElement: {dataset: {footerSceneActive: initialFooter ? 'true' : undefined}},querySelectorAll: () => []});
  const ticker = new Set<() => void>();
  let instance: any;
  let updates = 0;
  class Lenis {
    isStopped = stopped;
    scroll = 120;
    targetScroll = 800;
    stops = 0;
    starts = 0;
    rafs = 0;
    resets: any[] = [];
    dimensions: number[] = [];
    resize() {this.dimensions.push(this.resets.length);}
    constructor() {instance = this;}
    listeners = new Set<() => void>();
    on(_event: string, fn: () => void) {this.listeners.add(fn);}
    off(_event: string, fn: () => void) {this.listeners.delete(fn);}
    emit() {this.listeners.forEach(fn => fn());}
    destroy() {}
    stop() {this.isStopped = true;this.targetScroll = this.scroll;this.stops++;}
    start() {this.isStopped = false;this.starts++;}
    raf() {this.rafs++;this.scroll += (this.targetScroll-this.scroll)*.1;}
    scrollTo(value: number, options: any) {this.resets.push({value,options});this.scroll = this.targetScroll = value;}
  }
  const host = createHarness({lenis: Lenis, gsap: {gsap: {registerPlugin() {},ticker: {add: (fn: () => void) => ticker.add(fn),remove: (fn: () => void) => ticker.delete(fn),lagSmoothing() {}}}},'gsap/ScrollTrigger': {ScrollTrigger: {update() {updates++;}}}}, {document,window: {matchMedia: () => ({matches: false})}});
  const {useSmoothScroll} = host.load(fileURLToPath(new URL('../src/hooks/useSmoothScroll.ts', import.meta.url)));
  host.render(() => useSmoothScroll(true));host.flush();
  return {get lenis() {return instance;},get updates() {return updates;},document,
    footer(active: boolean, resetToTop = false) {document.dispatchEvent(new CustomEvent('footer-scene-scroll-state', {detail: {active,resetToTop}}));},
    modal(dialog: object, open: boolean) {document.dispatchEvent(new CustomEvent('technology-modal-state', {detail: {dialog,open}}));},
    tick() {ticker.forEach(callback => callback());},dispose() {host.dispose();},
  };
}

test('the footer owns Lenis inertia through blackout, resetting its target before releasing', () => {
  const h = setup();
  try {
    h.footer(true);
    assert.equal(h.lenis.isStopped, true, 'native overflow alone cannot stop pending Lenis inertia');
    assert.equal(h.lenis.scroll, h.lenis.targetScroll);
    const before = h.lenis.rafs;h.tick();
    assert.equal(h.lenis.rafs, before);
    h.footer(true, true);
    assert.deepEqual(h.lenis.resets.map((item: any) => ({value:item.value,immediate:item.options.immediate,force:item.options.force})), [{value:0,immediate:true,force:true}]);
    assert.equal(h.lenis.isStopped, true);
    h.footer(false);h.tick();
    assert.equal(h.lenis.starts, 1);assert.equal(h.lenis.scroll, 0);
  } finally {h.dispose();}
});

test('footer and dialog locks cannot restart one another and preserve an already stopped engine', () => {
  for (const footerFirst of [true, false]) {
    const h = setup();
    const dialog = {};
    if (footerFirst) {h.footer(true);h.modal(dialog, true);h.footer(false);}
    else {h.modal(dialog, true);h.footer(true);h.modal(dialog, false);}
    assert.equal(h.lenis.isStopped, true);assert.equal(h.lenis.starts, 0);
    if (footerFirst) h.modal(dialog, false);else h.footer(false);
    assert.equal(h.lenis.starts, 1);h.dispose();
  }
  const stopped = setup({stopped: true});
  stopped.footer(true);stopped.footer(false);
  assert.equal(stopped.lenis.starts, 0);assert.equal(stopped.lenis.isStopped, true);stopped.dispose();
});

test('a footer lock acquired before the smooth-scroll hook is mounted is adopted without a free ticker frame', () => {
  const h = setup({initialFooter: true});
  assert.equal(h.lenis.isStopped, true);h.tick();assert.equal(h.lenis.rafs, 0);
  h.footer(false);assert.equal(h.lenis.starts, 1);h.dispose();
  const stops = h.lenis.stops;h.footer(true);assert.equal(h.lenis.stops, stops, 'cleanup removes the event bridge');
});

test('restoration resizes stopped Lenis before synchronizing, including cancellation at the captured position', () => {
  const h = setup();
  h.footer(true);h.footer(true, true);
  assert.deepEqual(h.lenis.dimensions, [0], 'cached fixed-body dimensions must not survive the final layout');
  h.document.dispatchEvent(new CustomEvent('footer-scene-scroll-state', {detail: {active: true, scrollY: 800}}));
  assert.deepEqual(h.lenis.dimensions, [0, 1]);
  assert.equal(h.lenis.targetScroll, 800);assert.equal(h.lenis.scroll, 800);
  assert.equal(h.lenis.isStopped, true);
  h.footer(false);assert.equal(h.lenis.starts, 1);h.dispose();
});

test('native Lenis emissions cannot feed ScrollTrigger the fixed-body clock', () => {
  const h = setup();
  h.footer(true);h.lenis.emit();
  assert.equal(h.updates, 0);
  h.footer(true, true);h.lenis.emit();assert.equal(h.updates, 1);
  h.footer(false);h.lenis.emit();assert.equal(h.updates, 2);
  h.dispose();h.lenis.emit();assert.equal(h.updates, 2);
});

test('canceling before the top handoff remeasures final Lenis dimensions before resuming', () => {
  const h = setup();h.footer(true);h.footer(false);
  assert.deepEqual(h.lenis.dimensions, [0]);
  assert.equal(h.lenis.starts, 1);h.dispose();
});
