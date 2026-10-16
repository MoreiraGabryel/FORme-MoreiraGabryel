import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {IDBFactory} from 'fake-indexeddb';
import {createHarness} from './helpers/technologyHarness.cjs';

async function policy() {
  return createHarness({}, {indexedDB: new IDBFactory()})
    .load(fileURLToPath(new URL('../src/utils/footerScenePolicy.ts', import.meta.url)));
}

for (const throws of [false, true]) {
  test(`persistent admission acknowledges once before settlement even when observer throws=${throws}`, async () => {
    const {createFooterVisitCounter} = await policy();
    let value = '0', settled = false;
    let boundary: unknown;
    const acknowledgments: unknown[] = [];
    const counter = createFooterVisitCounter({getItem: () => value, setItem(_key: string, next: string) {
      value = next;
      queueMicrotask(() => {boundary = {value, count: acknowledgments.length, settled};});
    }});
    const promise = counter.consume(undefined, () => {
      acknowledgments.push({value, settled});
      if (throws) throw new Error('observer failed after the accepted write');
    });
    promise.then(() => {settled = true;});
    assert.equal(await promise, true, 'observer failure cannot retract the accepted commit or reject consume');
    assert.deepEqual(acknowledgments, [{value: '1', settled: false}]);
    assert.deepEqual(boundary, {value: '1', count: 1, settled: false}, 'ownership must be known at the first post-write microtask');
    value = '2';
    assert.equal(await counter.consume(undefined, () => acknowledgments.push('denied')), false);
    const abort = new AbortController();abort.abort();value = '0';
    assert.equal(await counter.consume(abort.signal, () => acknowledgments.push('canceled')), false);
    assert.equal(value, '0');assert.equal(acknowledgments.length, 1, 'denials and precommit cancellation never acknowledge');
  });
}

for (const failOn of ['read', 'write', 'missing']) {
  test(`page-local ${failOn} storage fallback acknowledges accepted ownership without observer rollback`, async () => {
    const {createFooterVisitCounter} = await policy();
    const storage = failOn === 'missing' ? undefined : {
      getItem() {if (failOn === 'read') throw new Error('denied');return null;},
      setItem() {throw new Error('denied');},
    };
    const counter = createFooterVisitCounter(storage);
    let acknowledgments = 0;
    const onCommitted = () => {acknowledgments++;throw new Error('observer cannot undo memory ownership');};
    const abort = new AbortController();abort.abort();
    assert.equal(await counter.consume(abort.signal, onCommitted), false);
    assert.equal(acknowledgments, 0);assert.equal(counter.read(), 0);
    assert.equal(await counter.consume(undefined, onCommitted), true);
    assert.equal(acknowledgments, 1);assert.equal(counter.read(), 1);
    const second = counter.consume(undefined, onCommitted);
    assert.equal(acknowledgments, 2, 'fallback confirms synchronously, before returning its Promise');
    assert.equal(await second, true);assert.equal(counter.read(), 2);
    assert.equal(await counter.consume(undefined, onCommitted), false);
    assert.equal(acknowledgments, 2, 'exhausted fallback cannot acknowledge');
  });
}

test('the footer only activates when it covers the entire visible viewport', async () => {
  const {isFooterSceneFullyVisible} = await policy();
  assert.equal(isFooterSceneFullyVisible({top: 0, bottom: 800}, 800), true);
  assert.equal(isFooterSceneFullyVisible({top: 2, bottom: 802}, 800), false, 'a sliver of fake footer must not trigger playback');
  assert.equal(isFooterSceneFullyVisible({top: -2, bottom: 798}, 800), false);
  assert.equal(isFooterSceneFullyVisible({top: -100, bottom: 800}, 800), true, 'a taller mobile section may fully cover the viewport');
  assert.equal(isFooterSceneFullyVisible({top: .4, bottom: 799.8}, 800), true, 'subpixel rounding is tolerated');
  assert.equal(isFooterSceneFullyVisible({top: 0, bottom: 800}, 0), false);
  assert.equal(isFooterSceneFullyVisible({top: Number.NaN, bottom: 800}, 800), false);
});

