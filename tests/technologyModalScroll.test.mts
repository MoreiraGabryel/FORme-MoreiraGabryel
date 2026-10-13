import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness, elements} from './helpers/technologyHarness.cjs';

function setup({stopped = false, reduced = false} = {}) {
  const document = Object.assign(new EventTarget(), {
    activeElement: null,
    documentElement: {style: {overflow: 'clip'}},
    body: {},
    querySelectorAll: () => [],
  });
  const ticker = new Set();
  let instance;
  class Lenis {
    isStopped = stopped;
    targetScroll = 800;
    scroll = 120;
    stops = 0;
    starts = 0;
    rafs = 0;
    destroyed = false;
    constructor() { instance = this; }
    on() {}
    off() {}
    raf() { this.rafs++; this.scroll += (this.targetScroll - this.scroll) * 0.1; }
    stop() { this.stops++; this.targetScroll = this.scroll; this.isStopped = true; }
    start() { this.starts++; this.isStopped = false; }
    destroy() { this.destroyed = true; }
  }
  let finishClose;
  const gsap = {
    registerPlugin() {}, context: (run) => { run(); return {revert() {}}; },
    ticker: {add: (fn) => ticker.add(fn), remove: (fn) => ticker.delete(fn), lagSmoothing() {}},
  };
  const mocks = {
    lenis: Lenis, gsap: {gsap}, 'gsap/ScrollTrigger': {ScrollTrigger: {update() {}}},
    '../../utils/technologyCardMotion': {
      createTechnologyCardTimeline: () => ({play() {}}),
      closeTechnologyCardTimeline: (_timeline, closed) => { finishClose = closed; },
    },
  };
  const globals = {
    window: {matchMedia: () => ({matches: reduced})}, document,
    HTMLElement: class {}, CustomEvent,
  };
  const hook = createHarness(mocks, globals);
  const dialog = createHarness(mocks, globals);
  const {useSmoothScroll} = hook.load(fileURLToPath(new URL('../src/hooks/useSmoothScroll.ts', import.meta.url)));
  const {TechnologyDialog} = dialog.load(fileURLToPath(new URL('../src/components/technology/TechnologyDialog.tsx', import.meta.url)));
  const props = {
    technology: {id: 'gsap', label: 'GSAP', category: {pt: 'motion'}, description: {pt: 'details'}},
    locale: 'pt', reducedMotion: false, onClosed() {},
  };
  hook.render(() => useSmoothScroll(true));
  hook.flush();
  return {
    get lenis() { return instance; }, document, ticker,
    tick() { ticker.forEach((fn) => fn(1)); },
    open() {
      const tree = dialog.render(TechnologyDialog, props);
      elements(tree, (node) => Boolean(node.props?.ref)).forEach((node) => {
        node.props.ref.current = {
          open: false, style: {}, querySelectorAll: () => [], querySelector: () => ({}),
          showModal() { this.open = true; }, close() { this.open = false; },
        };
      });
      dialog.flush();
      return tree;
    },
    close(tree) {
      elements(tree, (node) => node.props?.className === 'technology-modal-close')[0].props.onClick();
    },
    finish() { finishClose(); dialog.dispose(); },
    dispose() { dialog.dispose(); hook.dispose(); },
  };
}

test('technology dialog cancels pending Lenis inertia throughout its animated lifetime and restores running state', () => {
  const host = setup();
  host.tick();
  const tree = host.open();
  try {
    assert.equal(host.lenis.isStopped, true, 'opening the technology modal must stop Lenis, not just hide overflow');
    assert.equal(host.lenis.targetScroll, host.lenis.scroll, 'pending inertia must be cancelled');
    const frozen = host.lenis.scroll;
    const rafs = host.lenis.rafs;
    host.tick();
    assert.equal(host.lenis.scroll, frozen);
    assert.equal(host.lenis.rafs, rafs, 'modal ownership must also suspend its GSAP ticker pump');
    host.close(tree);
    host.tick();
    assert.equal(host.lenis.isStopped, true, 'the exit animation still owns the scroll lock');
    host.finish();
    assert.equal(host.lenis.isStopped, false);
    assert.equal(host.lenis.starts, 1);
    assert.equal(host.document.documentElement.style.overflow, 'clip');
    host.tick();
    assert.equal(host.lenis.scroll, frozen, 'closing must not replay cancelled inertia');
  } finally { host.dispose(); }
  assert.equal(host.ticker.size, 0);
  assert.equal(host.lenis.destroyed, true);
});

test('technology dialog does not restart an already stopped Lenis', () => {
  const host = setup({stopped: true});
  try {
    const tree = host.open();
    host.close(tree);
    host.finish();
    assert.equal(host.lenis.starts, 0);
    assert.equal(host.lenis.isStopped, true);
  } finally { host.dispose(); }
});

test('reduced-motion native scrolling requires no Lenis instance for the technology dialog lifetime', () => {
  const host = setup({reduced: true});
  try {
    const tree = host.open();
    host.close(tree);
    host.finish();
    assert.equal(host.lenis, undefined);
    assert.equal(host.document.documentElement.style.overflow, 'clip');
  } finally { host.dispose(); }
});
