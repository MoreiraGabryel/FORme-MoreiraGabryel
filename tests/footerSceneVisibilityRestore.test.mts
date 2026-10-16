import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness} from './helpers/technologyHarness.cjs';
import {IDBFactory} from 'fake-indexeddb';

// Explicit EventTarget/clock/style surfaces, not native paint or pin geometry.
// Controller, lock, restoration barrier and dirty/scrub queue algorithms are real.
class Style {
  values = new Map<string, string>();
  getPropertyValue(name: string) {return this.values.get(name) ?? '';}
  getPropertyPriority() {return '';}
  setProperty(name: string, value: string) {this.values.set(name, value);}
  removeProperty(name: string) {this.values.delete(name);}
}
const source = (name: string) => fileURLToPath(new URL(`../src/utils/${name}.ts`, import.meta.url));
async function microtasks() {for (let i = 0; i < 12; i++) await Promise.resolve();}
function setup({delayResults = false, synchronous = false} = {}) {
  const passes: {signal: AbortSignal; actual: Promise<void>; deliver: () => void}[] = [];
  let phraseActive = false, scrubProgress = 0, scrubCompletions = 0;
  const globalTimeline = {};
  const pin = {trigger: {matches: () => true}, start: 0, end: 100, progress: 0, scroll: () => 0,
    animation: {totalProgress: () => scrubProgress},
    getTween: () => ({progress() {scrubProgress = 0;scrubCompletions++;}}),
  };
  let id = 0, now = 0, refreshes = 0, reconciles = 0, acquisitions = 0, plays = 0;
  const frames = new Map<number, () => void>();
  const timers = new Map<number, {fn: () => void; at: number}>();
  const states: string[] = [];
  const win = Object.assign(new EventTarget(), {
    scrollX: 23, scrollY: 16000,
    requestAnimationFrame(fn: () => void) {frames.set(++id, fn);return id;},
    cancelAnimationFrame(key: number) {frames.delete(key);},
    scrollTo({top, left}: {top: number; left: number}) {win.scrollY = top;win.scrollX = left;win.dispatchEvent(new Event('scroll'));},
  });
  const root = {inert: false};
  const doc = Object.assign(new EventTarget(), {
    hidden: false, visibilityState: 'visible',
    documentElement: {dataset: {} as Record<string, string>, style: new Style()},
    body: {style: new Style(), getBoundingClientRect: () => ({width: 1440})},
    getElementById: (id: string) => id === 'root' ? root : null,
  });
  doc.body.style.setProperty('position', 'relative');
  doc.body.style.setProperty('overflow-y', 'scroll');
  const host = createHarness({
    gsap: {gsap: {globalTimeline, getTweensOf: () => [{isActive: () => phraseActive, parent: globalTimeline}]}},
    'gsap/ScrollTrigger': {ScrollTrigger: {sort() {}, refresh() {refreshes++;}, update() {}, getAll: () => [pin]}},
  }, {window: win, document: doc, Event, CustomEvent, AbortController, indexedDB: new IDBFactory()});
  const scene = host.load(source('sceneRefresh'));
  const {restoreFooterScene} = host.load(source('footerSceneRestoration'));
  const video = Object.assign(new EventTarget(), {paused: true,
    pause() {this.paused = true;}, play() {plays++;this.paused = false;return Promise.resolve();},
  });
  const data = new Map<string, string>();
  const visits = host.load(source('footerScenePolicy')).createFooterVisitCounter({
    getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value),
  });
  const admissions: Promise<boolean>[] = [];
  const counter = {...visits, consume(...args: [signal?: AbortSignal, onCommitted?: () => void]) {
    const pending = visits.consume(...args);admissions.push(pending);return pending;
  }};
  const controller = host.load(source('footerSceneController')).createFooterSceneController({
    video, counter,
    acquireLock() {
      acquisitions++;
      return host.load(source('footerSceneInputLock')).acquireFooterSceneInputLock(doc, win, synchronous ? undefined :
        (signal: AbortSignal) => {
          const actual = restoreFooterScene(signal, () => {reconciles++;scene.flushSceneRefresh();});
          let deliver = () => {};
          const gate = new Promise<void>(resolve => {deliver = resolve;});
          passes.push({signal, actual, deliver});
          // Delay only delivery at the public callback seam; await real barrier outcomes.
          return delayResults ? actual.then(() => gate, async (error: unknown) => {await gate;throw error;}) : actual;
        });
    },
    onState: (state: string) => states.push(state),
    clock: {now: () => now, set(fn: () => void, delay: number) {timers.set(++id, {fn, at: now + delay});return id;}, clear(key: number) {timers.delete(key);}},
  });
  // Same pagehide -> cancel wiring used by FinalFooterStage, without mounting UI.
  const pageHidden = () => controller.cancel();
  win.addEventListener('pagehide', pageHidden);
  const visibility = (visible: boolean) => {
    doc.hidden = !visible;doc.visibilityState = visible ? 'visible' : 'hidden';
    controller.setVisible(visible);doc.dispatchEvent(new Event('visibilitychange'));
  };
  const frame = () => {const batch = [...frames.values()];frames.clear();batch.forEach(fn => fn());};
  const advance = (ms: number) => {
    const end = now + ms;
    for (let i = 0; i < 1000; i++) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at).find(([, task]) => task.at <= end);
      if (!next) {now = end;return;}
      now = next[1].at;timers.delete(next[0]);next[1].fn();
    }
    assert.fail('unbounded timer loop');
  };
  return {controller, scene, doc, win, root, frames, timers, video, states, frame, advance, visibility, passes, counter,
    async admissions() {await Promise.all(admissions);await microtasks();},
    setPhraseActive(value: boolean) {phraseActive = value;},
    setScrubProgress(value: number) {scrubProgress = value;},
    get scrubProgress() {return scrubProgress;}, get scrubCompletions() {return scrubCompletions;},
    get refreshes() {return refreshes;}, get reconciles() {return reconciles;},
    get acquisitions() {return acquisitions;}, get plays() {return plays;},
    begin() {controller.checkViewport({top: 0, bottom: 1000}, 1000);video.dispatchEvent(new Event('ended'));advance(180);},
    dispose() {controller.dispose();passes.forEach(pass => pass.deliver());win.removeEventListener('pagehide', pageHidden);host.dispose();},
  };
}
function ownedAtTop(h: ReturnType<typeof setup>) {
  assert.equal(h.root.inert, true);
  assert.equal(h.doc.documentElement.dataset.footerSceneActive, 'true');
  assert.equal(h.doc.documentElement.dataset.footerSceneRestoring, 'true');
  assert.equal(h.doc.body.style.getPropertyValue('position'), 'relative');
  assert.equal(h.doc.body.style.getPropertyValue('overflow-y'), 'scroll');
  assert.equal(h.win.scrollY, 0);
  const wheel = new Event('wheel', {cancelable: true});h.doc.dispatchEvent(wheel);
  assert.equal(wheel.defaultPrevented, true);
}

