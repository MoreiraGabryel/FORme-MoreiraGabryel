import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {IDBFactory} from 'fake-indexeddb';
import {createHarness} from './helpers/technologyHarness.cjs';

const KEY = 'moreiragabryel:footer-scene:v1';
const DATABASE = 'moreiragabryel:footer-scene-admission:v1';
const modulePath = (name: string) => fileURLToPath(new URL(`../src/utils/${name}.ts`, import.meta.url));
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {resolve = done;});
  return {promise, resolve};
};
async function bounded<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Timed out waiting for real admission/transaction event')), 3000);
    })]);
  } finally {clearTimeout(timer);}
}
function storage(initial = 0) {
  let value = String(initial), reads = 0;
  const writes: string[] = [];
  let nextWrite: (() => void) | undefined;
  return {
    getItem(key: string) {assert.equal(key, KEY);reads++;return value;},
    setItem(key: string, next: string) {
      assert.equal(key, KEY);value = next;writes.push(next);
      // A native event cannot interrupt this synchronous commit. Run only at
      // its next microtask checkpoint, before the real IDB completion event.
      const hook = nextWrite;nextWrite = undefined;
      if (hook) queueMicrotask(hook);
    },
    afterNextWrite(callback: () => void) {nextWrite = callback;},
    get count() {return Number(value);}, get reads() {return reads;}, writes,
  };
}
function setup({initial = 0, shared = storage(initial), factory = new IDBFactory()} = {}) {
  const transactions: {status: string; done: Promise<void>}[] = [];
  const enqueued = deferred<void>();
  const indexedDB = {
    open(name: string, version: number) {
      const request = factory.open(name, version);
      request.addEventListener('success', () => {
        const db = request.result, realTransaction = db.transaction.bind(db);
        db.transaction = (...args: Parameters<IDBDatabase['transaction']>) => {
          const tx = realTransaction(...args), ended = deferred<void>();
          const observed = {status: 'pending', done: ended.promise};transactions.push(observed);
          tx.addEventListener('complete', () => {observed.status = 'complete';ended.resolve();});
          tx.addEventListener('abort', () => {observed.status = 'abort';ended.resolve();});
          enqueued.resolve();return tx;
        };
      });
      return request;
    },
  };
  let now = 0, timerId = 0;
  const timers = new Map<number, {at: number; callback: () => void}>();
  const clock = {
    now: () => now,
    set(callback: () => void, delay: number) {const id = ++timerId;timers.set(id, {at: now + delay, callback});return id;},
    clear(id: number) {timers.delete(id);},
  };
  const advance = (ms: number) => {
    const until = now + ms;
    for (let turns = 0; turns < 1000; turns++) {
      const next = [...timers].filter(([, task]) => task.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) {now = until;return;}
      now = next[1].at;timers.delete(next[0]);next[1].callback();
    }
    assert.fail('fake clock did not quiesce');
  };
  class Video extends EventTarget {
    currentTime = 0; muted = false; loop = false; playsInline = false; playbackRate = 1;
    paused = true; plays = 0; loads = 0; frameId = 0;
    frames = new Map<number, unknown>();
    play() {this.paused = false;this.plays++;return Promise.resolve();}
    pause() {this.paused = true;}
    load() {this.loads++;}
    requestVideoFrameCallback(callback: unknown) {const id = ++this.frameId;this.frames.set(id, callback);return id;}
    cancelVideoFrameCallback(id: number) {this.frames.delete(id);}
    event(name: string) {this.dispatchEvent(new Event(name));}
  }
  const video = new Video();
  // Each setup has its own module/VM cache. Only real storage and IDBFactory
  // are shared between contenders; no shared admission promise or queue.
  const host = createHarness({}, {indexedDB, AbortController});
  const {createFooterSceneController} = host.load(modulePath('footerSceneController'));
  const {createFooterVisitCounter} = host.load(modulePath('footerScenePolicy'));
  const realCounter = createFooterVisitCounter(shared);
  const pending: Promise<boolean>[] = [], results: boolean[] = [], states: string[] = [];
  const counter = {...realCounter, consume(...args: [signal?: AbortSignal, onCommitted?: () => void]) {
    const promise = realCounter.consume(...args);pending.push(promise);
    promise.then((result: boolean) => {results.push(result);});return promise;
  }};
  let locks = 0, releases = 0, returns = 0;
  const controller = createFooterSceneController({video, counter, clock,
    acquireLock() {locks++;return {returnToTop() {returns++;}, release() {releases++;}};},
    onState(state: string) {states.push(state);},
  });
  const snapshot = () => ({count: shared.count, writes: [...shared.writes], state: controller.getState(),
    paused: video.paused, plays: video.plays, loads: video.loads, locks, releases, returns,
    frames: video.frames.size, timers: timers.size, admissions: pending.length, results: [...results],
    transactions: transactions.map(tx => tx.status), states: [...states]});
  return {controller, video, shared, states, counter, pending, results, transactions, advance, snapshot,
    enqueued: enqueued.promise,
    full() {controller.checkViewport({top: 0, bottom: 800}, 800);},
    async settle() {
      await bounded(Promise.all(pending));
      await bounded(Promise.all(transactions.map(tx => tx.done)));
      // Drain only promise reactions from the actual counter; no time sleeps.
      await Promise.resolve();
    },
  };
}
function scenario(name: string, expected: object, run: (record: (observed: unknown) => void) => Promise<void>) {
  test(name, {timeout: 10000}, async t => {
    let observed: unknown = null, passed = false;
    try {await run(value => {observed = value;});passed = true;}
    finally {t.diagnostic(`CASE_RESULT ${JSON.stringify({name, expected, observed, status: passed ? 'pass' : 'fail'})}`);}
  });
}
async function holdMutex(factory: IDBFactory) {
  const opened = deferred<IDBDatabase>();
  const request = factory.open(DATABASE, 1);
  request.onupgradeneeded = () => request.result.createObjectStore('mutex');
  request.onsuccess = () => opened.resolve(request.result);
  request.onerror = () => {throw request.error;};
  const db = await bounded(opened.promise);
  const tx = db.transaction('mutex', 'readwrite');
  let held = true;
  const done = deferred<void>();
  tx.addEventListener('complete', () => done.resolve());
  tx.addEventListener('abort', () => done.resolve());
  const requestAgain = () => {
    const get = tx.objectStore('mutex').get('hold');
    get.onsuccess = () => {if (held) requestAgain();};
  };
  requestAgain();
  return {async release() {held = false;await bounded(done.promise);db.close();}};
}
const playback = (h: ReturnType<typeof setup>) => ({count: h.shared.count, writes: h.shared.writes.length,
  state: h.controller.getState(), paused: h.video.paused, admissions: h.pending.length,
  locks: h.snapshot().locks, releases: h.snapshot().releases});

