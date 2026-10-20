import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness} from './helpers/technologyHarness.cjs';

class Video extends EventTarget {
  duration = 124 / 24;
  readyState = 2;
  videoWidth = 1280;
  videoHeight = 720;
  paused = true;
  seeking = false;
  position = 0;
  writes: number[] = [];
  frames = new Map<number, (now: number, metadata: {mediaTime: number}) => void>();
  nextFrame = 0;
  plays = 0;
  pauses = 0;
  playResult: Promise<void> | undefined;
  primeAdvance = 0;
  get currentTime() {return this.position;}
  set currentTime(time: number) {this.position = time;this.seeking = true;this.writes.push(time);}
  play() {this.plays++;this.paused = false;this.position += this.primeAdvance;return this.playResult ?? Promise.resolve();}
  pause() {this.pauses++;this.paused = true;}
  requestVideoFrameCallback(callback: (now: number, metadata: {mediaTime: number}) => void) {
    const id = ++this.nextFrame;this.frames.set(id, callback);return id;
  }
  cancelVideoFrameCallback(id: number) {this.frames.delete(id);}
  seeked() {this.seeking = false;this.dispatchEvent(new Event('seeked'));}
  present(time = Math.floor(this.position * 24 + 0.000001) / 24) {
    const callbacks = [...this.frames.values()];this.frames.clear();
    callbacks.forEach(callback => callback(0, {mediaTime: time}));
  }
}

const microtasks = async () => {await Promise.resolve();await Promise.resolve();await Promise.resolve();};

function createPhasedHarness(globals: Record<string, unknown>) {
  type Phase = 'layout' | 'passive';
  type Effect = {index: number; setup: () => void | (() => void); deps?: readonly unknown[]};
  let cursor = 0;
  const slots: Array<{value?: unknown; deps?: readonly unknown[]; cleanup?: void | (() => void)}> = [];
  const queues: Record<Phase, Effect[]> = {layout: [], passive: []};
  const effect = (phase: Phase, setup: Effect['setup'], deps?: readonly unknown[]) => {
    const index = cursor++;
    const previous = slots[index]?.deps;
    if (!previous || !deps || previous.length !== deps.length || deps.some((value, i) => !Object.is(value, previous[i]))) {
      queues[phase].push({index, setup, deps});
    }
  };
  const flush = (phase: Phase) => {
    const pending = queues[phase];queues[phase] = [];
    pending.forEach(({index}) => slots[index]?.cleanup?.());
    pending.forEach(({index, setup, deps}) => {slots[index] = {deps, cleanup: setup()};});
  };
  const host = createHarness({react: {
    useRef<T>(value: T) {
      const index = cursor++;
      slots[index] ??= {value: {current: value}};
      return slots[index].value as {current: T};
    },
    useLayoutEffect: (setup: Effect['setup'], deps?: readonly unknown[]) => effect('layout', setup, deps),
    useEffect: (setup: Effect['setup'], deps?: readonly unknown[]) => effect('passive', setup, deps),
  }}, globals);
  return {
    load: host.load,
    render(component: () => void) {cursor = 0;return host.render(component);},
    layout() {flush('layout');},
    passive() {flush('passive');},
    flush() {flush('layout');flush('passive');},
    dispose() {slots.forEach(slot => slot?.cleanup?.());},
  };
}

function scrub({tracked = true, fallback = false, progress = 0.1, enabled = true, pendingPrime = false, primeAdvance = 0} = {}) {
  const rafs = new Map<number, () => void>();let nextRaf = 0;
  const document = Object.assign(new EventTarget(), {hidden: false});
  const video = new Video();
  video.primeAdvance = primeAdvance;
  if (fallback) Object.defineProperty(video, 'requestVideoFrameCallback', {value: undefined});
  let resolvePrime: (() => void) | undefined;
  if (pendingPrime) video.playResult = new Promise<void>(resolve => {resolvePrime = resolve;});
  const host = createPhasedHarness({document, window: {
    requestAnimationFrame(callback: () => void) {const id = ++nextRaf;rafs.set(id, callback);return id;},
    cancelAnimationFrame(id: number) {rafs.delete(id);},
  }});
  const {useScrubbedVideo} = host.load(fileURLToPath(new URL('../src/hooks/useScrubbedVideo.ts', import.meta.url)));
  const ref = {current: video};const reported: Array<number | null> = [];
  const options = {enabled, ...(tracked ? {maxSeekStep: 2 / 24, onPresented: (value: number | null) => reported.push(value)} : {})};
  const render = (passive = true) => {host.render(() => useScrubbedVideo(ref, progress, options));host.layout();if (passive) host.passive();};
  render();
  return {video, rafs, document, reported, resolvePrime,
    update(next: number, active = options.enabled) {progress = next;options.enabled = active;render();},
    desktop() {delete options.maxSeekStep;delete options.onPresented;render();},
    mobileLayout(next: number) {progress = next;options.maxSeekStep = 2 / 24;options.onPresented = value => reported.push(value);render(false);},
    passive() {host.passive();},
    frame() {const callbacks = [...rafs.values()];rafs.clear();callbacks.forEach(callback => callback());},
    dispose() {host.dispose();},
  };
}