test('hidden after final ready but before lock settlement requires a new visible barrier before reveal', async () => {
  const h = setup();
  try {
    h.begin();h.frame();await microtasks();
    assert.equal(h.reconciles, 1);
    h.frame();await Promise.resolve();
    assert.equal(h.reconciles, 2);
    assert.equal(h.controller.getState(), 'blackout');
    h.visibility(false);h.scene.requestSceneRefresh();await microtasks();
    assert.equal(h.scene.hasPendingSceneRefresh(), true);
    h.visibility(true);h.advance(0);await microtasks();
    assert.equal(h.controller.getState(), 'blackout', 'old ready cannot reveal before any new visible frame');
    ownedAtTop(h);
    h.frame();await microtasks();
    assert.equal(h.controller.getState(), 'blackout', 'the commit observation frame is still required');
    assert.equal(h.scene.hasPendingSceneRefresh(), false);
    h.frame();await microtasks();
    assert.equal(h.controller.getState(), 'revealing');
    assert.equal(h.reconciles, 4);assert.equal(h.refreshes, 4);
    assert.equal(h.acquisitions, 1);assert.equal(h.plays, 1);
    ownedAtTop(h);h.advance(240);
    assert.equal(h.controller.getState(), 'idle');assert.equal(h.root.inert, false);
  } finally {h.dispose();}
});


test('hidden during revealing returns to full blackout and revalidates even an acknowledged top', async () => {
  const h = setup();
  try {
    h.begin();h.frame();await microtasks();h.frame();await microtasks();
    assert.equal(h.controller.getState(), 'revealing');h.advance(120);
    h.visibility(false);h.scene.requestSceneRefresh();await microtasks();
    assert.equal(h.controller.getState(), 'blackout', 'an interrupted reveal must be covered again');
    ownedAtTop(h);h.advance(60000);
    assert.equal(h.root.inert, true);assert.equal(h.reconciles, 2);
    h.visibility(true);h.advance(240);await microtasks();
    assert.equal(h.controller.getState(), 'blackout', 'a reveal timer is not a fresh layout barrier');
    h.frame();await microtasks();assert.equal(h.reconciles, 3);
    assert.equal(h.scene.hasPendingSceneRefresh(), false);ownedAtTop(h);
    h.frame();await microtasks();assert.equal(h.controller.getState(), 'revealing');
    assert.equal(h.reconciles, 4);assert.equal(h.acquisitions, 1);assert.equal(h.plays, 1);
    h.advance(239);ownedAtTop(h);h.advance(1);
    assert.equal(h.controller.getState(), 'idle');assert.equal(h.root.inert, false);
  } finally {h.dispose();}
});