for (const initial of [0, 1]) scenario(`normal admission initial${initial}`, {
  count: initial + 1, writes: 1, state: 'playing', paused: false, admissions: 1, locks: 1, releases: 0,
}, async record => {
  const h = setup({initial});
  try {
    h.full();assert.equal(h.shared.count, initial);h.video.event('playing');
    assert.equal(h.controller.getState(), 'loading');assert.equal(h.video.paused, true);
    await h.settle();record(h.snapshot());
    assert.deepEqual(playback(h), {count: initial + 1, writes: 1, state: 'playing', paused: false, admissions: 1, locks: 1, releases: 0});
  } finally {h.controller.dispose();}
});

for (const initial of [0, 1]) scenario(`duplicate playing AFTER persistent commit BEFORE settlement initial${initial} waits for admission`, {
  count: initial + 1, writes: 1, state: 'playing', paused: false, admissions: 1,
}, async record => {
  const h = setup({initial}), boundary = deferred<void>();
  let beforeDuplicate: ReturnType<typeof h.snapshot>, afterDuplicate: ReturnType<typeof h.snapshot>;
  try {
    h.shared.afterNextWrite(() => {
      beforeDuplicate = h.snapshot();
      // Deterministic injected notification after synchronous ownership acknowledgment.
      h.video.event('playing');afterDuplicate = h.snapshot();boundary.resolve();
    });
    h.full();h.video.event('playing');await bounded(boundary.promise);await h.settle();
    record({beforeDuplicate: beforeDuplicate!, afterDuplicate: afterDuplicate!, final: h.snapshot()});
    assert.equal(beforeDuplicate!.count, initial + 1);
    assert.deepEqual(beforeDuplicate!.transactions, ['pending']);
    assert.deepEqual(beforeDuplicate!.results, []);
    assert.equal(beforeDuplicate!.state, 'loading');assert.equal(beforeDuplicate!.paused, true);
    assert.equal(afterDuplicate!.state, 'loading', 'pending admission must take precedence over committed ownership');
    assert.equal(afterDuplicate!.paused, true);assert.equal(afterDuplicate!.frames, 0);
    assert.equal(afterDuplicate!.plays, 1);assert.equal(afterDuplicate!.admissions, 1);
    assert.deepEqual(afterDuplicate!.transactions, ['pending']);assert.deepEqual(afterDuplicate!.results, []);
    assert.deepEqual(playback(h), {count: initial + 1, writes: 1, state: 'playing', paused: false, admissions: 1, locks: 1, releases: 0});
    assert.equal(h.video.plays, 2);assert.equal(h.video.frames.size, 1);
    assert.deepEqual(h.results, [true]);assert.deepEqual(h.snapshot().transactions, ['complete']);
  } finally {h.controller.dispose();}
});