function numbers(host) {return host.reported.filter(value => typeof value === 'number');}

for (const resume of ['initial', 'visibility', 'enabled']) {
  for (const primeAdvance of [0.001, 0.02, 0.03, 1 / 24 - 0.000001]) {
    test(`off-grid ${resume} priming by ${primeAdvance}s acknowledges containing 24fps frames without stalling`, async () => {
      const h = scrub({progress: 1, primeAdvance: resume === 'initial' ? primeAdvance : 0});
      try {
        await microtasks();
        let cursor = primeAdvance;
        let target = 1;
        if (resume !== 'initial') {
          h.video.seeked();h.video.present();
          assert.equal(numbers(h).length, 1);
          cursor = h.video.currentTime + primeAdvance;
          h.video.primeAdvance = primeAdvance;
          target = 0;
          if (resume === 'visibility') {
            h.document.hidden = true;h.document.dispatchEvent(new Event('visibilitychange'));
            h.update(target);
            h.document.hidden = false;h.document.dispatchEvent(new Event('visibilitychange'));
          } else {
            h.update(target, false);h.update(target, true);
          }
          await microtasks();
        }
        assert.equal(h.video.paused, true, 'priming must pause before seeking');
        for (const destination of [target, 1 - target]) {
          h.update(destination);
          for (let frame = 0; frame < 100 && numbers(h).at(-1) !== destination; frame++) {
            const requested = h.video.currentTime;
            assert.ok(Math.abs(requested - cursor) <= 2 / 24 + 0.000001, 'seek must remain bounded from the actual cursor');
            const mediaTime = Math.floor(requested * 24 + 0.000001) / 24;
            assert.ok(Math.abs(Math.round(mediaTime * 24) - Math.floor(cursor * 24 + 0.000001)) <= 2,
              'presentation must not skip more than two source frames');
            const before = numbers(h).length;
            assert.ok((mediaTime - Math.floor(cursor * 24 + 0.000001) / 24) * (destination === 1 ? 1 : -1) >= -0.000001,
              'presented source frames must retain the requested direction');
            h.video.seeked();h.video.present(mediaTime + 1 / 24);
            assert.equal(numbers(h).length, before, 'an adjacent non-containing frame must not acknowledge the seek');
            h.video.present();
            assert.equal(numbers(h).length, before + 1,
              `containing frame ${mediaTime}s must acknowledge request ${requested}s after ${resume} priming`);
            const writes = h.video.writes.length;
            h.update(destination);h.video.dispatchEvent(new Event('loadeddata'));h.video.seeked();
            assert.equal(h.video.writes.length, writes, 'acknowledged frame must still wait for RAF');
            cursor = mediaTime;
            h.frame();
          }
          assert.equal(numbers(h).at(-1), destination, 'frame acknowledgments must converge in either direction');
          assert.equal(Math.floor(h.video.currentTime * 24 + 0.000001), destination * 123,
            'terminal presentation must be the opening or guarded final source frame');
          assert.ok(h.video.writes.every(time => time >= 0 && time <= h.video.duration - 1 / 24 + 0.000001),
            'all seeks must retain the one-frame endpoint guard');
        }
      } finally {h.dispose();}
    });
  }
}

test('mobile seeks advance by at most two source frames and only after matching frame acknowledgment', async () => {
  const h = scrub();
  try {
    await microtasks();
    assert.ok(h.video.writes.length > 0);
    assert.ok(h.video.writes[0] <= 2 / 24 + 0.000001, 'first mobile seek must not jump directly to the latest scroll target');
    h.update(1);
    h.video.seeked();
    const before = h.video.writes.length;
    h.frame();assert.equal(h.video.writes.length, before, 'seeked alone is not presentation when rVFC exists');
    h.video.present(h.video.currentTime + 0.5);
    assert.equal(numbers(h).length, 0, 'an unrelated queued video frame must not unlock the cursor');
    h.video.present();
    assert.equal(numbers(h).length, 1);
    assert.equal(h.video.writes.length, before, 'do not replace the frame again before a render turn');
    h.frame();
    assert.ok(h.video.writes.at(-1) - h.video.writes.at(-2) <= 2 / 24 + 0.000001);
    for (let step = 0; step < 100 && numbers(h).at(-1) < 0.999; step++) {
      h.video.seeked();h.video.present();h.frame();
    }
    assert.ok(numbers(h).at(-1) >= 0.999, 'bounded seeks must eventually reach the actual terminal frame');
    assert.ok(h.video.writes.every((value, index, values) => !index || value - values[index - 1] <= 2 / 24 + 0.000001));
  } finally {h.dispose();}
});

