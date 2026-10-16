import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness} from './helpers/technologyHarness.cjs';
import {IDBFactory} from 'fake-indexeddb';

function setup({count = 0, framed = true, failAcquire = false, failReturn = false,
  sharedData = undefined as Map<string, string> | undefined, indexedDB = new IDBFactory()} = {}) {
  let now = 0;
  let timerId = 0;
  const timers = new Map<number, {at: number; callback: () => void}>();
  const clock = {
    now: () => now,
    set(callback: () => void, delay: number) {const id = ++timerId;timers.set(id, {at: now + delay, callback});return id;},
    clear(id: number) {timers.delete(id);},
  };
  const advance = (ms: number) => {
    const until = now + ms;
    for (let loops = 0; loops < 1000; loops++) {
      const next = [...timers].filter(([, entry]) => entry.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at;timers.delete(next[0]);next[1].callback();
    }
    now = until;
  };
  class Video extends EventTarget {
    currentTime = 0;
    duration = 10.055556;
    muted = false;
    loop = false;
    playsInline = false;
    playbackRate = 1;
    paused = true;
    plays: boolean[] = [];
    results: (() => Promise<void>)[] = [];
    frameId = 0;
    frames = new Map<number, (now: number, metadata: {mediaTime: number}) => void>();
    play() {this.paused = false;this.plays.push(this.muted);return this.results.shift()?.() ?? Promise.resolve();}
    pause() {this.paused = true;}
    requestVideoFrameCallback(callback: (now: number, metadata: {mediaTime: number}) => void) {const id = ++this.frameId;this.frames.set(id, callback);return id;}
    cancelVideoFrameCallback(id: number) {this.frames.delete(id);}
    event(name: string) {this.dispatchEvent(new Event(name));}
    present(time: number) {this.currentTime = time;const pending = [...this.frames.values()];this.frames.clear();pending.forEach(callback => callback(time*1000, {mediaTime: time}));}
  }
  const video = new Video();
  if (!framed) Object.defineProperty(video, 'requestVideoFrameCallback', {value: undefined});
  const data = sharedData ?? new Map([['moreiragabryel:footer-scene:v1', String(count)]]);
  const storage = {getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value)};
  const host = createHarness({}, {indexedDB, AbortController});
  let createController: any;
  try {createController = host.load(fileURLToPath(new URL('../src/utils/footerSceneController.ts', import.meta.url))).createFooterSceneController;}
  catch {assert.fail('footer scene controller must exist');}
  const {createFooterVisitCounter} = host.load(fileURLToPath(new URL('../src/utils/footerScenePolicy.ts', import.meta.url)));
  const visits = createFooterVisitCounter(storage);
  const pending: Promise<boolean>[] = [];
  const counter = {...visits, consume(...args: [signal?: AbortSignal, onCommitted?: () => void]) {
    const result = visits.consume(...args);pending.push(result);return result;
  }};
  const states: string[] = [];
  const times: number[] = [];
  let locks = 0, releases = 0, returns = 0;
  const controller = createController({video, counter, clock,
    acquireLock() {if (failAcquire) throw new Error('lock unavailable');locks++;return {returnToTop() {returns++;if (failReturn) throw new Error('return failed');},release() {releases++;}};},
    onState(state: string) {states.push(state);}, onTime(time: number) {times.push(time);},
  });
  return {video, controller, counter, data, states, times, timers, advance,
    get locks() {return locks;},get releases() {return releases;},get returns() {return returns;},
    full() {controller.checkViewport({top: 0, bottom: 800}, 800);},
    leave() {controller.checkViewport({top: 500, bottom: 1300}, 800);},
    async promises() {await Promise.all(pending);await Promise.resolve();await Promise.resolve();await Promise.resolve();},
  };
}

test('pending admission stays black and paused, deduplicates playing events, then resumes once', async () => {
  const h = setup();
  const consume = h.counter.consume;
  let calls = 0;
  let complete!: () => Promise<void>;
  h.counter.consume = (...args: [signal?: AbortSignal, onCommitted?: () => void]) => {
    calls++;
    return new Promise<boolean>(resolve => {complete = async () => {resolve(await consume(...args));};});
  };
  try {
    h.full();h.video.event('playing');h.video.event('playing');
    assert.equal(h.controller.getState(), 'loading', 'the UI must not expose an unadmitted scene');
    assert.equal(h.video.paused, true, 'media must not advance while waiting for another context');
    assert.equal(h.counter.read(), 0);
    assert.equal(calls, 1, 'duplicate playing events must share one pending admission');
    await complete();await h.promises();
    assert.equal(h.counter.read(), 1);
    assert.equal(h.controller.getState(), 'playing');
    assert.equal(h.video.paused, false);
    h.video.event('playing');await h.promises();
    assert.equal(calls, 1, 'resuming the admitted video must not consume twice');
  } finally {h.controller.dispose();}
});