for (const initial of [0, 1]) scenario(`duplicate playing AFTER denied-storage memory commit BEFORE settlement initial${initial} waits for admission`, {
  count: initial + 1, persistentCount: initial, writes: 0, state: 'playing', paused: false, admissions: 1,
}, async record => {
  const h = setup({initial});
  try {
    h.full();assert.equal(h.counter.read(), initial);
    h.shared.getItem = () => {throw new Error('Injected storage access denial');};
    h.video.event('playing');
    const beforeDuplicate = h.snapshot(), committedCount = h.counter.read();
    // No await: both notifications precede reactions to the real consume promise.
    h.video.event('playing');const afterDuplicate = h.snapshot();
    await h.settle();
    record({committedCount, beforeDuplicate, afterDuplicate, final: h.snapshot(), finalCount: h.counter.read()});
    assert.equal(committedCount, initial + 1, 'memory fallback preserves and charges the last successful read');
    assert.equal(beforeDuplicate.state, 'loading');assert.equal(beforeDuplicate.paused, true);
    assert.deepEqual(beforeDuplicate.results, []);assert.deepEqual(beforeDuplicate.transactions, []);
    assert.equal(afterDuplicate.state, 'loading', 'pending memory admission must take precedence over committed ownership');
    assert.equal(afterDuplicate.paused, true);assert.equal(afterDuplicate.frames, 0);
    assert.equal(afterDuplicate.plays, 1);assert.equal(afterDuplicate.admissions, 1);
    assert.deepEqual(afterDuplicate.results, []);
    assert.equal(h.counter.read(), initial + 1, 'duplicate notification must not spend another memory slot');
    assert.deepEqual(playback(h), {count: initial, writes: 0, state: 'playing', paused: false, admissions: 1, locks: 1, releases: 0});
    assert.equal(h.video.plays, 2);assert.equal(h.video.frames.size, 1);
    assert.deepEqual(h.results, [true]);assert.deepEqual(h.snapshot().transactions, []);
  } finally {h.controller.dispose();}
});

for (const initial of [0, 1]) scenario(`hidden microtask AFTER persistent commit initial${initial} resumes same execution`, {
  count: initial + 1, writes: 1, state: 'playing', paused: false, locks: 1, releases: 0,
}, async record => {
  const h = setup({initial});const boundary = deferred<void>();let atBoundary: unknown;
  try {
    h.shared.afterNextWrite(() => {
      atBoundary = h.snapshot();h.controller.setVisible(false);boundary.resolve();
    });
    h.full();h.video.event('playing');await bounded(boundary.promise);await h.settle();
    const hidden = h.snapshot();
    assert.equal(hidden.count, initial + 1);assert.equal(hidden.paused, true);
    assert.equal(hidden.releases, 0);assert.deepEqual(hidden.transactions, ['abort']);
    h.controller.setVisible(true);h.video.event('playing');await h.settle();
    const resumed = h.snapshot();record({atBoundary, hidden, resumed});
    assert.deepEqual({count: resumed.count, writes: resumed.writes.length, state: resumed.state,
      paused: resumed.paused, locks: resumed.locks, releases: resumed.releases},
    {count: initial + 1, writes: 1, state: 'playing', paused: false, locks: 1, releases: 0},
    'a committed execution owns its slot across visibility changes');
  } finally {h.controller.dispose();}
});