for (const fallback of [true, false]) {
  test(`mobile presentation coalesces progress and media events until RAF (${fallback ? 'seeked fallback' : 'video frame callback'})`, async () => {
    const h = scrub({fallback, progress: 1});
    try {
      await microtasks();
      assert.equal(h.video.writes.length, 1);
      h.video.seeked();
      if (!fallback) h.video.present();
      assert.equal(numbers(h).length, 1, 'a decoded frame must be acknowledged before exercising the paint barrier');
      assert.equal(h.rafs.size, 1);
      const writes = h.video.writes.length;
      for (const progress of [0.9, 0.7, 0]) {
        h.update(progress);
        h.video.dispatchEvent(new Event('loadedmetadata'));
        h.video.dispatchEvent(new Event('loadeddata'));
        h.video.seeked();
        assert.equal(h.video.writes.length, writes, 'progress and media events must not replace an acknowledged frame before RAF');
        assert.equal(h.rafs.size, 1, 'events must coalesce behind the existing paint barrier');
        assert.equal(h.video.frames.size, 0, 'do not arm another decoder request before the frame can paint');
      }
      h.frame();
      assert.equal(h.video.writes.length, writes + 1);
      assert.equal(h.video.currentTime, 0, 'the next bounded seek must use the latest coalesced target');
      assert.ok(Math.abs(h.video.writes.at(-1)! - h.video.writes.at(-2)!) <= 2 / 24 + 0.000001);
    } finally {h.dispose();}
  });
}

test('mobile fallback acknowledges decoded seeked frames, supports reverse and preserves endpoint guard', async () => {
  const h = scrub({fallback: true, progress: 1});
  try {
    await microtasks();
    for (let step = 0; step < 100 && numbers(h).at(-1) !== 1; step++) {h.video.seeked();h.frame();}
    assert.equal(numbers(h).at(-1), 1);
    assert.ok(Math.abs(h.video.currentTime - (h.video.duration - 1 / 24)) < 0.000001);
    h.update(0);
    for (let step = 0; step < 100 && numbers(h).at(-1) !== 0; step++) {h.video.seeked();h.frame();}
    assert.equal(numbers(h).at(-1), 0);
    assert.equal(h.video.currentTime, 0);
  } finally {h.dispose();}
});

test('disabling mobile preparation pauses immediately and stale prime settlement cannot seek', async () => {
  const h = scrub({pendingPrime: true});
  try {
    h.update(1, false);
    assert.equal(h.video.paused, true);
    const before = h.video.writes.length;
    h.resolvePrime();await microtasks();h.frame();
    assert.equal(h.video.writes.length, before);
    assert.equal(h.video.frames.size, 0);
    assert.equal(h.rafs.size, 0);
  } finally {h.dispose();}
});

test('disposed or hidden mobile playback cannot publish frames or retain callbacks', async () => {
  const h = scrub();
  await microtasks();
  h.video.seeked();
  const pending = [...h.video.frames.values()];
  assert.ok(pending.length > 0, 'the interrupted presentation path must actually be armed');
  const before = numbers(h).length;
  h.document.hidden = true;
  h.video.present();assert.equal(numbers(h).length, before);
  h.dispose();
  const writes = h.video.writes.length;
  pending.forEach(callback => callback(0, {mediaTime: h.video.currentTime}));
  h.frame();await microtasks();
  assert.equal(h.video.writes.length, writes);
  assert.equal(h.video.paused, true);
  assert.equal(h.video.frames.size, 0);
  assert.equal(h.rafs.size, 0);
});

test('visibility invalidates pending frames and resumes without a React permission round trip', async () => {
  const h = scrub({progress: 1});
  try {
    await microtasks();h.video.seeked();
    const stale = [...h.video.frames.values()];
    assert.ok(stale.length > 0);
    h.document.hidden = true;h.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(h.reported.at(-1), null);
    assert.equal(h.video.frames.size, 0);
    h.document.hidden = false;h.document.dispatchEvent(new Event('visibilitychange'));
    await microtasks();
    assert.ok(h.video.frames.size > 0, 'resume must arm a fresh matching-frame barrier');
    stale.forEach(callback => callback(0, {mediaTime: h.video.currentTime}));
    h.dispose();
    assert.equal(h.video.frames.size, 0, 'a retired callback must not erase ownership of its replacement');
  } finally {h.dispose();}
});