test('only two started visits can be consumed across counter instances sharing browser storage', async () => {
  const {createFooterVisitCounter, FOOTER_VISIT_STORAGE_KEY} = await policy();
  assert.equal(typeof createFooterVisitCounter, 'function', 'persistent visit counter is missing');
  const data = new Map<string, string>();
  const storage = {getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value)};
  const first = createFooterVisitCounter(storage);
  assert.equal(first.read(), 0);
  assert.equal(await first.consume(), true);
  assert.equal(data.get(FOOTER_VISIT_STORAGE_KEY), '1');
  const nextVisit = createFooterVisitCounter(storage);
  assert.equal(nextVisit.read(), 1);
  assert.equal(await nextVisit.consume(), true);
  assert.equal(await first.consume(), false);
  assert.equal(nextVisit.read(), 2);
  data.clear();
  assert.equal(createFooterVisitCounter(storage).read(), 0, 'clearing site data must reset the persistent limit');
});

test('independent HTTP-LAN consumers serialize an interleaved final admission using IndexedDB', async () => {
  const indexedDB = new IDBFactory();
  const load = () => createHarness({}, {indexedDB, isSecureContext: false})
    .load(fileURLToPath(new URL('../src/utils/footerScenePolicy.ts', import.meta.url)));
  const a = load(), b = load(); // Separate module globals: no shared Promise queue or memory.
  const data = new Map([[a.FOOTER_VISIT_STORAGE_KEY, '1']]);
  let interleave = false;
  let second: Promise<boolean> | boolean | undefined;
  const storageB = {getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value)};
  const counterB = b.createFooterVisitCounter(storageB);
  const counterA = a.createFooterVisitCounter({
    getItem: storageB.getItem,
    setItem(key: string, value: string) {
      // Launch B after A read count=1 but before A writes. B also sees count=1
      // in its preflight; only the real cross-connection mutex can protect commit.
      if (interleave) {interleave = false;second = counterB.consume();}
      storageB.setItem(key, value);
    },
  });
  assert.equal(counterA.read(), 1);assert.equal(counterB.read(), 1);
  interleave = true;
  const first = await counterA.consume();
  assert.notEqual(second, undefined, 'the independent consumer must run during the first critical section');
  const admissions = await Promise.all([first, second]);
  assert.equal(admissions.filter(Boolean).length, 1, 'only one tab may start the final available execution');
  assert.equal(data.get(a.FOOTER_VISIT_STORAGE_KEY), '2');
  assert.equal(await b.createFooterVisitCounter(storageB).consume(), false, 'no third full scene after the two admitted executions');
  data.clear();
  assert.equal(await counterA.consume(), true, 'the mutex must not persist a second budget: clearing the original key resets admission');
});

test('storage failure after a successful read preserves the known count in page-only fallback', async () => {
  const {createFooterVisitCounter} = await policy();
  let denied = false;
  const storage = {
    getItem() {if (denied) throw new Error('storage became unavailable');return '1';},
    setItem() {throw new Error('storage became unavailable');},
  };
  const counter = createFooterVisitCounter(storage);
  assert.equal(counter.read(), 1);
  denied = true;
  assert.equal(counter.read(), 1, 'fallback must retain the last successfully read budget');
  assert.equal(await counter.consume(), true);
  assert.equal(await counter.consume(), false, 'one known execution leaves only one page-local admission');
  assert.equal(createFooterVisitCounter(storage).read(), 2);
});

test('healthy localStorage cannot consume without a safe cross-context coordinator', async () => {
  const {createFooterVisitCounter} = createHarness()
    .load(fileURLToPath(new URL('../src/utils/footerScenePolicy.ts', import.meta.url)));
  let value = '1';
  const counter = createFooterVisitCounter({getItem: () => value, setItem: (_key: string, next: string) => {value = next;}});
  assert.equal(await counter.consume(), false);
  assert.equal(value, '1', 'no unguarded localStorage fallback is allowed');
});

test('malformed or denied site storage cannot crash playback or bypass its in-page limit', async () => {
  const {createFooterVisitCounter} = await policy();
  for (const raw of ['garbage', '-1', '1.5', 'NaN', '']) {
    assert.equal(createFooterVisitCounter({getItem: () => raw, setItem() {}}).read(), 0);
  }
  assert.equal(createFooterVisitCounter({getItem: () => '999', setItem() {}}).read(), 2);
  for (const failOn of ['read', 'write']) {
    const storage = {
      getItem() {if (failOn === 'read') throw new Error('denied');return null;},
      setItem() {throw new Error('denied');},
    };
    const counter = createFooterVisitCounter(storage);
    assert.equal(await counter.consume(), true);
    assert.equal(await counter.consume(), true);
    assert.equal(await counter.consume(), false);
    assert.equal(createFooterVisitCounter(storage).read(), 2);
  }
});