scenario('postcommit hide then show before settlement keeps synchronous ownership without stale UI', {
  count: 1, writes: 1, admissions: 1, state: 'playing', paused: false,
}, async record => {
  const h = setup(), boundary = deferred<void>();let beforeSettlement: ReturnType<typeof h.snapshot>;
  try {
    h.shared.afterNextWrite(() => {
      const committed = h.snapshot();
      assert.equal(committed.state, 'loading', 'commit acknowledgment alone must not publish playing');
      assert.equal(committed.paused, true, 'commit acknowledgment alone must not play');
      h.controller.setVisible(false);h.controller.setVisible(true);h.video.event('playing');
      beforeSettlement = h.snapshot();boundary.resolve();
    });
    h.full();h.video.event('playing');await bounded(boundary.promise);await h.settle();
    record({beforeSettlement: beforeSettlement!, final: h.snapshot()});
    assert.deepEqual(beforeSettlement!.results, [], 'show/playing must precede asynchronous admission settlement');
    assert.deepEqual(beforeSettlement!.transactions, ['pending']);
    assert.deepEqual(playback(h), {count: 1, writes: 1, admissions: 1, state: 'playing', paused: false, locks: 1, releases: 0});
    assert.deepEqual(h.results, [true], 'the real postcommit abort retains its accepted result');
    assert.deepEqual(h.snapshot().transactions, ['abort']);
  } finally {h.controller.dispose();}
});

scenario('hidden BEFORE real queued commit never executes critical section', {
  beforeRelease: {count: 0, writes: 0, state: 'loading', paused: true}, resumed: 'playing', finalCount: 1,
}, async record => {
  const factory = new IDBFactory(), blocker = await holdMutex(factory), h = setup({factory});
  try {
    h.full();h.video.event('playing');await bounded(h.enqueued);
    assert.equal(h.shared.count, 0);assert.deepEqual(h.transactions.map(tx => tx.status), ['pending']);
    const reads = h.shared.reads;
    h.controller.setVisible(false);await h.settle();await blocker.release();
    const hidden = h.snapshot();record({hidden, readsBeforeAbort: reads, readsAfterAbort: h.shared.reads});
    assert.equal(h.shared.reads, reads, 'the canceled queued commit must never perform its storage read');
    assert.equal(hidden.count, 0);assert.deepEqual(hidden.writes, []);assert.equal(hidden.paused, true);
    assert.equal(hidden.state, 'loading');assert.equal(hidden.releases, 0);assert.equal(hidden.frames, 0);
    h.controller.setVisible(true);h.video.event('playing');await h.settle();
    record({hidden, resumed: h.snapshot()});
    assert.deepEqual(playback(h), {count: 1, writes: 1, state: 'playing', paused: false, admissions: 2, locks: 1, releases: 0});
  } finally {await blocker.release();h.controller.dispose();}
});

scenario('hide AFTER completed admission resumes without another consume', {
  count: 1, writes: 1, state: 'playing', paused: false, admissions: 1, locks: 1, releases: 0,
}, async record => {
  const h = setup();
  try {
    h.full();h.video.event('playing');await h.settle();
    assert.deepEqual(h.transactions.map(tx => tx.status), ['complete']);
    h.controller.setVisible(false);assert.equal(h.video.paused, true);assert.equal(h.video.frames.size, 0);
    h.advance(60000);assert.equal(h.controller.getState(), 'playing');
    h.controller.setVisible(true);h.video.event('playing');await h.settle();record(h.snapshot());
    assert.deepEqual(playback(h), {count: 1, writes: 1, state: 'playing', paused: false, admissions: 1, locks: 1, releases: 0});
  } finally {h.controller.dispose();}
});