test('cancellation, disposal, watchdog, errors and hiding abort pending admission before any queued commit', async () => {
  for (const reason of ['cancel', 'dispose', 'watchdog', 'error', 'hidden']) {
    const h = setup({count: 1});
    const consume = h.counter.consume;
    let signal!: AbortSignal;
    let complete!: () => Promise<void>;
    h.counter.consume = (...args: [signal?: AbortSignal, onCommitted?: () => void]) => {
      signal = args[0]!;
      return new Promise<boolean>(resolve => {complete = async () => {resolve(await consume(...args));};});
    };
    try {
      h.full();h.video.event('playing');
      if (reason === 'cancel') h.controller.cancel();
      if (reason === 'dispose') h.controller.dispose();
      if (reason === 'watchdog') h.advance(9000);
      if (reason === 'error') {h.video.event('error');h.advance(420);}
      if (reason === 'hidden') h.controller.setVisible(false);
      assert.equal(signal.aborted, true, reason);
      const states = [...h.states], plays = h.video.plays.length;
      await complete();await h.promises();
      assert.equal(h.counter.read(), 1, `${reason}: stale queued admission cannot consume`);
      assert.deepEqual(h.states, states, `${reason}: stale completion cannot change UI state`);
      assert.equal(h.video.plays.length, plays, `${reason}: stale completion cannot play`);
      assert.equal(h.video.paused, true);
      assert.equal(h.video.frames.size, 0);
      assert.equal(h.releases, reason === 'hidden' ? 0 : 1);
      assert.equal(h.timers.size, 0);
      if (reason === 'hidden') {
        h.controller.setVisible(true);h.video.event('playing');
        await complete();await h.promises();
        assert.equal(h.counter.read(), 2, 'a fresh visible playing event can consume once');
        assert.equal(h.controller.getState(), 'playing');
      }
    } finally {h.controller.dispose();}
  }
});

for (const action of ['cancel', 'dispose', 'new-visit']) {
  test(`late committed observer and real true result stay inert after ${action}`, async () => {
    const h = setup();
    const consume = h.counter.consume;
    let acknowledge!: () => void, deliver!: () => void;
    let delayed!: Promise<boolean>;
    h.counter.consume = (...args: [signal?: AbortSignal, onCommitted?: () => void]) => {
      acknowledge = args[1]!;
      const real = consume(...args);
      const gate = new Promise<void>(resolve => {deliver = resolve;});
      delayed = real.then(async (allowed: boolean) => {await gate;return allowed;});
      return delayed;
    };
    try {
      h.full();h.video.event('playing');await h.promises();
      assert.equal(h.counter.read(), 1, 'the delayed result must come from a real accepted commit');
      assert.equal(typeof acknowledge, 'function', 'the controller must register committed ownership separately from settlement');
      if (action === 'dispose') h.controller.dispose();else h.controller.cancel();
      h.counter.consume = consume;
      if (action === 'new-visit') {h.leave();h.full();}
      const states = [...h.states], plays = h.video.plays.length;
      // Artificially replay the captured observer as well as a delayed real true
      // result: neither may mutate the next execution or revive a canceled one.
      acknowledge();deliver();assert.equal(await delayed, true);await Promise.resolve();
      assert.deepEqual(h.states, states);assert.equal(h.video.plays.length, plays);
      assert.equal(h.counter.read(), 1);assert.equal(h.video.frames.size, 0);
      if (action === 'new-visit') {
        h.video.event('playing');await h.promises();
        assert.equal(h.counter.read(), 2, 'an old observer cannot mark the new visit counted');
        assert.equal(h.controller.getState(), 'playing');assert.equal(h.video.paused, false);
      } else {
        assert.equal(h.controller.getState(), action === 'cancel' ? 'idle' : 'disposed');
        assert.equal(h.video.paused, true);assert.equal(h.releases, 1);assert.equal(h.timers.size, 0);
      }
    } finally {deliver?.();h.controller.dispose();}
  });
}