test('repeated visibility interruptions keep only the newest visible commit/dirty/scrub pass', async () => {
  const h = setup();
  try {
    h.begin();h.frame();await microtasks();h.frame();await microtasks();
    assert.equal(h.controller.getState(), 'revealing');
    h.visibility(false);h.scene.requestSceneRefresh();h.setScrubProgress(1);
    h.visibility(true);h.frame();await microtasks();
    assert.equal(h.scrubProgress, 0);assert.equal(h.controller.getState(), 'blackout');
    // A commit/rebuild after the first reconciliation invalidates that quiet observation.
    h.scene.requestSceneRefresh();h.setPhraseActive(true);
    h.visibility(false);await microtasks();
    assert.equal(h.passes[1].signal.aborted, true);
    h.advance(60000);h.frame();await microtasks();
    assert.equal(h.reconciles, 3);assert.equal(h.scene.hasPendingSceneRefresh(), true);
    h.visibility(true);h.frame();await microtasks();h.frame();await microtasks();
    assert.equal(h.scene.hasPendingSceneRefresh(), false);
    assert.equal(h.controller.getState(), 'blackout', 'active phrase/commit work still owns the blackout');
    h.setPhraseActive(false);h.scene.requestSceneRefresh();h.setScrubProgress(.5);
    h.frame();await microtasks();h.frame();await microtasks();
    assert.equal(h.controller.getState(), 'revealing');assert.equal(h.scrubProgress, 0);
    assert.equal(h.scrubCompletions, h.reconciles);assert.equal(h.passes.length, 3);
    assert.equal(h.acquisitions, 1);assert.equal(h.plays, 1);assert.equal(h.counter.read(), 0);
    assert.equal(h.states.filter(state => state === 'loading').length, 1);ownedAtTop(h);
  } finally {h.dispose();}
});

for (const outcome of ['success', 'rejection']) {
  test(`stale old ${outcome} after a new retry cannot reveal, fail or clear its deadline`, async () => {
    const h = setup({delayResults: true});
    try {
      h.begin();
      if (outcome === 'success') {h.frame();await microtasks();h.frame();await microtasks();await h.passes[0].actual;}
      h.visibility(false);await microtasks();
      if (outcome === 'rejection') await assert.rejects(h.passes[0].actual, {name: 'AbortError'});
      h.visibility(true);h.advance(1000);
      h.passes[0].deliver();await microtasks();
      assert.equal(h.controller.getState(), 'blackout');assert.equal(h.timers.size, 1);ownedAtTop(h);
      h.frame();await microtasks();h.frame();await microtasks();
      await h.passes[1].actual;
      assert.equal(h.controller.getState(), 'blackout', 'actual callback delivery is still pending');
      h.passes[1].deliver();await microtasks();
      assert.equal(h.controller.getState(), 'revealing');assert.equal(h.acquisitions, 1);
      h.advance(240);assert.equal(h.root.inert, false);assert.equal(h.timers.size, 0);
    } finally {h.dispose();}
  });
}

for (const acknowledged of [false, true]) {
  for (const visibleRetry of [false, true]) {
    for (const action of ['cancel', 'dispose', 'pagehide']) {
      test(`${action} ${visibleRetry ? 'while revalidating' : 'while hidden'} after ${acknowledged ? 'acknowledged' : 'unfinished'} top cleans ownership and stale frames`, async () => {
        const h = setup();
        try {
          h.begin();
          if (acknowledged) {h.frame();await microtasks();h.frame();await microtasks();assert.equal(h.controller.getState(), 'revealing');}
          h.visibility(false);await microtasks();
          if (visibleRetry) {h.visibility(true);h.frame();await microtasks();}
          ownedAtTop(h);
          if (action === 'pagehide') h.win.dispatchEvent(new Event('pagehide'));
          else h.controller[action]();
          assert.equal(h.root.inert, false);assert.equal(h.timers.size, 0);assert.equal(h.frames.size, 0);
          assert.equal(h.passes.at(-1)!.signal.aborted, true);
          assert.equal(h.win.scrollY, acknowledged ? 0 : 16000);
          assert.equal(h.win.scrollX, acknowledged ? 0 : 23);
          assert.equal(h.doc.body.style.getPropertyValue('position'), 'relative');
          assert.equal(h.doc.body.style.getPropertyValue('overflow-y'), 'scroll');
          assert.equal(h.doc.documentElement.dataset.footerSceneActive, undefined);
          assert.equal(h.doc.documentElement.dataset.footerSceneRestoring, undefined);
          const wheel = new Event('wheel', {cancelable: true});h.doc.dispatchEvent(wheel);
          assert.equal(wheel.defaultPrevented, false);
          const states = [...h.states], plays = h.plays, reconciles = h.reconciles;
          h.visibility(true);h.frame();h.advance(10000);await microtasks();
          assert.deepEqual(h.states, states);assert.equal(h.plays, plays);assert.equal(h.reconciles, reconciles);
          assert.equal(h.controller.getState(), action === 'dispose' ? 'disposed' : 'idle');
        } finally {h.dispose();}
      });
    }
  }
}