scenario('repeated hide resume after committed race never double charges same execution', {
  count: 1, writes: 1, state: 'playing', paused: false, locks: 1, releases: 0,
}, async record => {
  const h = setup(), boundary = deferred<void>();const cycles: unknown[] = [];
  try {
    h.shared.afterNextWrite(() => {h.controller.setVisible(false);boundary.resolve();});
    h.full();h.video.event('playing');await bounded(boundary.promise);await h.settle();
    for (let i = 0; i < 3; i++) {
      h.controller.setVisible(true);h.video.event('playing');await h.settle();cycles.push(h.snapshot());
      h.controller.setVisible(false);assert.equal(h.video.paused, true);assert.equal(h.video.frames.size, 0);
    }
    h.controller.setVisible(true);h.video.event('playing');await h.settle();record({cycles, final: h.snapshot()});
    const s = h.snapshot();assert.deepEqual({count: s.count, writes: s.writes.length, state: s.state, paused: s.paused,
      locks: s.locks, releases: s.releases}, {count: 1, writes: 1, state: 'playing', paused: false, locks: 1, releases: 0});
  } finally {h.controller.dispose();}
});

for (const action of ['cancel', 'dispose'] as const) scenario(`${action} AFTER persistent commit cannot restart from stale admission`, {
  count: 1, writes: 1, paused: true, locks: 1, releases: 1, returns: 0,
  state: action === 'cancel' ? 'idle' : 'disposed', noStalePlay: true, noStaleState: true,
}, async record => {
  const h = setup(), boundary = deferred<void>();let stopped: ReturnType<typeof h.snapshot>;
  try {
    h.shared.afterNextWrite(() => {h.controller[action]();stopped = h.snapshot();boundary.resolve();});
    h.full();h.video.event('playing');await bounded(boundary.promise);await h.settle();
    h.controller.setVisible(false);h.controller.setVisible(true);h.video.event('playing');h.full();h.advance(60000);
    await h.settle();const final = h.snapshot();record({stopped: stopped!, final});
    assert.equal(final.count, 1);assert.equal(final.writes.length, 1);assert.equal(final.state, action === 'cancel' ? 'idle' : 'disposed');
    assert.equal(final.paused, true);assert.equal(final.locks, 1);assert.equal(final.releases, 1);
    assert.equal(final.returns, 0);assert.equal(final.frames, 0);assert.equal(final.timers, 0);
    assert.equal(final.plays, stopped!.plays, 'stale admission must not restart video');
    assert.deepEqual(final.states, stopped!.states, 'stale admission must not transition UI');
    assert.deepEqual(final.transactions, ['abort']);
  } finally {h.controller.dispose();}
});

scenario('independent VM contexts contending for LAST slot admit exactly one scene', {
  count: 2, writes: 1, admitted: 1, denied: 1, admittedPlaying: true, deniedPausedAndReleased: true,
}, async record => {
  const factory = new IDBFactory(), shared = storage(1);
  const a = setup({factory, shared}), b = setup({factory, shared});
  try {
    a.full();b.full();a.video.event('playing');b.video.event('playing');
    assert.equal(a.video.paused, true);assert.equal(b.video.paused, true);
    await Promise.all([a.settle(), b.settle()]);record({a: a.snapshot(), b: b.snapshot()});
    const admitted = [a, b].filter(h => h.controller.getState() === 'playing');
    const denied = [a, b].filter(h => h.controller.getState() === 'exhausted');
    assert.equal(shared.count, 2);assert.deepEqual(shared.writes, ['2']);
    assert.equal(admitted.length, 1);assert.equal(denied.length, 1);
    assert.equal(admitted[0].video.paused, false);assert.equal(admitted[0].snapshot().releases, 0);
    assert.equal(denied[0].video.paused, true);assert.equal(denied[0].snapshot().releases, 1);
    assert.equal(denied[0].video.frames.size, 0);assert.equal(denied[0].snapshot().timers, 0);
  } finally {a.controller.dispose();b.controller.dispose();}
});