test('two independent controllers racing the last slot expose exactly one full scene', async () => {
  const indexedDB = new IDBFactory();
  const sharedData = new Map([['moreiragabryel:footer-scene:v1', '1']]);
  const a = setup({indexedDB, sharedData}), b = setup({indexedDB, sharedData});
  try {
    a.full();b.full();a.video.event('playing');b.video.event('playing');
    assert.equal(a.controller.getState(), 'loading');assert.equal(b.controller.getState(), 'loading');
    assert.equal(a.video.paused, true);assert.equal(b.video.paused, true);
    await Promise.all([a.promises(), b.promises()]);
    const admitted = [a, b].filter(h => h.controller.getState() === 'playing');
    assert.equal(admitted.length, 1);
    const denied = [a, b].find(h => h.controller.getState() === 'exhausted')!;
    assert.equal(denied.video.paused, true);assert.equal(denied.releases, 1);
    assert.equal(denied.video.frames.size, 0);assert.equal(denied.timers.size, 0);
    assert.equal(sharedData.get('moreiragabryel:footer-scene:v1'), '2');
    admitted[0].video.event('ended');admitted[0].advance(420);
    for (const h of [a, b]) {
      const plays = h.video.plays.length;
      h.leave();h.full();
      assert.equal(h.controller.getState(), 'exhausted');
      assert.equal(h.video.plays.length, plays, 'no third full scene');
      assert.equal(h.locks, h.releases);
    }
  } finally {a.controller.dispose();b.controller.dispose();}
});

test('unavailable coordination denies playback immediately and releases the native lock', async () => {
  const h = setup({count: 1, indexedDB: {open() {throw new Error('coordination denied');}} as unknown as IDBFactory});
  try {
    h.full();h.video.event('playing');await h.promises();
    assert.equal(h.controller.getState(), 'exhausted');
    assert.equal(h.counter.read(), 1);
    assert.equal(h.video.paused, true);assert.equal(h.releases, 1);
    assert.equal(h.timers.size, 0);assert.equal(h.video.frames.size, 0);
  } finally {h.controller.dispose();}
});

test('a full visit locks until media ends and returns under blackout before releasing', async () => {
  const h = setup();
  try {
    h.controller.checkViewport({top: 2, bottom: 802}, 800);
    assert.equal(h.video.plays.length, 0);
    h.full();
    assert.equal(h.controller.getState(), 'loading');
    assert.equal(h.locks, 1);
    assert.equal(h.counter.read(), 0, 'buffering is not a consumed execution');
    h.video.event('playing');await h.promises();
    assert.equal(h.controller.getState(), 'playing');
    assert.equal(h.counter.read(), 1);
    h.video.event('playing');
    assert.equal(h.counter.read(), 1, 'rebuffering must not consume another visit');
    h.leave();
    assert.equal(h.releases, 0, 'leaving geometry cannot skip an active mandatory scene');
    h.video.event('ended');
    assert.equal(h.controller.getState(), 'blackout');
    assert.equal(h.returns, 0);
    h.advance(180);
    assert.equal(h.returns, 1);
    assert.equal(h.controller.getState(), 'revealing');
    assert.equal(h.releases, 0);
    h.advance(240);
    assert.equal(h.releases, 1);
    assert.equal(h.controller.getState(), 'idle');
    h.full();
    assert.equal(h.video.plays.length, 2, 'only the initial play and admission resume are allowed, not a new arrival');
    await h.promises();
  } finally {h.controller.dispose();}
});

test('blocked audible autoplay retries silently without consuming a visit before playback', async () => {
  const h = setup();
  try {
    h.video.results.push(() => Promise.reject(Object.assign(new Error('autoplay denied'), {name: 'NotAllowedError'})));
    h.full();await h.promises();
    assert.deepEqual(h.video.plays, [false, true]);
    assert.equal(h.controller.getState(), 'loading');
    assert.equal(h.counter.read(), 0);
    h.video.event('playing');await h.promises();
    assert.equal(h.counter.read(), 1);
    assert.equal(h.video.muted, true);
  } finally {h.controller.dispose();}
});

test('effect timing follows presented video frames with a media-time fallback and cleans callbacks', async () => {
  for (const framed of [true, false]) {
    const h = setup({framed});
    h.full();h.video.event('playing');await h.promises();
    if (framed) {
      assert.equal(h.video.frames.size, 1, 'one decoded-frame callback must be scheduled');
      h.video.present(6.4);
      h.video.currentTime = 7;
      h.video.event('timeupdate');
      assert.equal(h.times.at(-1), 6.4, 'timeupdate must not race the presented-frame clock');
      h.video.present(6.5);
    } else {
      h.video.currentTime = 6.5;h.video.event('timeupdate');
    }
    assert.equal(h.times.at(-1), 6.5);
    h.controller.dispose();
    assert.equal(h.video.frames.size, 0);
    const count = h.times.length;
    h.video.currentTime = 8;h.video.event('timeupdate');
    assert.equal(h.times.length, count);
  }
});