test('one 4000ms visible waiting budget survives hidden retries without timing out hidden or revealing on timeout', async () => {
  const h = setup();
  try {
    h.begin();
    for (let i = 0; i < 3; i++) {
      h.advance(1000);h.visibility(false);await microtasks();h.advance(60000);
      assert.equal(h.controller.getState(), 'blackout');assert.equal(h.timers.size, 0);ownedAtTop(h);
      h.visibility(true);
    }
    h.advance(999);ownedAtTop(h);assert.equal(h.controller.getState(), 'blackout');
    h.advance(1);await microtasks();
    assert.equal(h.controller.getState(), 'idle');assert.equal(h.root.inert, false);
    assert.equal(h.win.scrollY, 16000);assert.equal(h.frames.size, 0);assert.equal(h.timers.size, 0);
    assert.equal(h.states.includes('revealing'), false);assert.equal(h.counter.read(), 0);
  } finally {h.dispose();}
});

test('a reveal pause does not replenish spent restoration budget and acknowledged top survives retry failure', async () => {
  const h = setup();
  try {
    h.begin();h.advance(3000);h.frame();await microtasks();h.frame();await microtasks();
    assert.equal(h.controller.getState(), 'revealing');h.advance(200);
    h.visibility(false);await microtasks();h.advance(60000);ownedAtTop(h);
    h.visibility(true);h.advance(999);ownedAtTop(h);
    assert.equal(h.controller.getState(), 'blackout');
    h.advance(1);await microtasks();
    assert.equal(h.controller.getState(), 'idle');assert.equal(h.root.inert, false);
    assert.equal(h.win.scrollY, 0, 'previously acknowledged top navigation is not rolled back');
    assert.equal(h.timers.size, 0);assert.equal(h.frames.size, 0);
  } finally {h.dispose();}
});

test('hidden playing still pauses/resumes the real admitted visit without reconsuming or starting restoration', async () => {
  const h = setup();
  try {
    h.controller.checkViewport({top: 0, bottom: 1000}, 1000);
    h.video.dispatchEvent(new Event('playing'));await h.admissions();
    assert.equal(h.counter.read(), 1);assert.equal(h.controller.getState(), 'playing');
    h.visibility(false);h.advance(60000);assert.equal(h.video.paused, true);
    assert.equal(h.passes.length, 0);assert.equal(h.root.inert, true);
    h.visibility(true);h.video.dispatchEvent(new Event('playing'));await h.admissions();
    assert.equal(h.counter.read(), 1);assert.equal(h.controller.getState(), 'playing');
    assert.equal(h.video.paused, false);assert.equal(h.acquisitions, 1);
    h.video.dispatchEvent(new Event('ended'));h.advance(180);
    h.frame();await microtasks();h.frame();await microtasks();
    h.visibility(false);h.scene.requestSceneRefresh();h.visibility(true);
    h.frame();await microtasks();h.frame();await microtasks();
    assert.equal(h.counter.read(), 1);assert.equal(h.controller.getState(), 'revealing');
    assert.equal(h.plays, 3);assert.equal(h.states.filter(state => state === 'loading').length, 1);
  } finally {h.dispose();}
});

test('the existing synchronous restore handle remains safe across a hidden reveal', () => {
  const h = setup({synchronous: true});
  try {
    h.begin();assert.equal(h.controller.getState(), 'revealing');
    assert.doesNotThrow(() => h.visibility(false));h.advance(60000);
    assert.equal(h.controller.getState(), 'blackout');ownedAtTop(h);
    h.visibility(true);h.advance(0);assert.equal(h.controller.getState(), 'revealing');
    h.advance(240);assert.equal(h.controller.getState(), 'idle');assert.equal(h.root.inert, false);
    assert.equal(h.timers.size, 0);assert.equal(h.acquisitions, 1);assert.equal(h.plays, 1);
  } finally {h.dispose();}
});