test('desktop keeps the original latest-target seek coalescing without presentation tracking', async () => {
  const h = scrub({tracked: false});
  try {
    await microtasks();
    assert.ok(Math.abs(h.video.writes[0] - 0.1 * (h.video.duration - 1 / 24)) < 0.000001);
    h.update(1);h.video.seeked();
    assert.ok(Math.abs(h.video.writes.at(-1) - (h.video.duration - 1 / 24)) < 0.000001);
    assert.equal(h.video.frames.size, 0);
    assert.equal(h.rafs.size, 0);
  } finally {h.dispose();}
});

test('desktop owner retires at mobile layout handoff before passive cleanup or prime settlement', async () => {
  const h = scrub({tracked: false, pendingPrime: true});
  try {
    assert.equal(h.video.plays, 1, 'desktop decoder priming must actually be pending');
    h.video.seeked();
    const desktopPosition = h.video.currentTime;
    let resolveMobile!: () => void;
    h.video.playResult = new Promise<void>(resolve => {resolveMobile = resolve;});
    h.mobileLayout(1);
    assert.equal(h.video.plays, 2, 'replacement mobile owner must be priming before desktop passive cleanup');
    const before = {writes: h.video.writes.length, pauses: h.video.pauses};
    h.resolvePrime!();await microtasks();
    assert.deepEqual({writes: h.video.writes.length, pauses: h.video.pauses}, before,
      'retired desktop prime settlement must neither pause nor seek the mobile owner during the layout/passive gap');
    h.video.dispatchEvent(new Event('loadedmetadata'));
    h.video.dispatchEvent(new Event('loadeddata'));
    h.video.seeked();
    assert.deepEqual({writes: h.video.writes.length, pauses: h.video.pauses}, before,
      'retired desktop media listeners must also stop mutating immediately at layout handoff');
    resolveMobile();await microtasks();
    assert.equal(h.video.writes.length, before.writes + 1);
    assert.ok(h.video.currentTime > desktopPosition);
    assert.ok(h.video.currentTime - desktopPosition <= 2 / 24 + 0.000001);
    const callbacks = [...h.video.frames.values()];
    assert.equal(callbacks.length, 1);
    h.passive();
    assert.ok([...h.video.frames.values()][0] === callbacks[0], 'retired passive cleanup must preserve the mobile callback handle');
    h.video.seeked();h.video.present();
    assert.equal(numbers(h).length, 1);
    h.frame();
    assert.equal(h.video.writes.length, before.writes + 2, 'replacement must continue after old passive cleanup');
    assert.ok(h.video.writes.at(-1)! - h.video.writes.at(-2)! <= 2 / 24 + 0.000001);
  } finally {h.dispose();}
});

test('switching from mobile to desktop uses the latest scroll target, not the initial hook value', async () => {
  const h = scrub();
  try {
    await microtasks();h.update(1);h.video.seeked();
    const before = h.video.writes.length;
    h.desktop();await microtasks();
    assert.ok(Math.abs(h.video.writes[before] - (h.video.duration - 1 / 24)) < 0.000001,
      'breakpoint handoff must not first seek backwards to the initial scroll target');
    assert.equal(h.video.frames.size, 0);
  } finally {h.dispose();}
});

test('mobile ambient preparation acknowledges opening data and invalidates it before reverse seeking', async () => {
  const video = new Video();video.readyState = 1;
  const host = createHarness();
  const {useAmbientVideo} = host.load(fileURLToPath(new URL('../src/hooks/useAmbientVideo.ts', import.meta.url)));
  const ready: boolean[] = [];
  const ref = {current: video};const options = {active: false, prepare: true, onReady: (value: boolean) => ready.push(value)};
  const render = () => {host.render(() => useAmbientVideo(ref, options));host.flush();};
  try {
    render();assert.notEqual(ready.at(-1), true);
    video.readyState = 2;video.dispatchEvent(new Event('loadeddata'));
    assert.equal(ready.at(-1), true);
    options.active = true;render();await microtasks();
    video.position = 1.25;
    options.active = false;render();
    assert.equal(ready.at(-1), false, 'do not crossfade an old ambient frame while its opening seek is pending');
    video.seeked();assert.equal(ready.at(-1), true);
    options.prepare = false;render();assert.equal(ready.at(-1), false);
  } finally {host.dispose();}
});