test('hidden tabs pause both media and blackout without releasing the mandatory lock or counting twice', async () => {
  const h = setup();
  try {
    h.controller.setVisible(false);h.full();
    assert.equal(h.locks, 0);
    h.controller.setVisible(true);h.full();h.video.event('playing');await h.promises();h.video.present(2);
    h.controller.setVisible(false);
    assert.equal(h.video.paused, true);
    assert.equal(h.video.frames.size, 0);
    h.advance(60000);
    assert.equal(h.controller.getState(), 'playing');
    assert.equal(h.releases, 0);
    h.controller.setVisible(true);h.video.event('playing');h.video.present(3);
    assert.equal(h.counter.read(), 1);
    assert.equal(h.times.at(-1), 3);
    h.video.event('ended');h.controller.setVisible(false);h.advance(10000);
    assert.equal(h.returns, 0, 'the ending must not be skipped while the tab is hidden');
    h.controller.setVisible(true);h.advance(180);h.advance(240);
    assert.equal(h.returns, 1);assert.equal(h.releases, 1);
  } finally {h.controller.dispose();}
});

test('media errors and playback stalls recover under black instead of leaving a permanent lock', async () => {
  for (const failure of ['error', 'rejected', 'loading-stall', 'playing-stall']) {
    const h = setup();
    try {
      if (failure === 'rejected') h.video.results.push(() => Promise.reject(new Error('decoder failed')));
      h.full();
      if (failure === 'playing-stall') h.video.event('playing');
      if (failure === 'error') h.video.event('error');
      await h.promises();h.advance(9000);
      assert.equal(h.returns, 1, failure);
      assert.equal(h.releases, 1, failure);
      assert.equal(h.counter.read(), failure === 'playing-stall' ? 1 : 0);
      assert.equal(h.video.frames.size, 0);
      assert.equal(h.timers.size, 0);
    } finally {h.controller.dispose();}
  }
});

test('page-cache cancellation frees the lock and ignores stale playback promises until a new arrival', async () => {
  for (const started of [false, true]) {
    const h = setup();
    let reject!: (error: Error) => void;
    h.video.results.push(() => new Promise((_resolve, failed) => {reject = failed;}));
    h.full();
    if (started) {h.video.event('playing');await h.promises();}
    h.controller.cancel();
    assert.equal(h.releases, 1);assert.equal(h.returns, 0);
    assert.equal(h.video.frames.size, 0);assert.equal(h.timers.size, 0);
    reject(Object.assign(new Error('old autoplay request'), {name: 'NotAllowedError'}));
    await h.promises();h.full();
    assert.equal(h.video.plays.length, started ? 2 : 1, 'restoring the same cached arrival cannot replay or unmute');
    h.leave();h.full();h.video.event('playing');await h.promises();
    assert.equal(h.video.plays.length, started ? 4 : 3);
    assert.equal(h.counter.read(), started ? 2 : 1);
    h.controller.dispose();
    assert.equal(h.releases, 2);assert.equal(h.timers.size, 0);
  }
});

test('an exhausted budget remains black, including a storage race before the first playing event', async () => {
  const already = setup({count: 2});
  already.full();
  assert.equal(already.video.plays.length, 0);assert.equal(already.locks, 0);
  assert.equal(already.controller.getState(), 'exhausted');already.controller.dispose();

  const h = setup();
  try {
    h.full();h.data.set('moreiragabryel:footer-scene:v1', '2');h.video.event('playing');await h.promises();
    assert.equal(h.controller.getState(), 'exhausted');
    assert.equal(h.video.paused, true);assert.equal(h.releases, 1);
    assert.equal(h.returns, 0, 'after the budget there is no forced return, only the black section');
    assert.equal(h.timers.size, 0);assert.equal(h.video.frames.size, 0);
  } finally {h.controller.dispose();}
});

test('the second arrival plays once, then all following arrivals stay empty and unlocked', async () => {
  const h = setup({count: 1});
  try {
    h.full();h.video.event('playing');await h.promises();h.video.event('ended');h.advance(420);
    assert.equal(h.counter.read(), 2);assert.equal(h.controller.getState(), 'exhausted');
    h.leave();h.full();
    assert.equal(h.video.plays.length, 2);assert.equal(h.locks, 1);assert.equal(h.releases, 1);
  } finally {h.controller.dispose();}
});

test('a native lock or return failure cannot leave the scene in an unhandled permanent blackout', async () => {
  const unavailable=setup({failAcquire:true});
  assert.doesNotThrow(()=>unavailable.full());
  assert.equal(unavailable.video.plays.length,0);assert.equal(unavailable.counter.read(),0);unavailable.controller.dispose();
  const h=setup({failReturn:true});
  try {
    h.full();h.video.event('playing');await h.promises();h.video.event('ended');
    assert.doesNotThrow(()=>h.advance(420));
    assert.equal(h.releases,1);assert.equal(h.controller.getState(),'idle');
    assert.equal(h.timers.size,0);
  } finally {h.controller.dispose();}
});