scenario('duplicate playing notifications during REAL queued admission consume once', {
  count: 1, writes: 1, state: 'playing', paused: false, admissions: 1, locks: 1, releases: 0,
}, async record => {
  const factory = new IDBFactory(), blocker = await holdMutex(factory), h = setup({factory});
  try {
    h.full();h.video.event('playing');await bounded(h.enqueued);
    for (let i = 0; i < 5; i++) h.video.event('playing');
    const queued = h.snapshot();
    assert.equal(queued.count, 0);assert.equal(queued.admissions, 1);assert.equal(queued.state, 'loading');assert.equal(queued.paused, true);
    await blocker.release();await h.settle();h.video.event('playing');await h.settle();record({queued, completed: h.snapshot()});
    assert.deepEqual(playback(h), {count: 1, writes: 1, state: 'playing', paused: false, admissions: 1, locks: 1, releases: 0});
  } finally {await blocker.release();h.controller.dispose();}
});

scenario('buffering without actual playing consumes zero budget', {
  count: 0, writes: 0, admissions: 0, stateWhileBuffering: 'loading', canceledPaused: true, released: 1,
}, async record => {
  const h = setup();
  try {
    h.full();h.video.event('waiting');h.video.event('stalled');h.advance(2000);await h.settle();
    const buffering = h.snapshot();
    assert.equal(buffering.state, 'loading');assert.equal(buffering.count, 0);assert.equal(buffering.admissions, 0);
    h.controller.cancel();const canceled = h.snapshot();record({buffering, canceled});
    assert.equal(canceled.count, 0);assert.deepEqual(canceled.writes, []);assert.equal(canceled.paused, true);
    assert.equal(canceled.releases, 1);assert.equal(canceled.timers, 0);assert.equal(canceled.returns, 0);
  } finally {h.controller.dispose();}
});

scenario('normal completion blackouts returns once reveals and releases without repeated loading', {
  states: ['loading', 'playing', 'blackout', 'revealing', 'idle'], count: 1, writes: 1,
  returns: 1, releases: 1, loadingTransitions: 1, loads: 0, noReplayOnSameArrival: true,
}, async record => {
  const h = setup();
  try {
    h.full();h.video.event('playing');await h.settle();h.video.event('ended');
    assert.equal(h.controller.getState(), 'blackout');assert.equal(h.video.paused, true);
    assert.equal(h.snapshot().returns, 0);assert.equal(h.snapshot().releases, 0);
    h.advance(179);assert.equal(h.controller.getState(), 'blackout');
    h.advance(1);assert.equal(h.controller.getState(), 'revealing');
    assert.equal(h.snapshot().returns, 1);assert.equal(h.snapshot().releases, 0);
    h.advance(240);const plays = h.video.plays;h.full();h.video.event('ended');h.advance(60000);await h.settle();
    const final = h.snapshot();record(final);
    assert.deepEqual(final.states, ['loading', 'playing', 'blackout', 'revealing', 'idle']);
    assert.equal(final.returns, 1);assert.equal(final.releases, 1);assert.equal(final.count, 1);assert.equal(final.writes.length, 1);
    assert.equal(final.loads, 0);assert.equal(final.plays, plays);assert.equal(final.timers, 0);assert.equal(final.frames, 0);
  } finally {h.controller.dispose();}
});

scenario('committed hidden execution retains ownership after independent tab consumes remaining slot', {
  count: 2, writes: ['1', '2'], a: {state: 'playing', paused: false, releases: 0},
  b: {state: 'playing', paused: false, releases: 0}, noRollback: true,
}, async record => {
  const shared = storage(), factory = new IDBFactory();
  const a = setup({shared, factory}), b = setup({shared, factory}), boundary = deferred<void>();
  try {
    shared.afterNextWrite(() => {a.controller.setVisible(false);boundary.resolve();});
    a.full();a.video.event('playing');await bounded(boundary.promise);await a.settle();
    b.full();b.video.event('playing');await b.settle();
    assert.equal(shared.count, 2);assert.equal(b.controller.getState(), 'playing');
    a.controller.setVisible(true);a.video.event('playing');await a.settle();
    record({a: a.snapshot(), b: b.snapshot()});
    assert.deepEqual(shared.writes, ['1', '2'], 'committed usage must not be rolled back after another tab proceeds');
    const scene = (h: typeof a) => ({state: h.controller.getState(), paused: h.video.paused, releases: h.snapshot().releases});
    assert.deepEqual({a: scene(a), b: scene(b)}, {a: {state: 'playing', paused: false, releases: 0}, b: {state: 'playing', paused: false, releases: 0}});
  } finally {a.controller.dispose();b.controller.dispose();}
});
