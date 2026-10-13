import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness} from './helpers/technologyHarness.cjs';

function setup() {
  const frames: Array<() => void> = [];
  const calls: string[] = [];
  const harness = createHarness({
    'gsap/ScrollTrigger': {ScrollTrigger: {
      sort() { calls.push('sort'); },
      refresh() { calls.push('refresh'); },
    }},
  }, {window: {
    requestAnimationFrame(callback: () => void) { frames.push(callback); return frames.length; },
    dispatchEvent(event: Event) { calls.push(event.type); },
  }, Event});
  let module;
  try {
    module = harness.load(fileURLToPath(new URL('../src/utils/sceneRefresh.ts', import.meta.url)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  assert.equal(typeof module?.requestSceneRefresh, 'function', 'scene pin lifecycle needs an ordered, deferred refresh');
  return {request: module.requestSceneRefresh, frames, calls};
}

test('recalculates pins in page order after the mount/rebuild batch, then updates scene consumers', () => {
  const host = setup();
  host.request();
  host.request();
  host.request();
  assert.deepEqual(host.calls, [], 'never measure while sibling pins are still being rebuilt');
  assert.equal(host.frames.length, 1, 'one global refresh per layout batch');
  host.frames.shift()!();
  assert.deepEqual(host.calls, ['sort', 'refresh', 'scroll']);
  host.request();
  assert.equal(host.frames.length, 1, 'later phrase/locale rebuild must refresh again');
  host.frames.shift()!();
  assert.deepEqual(host.calls, ['sort', 'refresh', 'scroll', 'sort', 'refresh', 'scroll']);
});
