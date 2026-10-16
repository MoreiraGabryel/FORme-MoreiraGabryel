import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {IDBFactory} from 'fake-indexeddb';
import {createHarness} from './helpers/technologyHarness.cjs';

const databaseName = 'moreiragabryel:footer-scene-admission:v1';
const load = (globals: object = {}) => createHarness({}, globals)
  .load(fileURLToPath(new URL('../src/utils/footerSceneAdmission.ts', import.meta.url)))
  .withFooterAdmissionLock;

function open(indexedDB: IDBFactory) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('mutex');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

test('aborting an actual queued IndexedDB transaction never runs its localStorage critical section', async () => {
  const indexedDB = new IDBFactory();
  const database = await open(indexedDB);
  const blocker = database.transaction('mutex', 'readwrite');
  let held = true;
  const keepAlive = () => {
    const request = blocker.objectStore('mutex').get('hold');
    request.onsuccess = () => {if (held) keepAlive();};
  };
  keepAlive();
  const released = new Promise<void>((resolve, reject) => {
    blocker.oncomplete = () => resolve();blocker.onerror = () => reject(blocker.error);
  });
  let enqueued!: () => void;
  const queued = new Promise<void>(resolve => {enqueued = resolve;});
  // Observe transaction creation only; real fake-indexeddb performs the
  // overlapping-store scheduling and abort semantics across both connections.
  const observed = {
    open(name: string, version: number) {
      const request = indexedDB.open(name, version);
      request.addEventListener('success', () => {
        const db = request.result;
        const transaction = db.transaction.bind(db);
        db.transaction = (...args: Parameters<IDBDatabase['transaction']>) => {
          const tx = transaction(...args);enqueued();return tx;
        };
      });
      return request;
    },
  };
  let commits = 0, acknowledgments = 0;
  const abort = new AbortController();
  try {
    const result = load({indexedDB: observed})(() => {commits++;return true;}, abort.signal, () => {acknowledgments++;});
    await queued;
    assert.equal(commits, 0, 'a blocked transaction must not enter its critical section');
    abort.abort();
    assert.equal(await result, false);
    held = false;await released;
    assert.equal(commits, 0, 'releasing the blocker must not resurrect a canceled admission');
    assert.equal(acknowledgments, 0, 'a canceled queued admission cannot acknowledge ownership');
    assert.equal(await load({indexedDB})(() => {commits++;return true;}, undefined, () => {acknowledgments++;}), true, 'a later independent admission must not be stranded');
    assert.equal(commits, 1);
    assert.equal(acknowledgments, 1);
  } finally {held = false;database.close();}
});

test('unavailable, throwing and asynchronously denied IndexedDB fail closed without running a commit', async () => {
  const denied = new IDBFactory();
  const database = denied.open(databaseName, 2);
  database.onsuccess = () => database.result.close();
  await new Promise<void>((resolve, reject) => {
    database.addEventListener('success', () => resolve());database.onerror = () => reject(database.error);
  });
  for (const globals of [{}, {indexedDB: {open() {throw new Error('denied');}}}, {indexedDB: denied}]) {
    let commits = 0;
    assert.equal(await load(globals)(() => {commits++;return true;}), false);
    assert.equal(commits, 0);
  }
});

for (const terminal of ['signal', 'abort', 'error', 'versionchange']) {
  test(`accepted external commit survives a real postcommit ${terminal}`, {timeout: 5000}, async () => {
    const factory = new IDBFactory();
    const abort = new AbortController();
    let transaction!: IDBTransaction;
    let ended!: () => void;
    const done = new Promise<void>(resolve => {ended = resolve;});
    let upgraded: Promise<void> = Promise.resolve();
    let errors = 0, aborts = 0, commits = 0;
    const observed = {
      open(name: string, version: number) {
        const request = factory.open(name, version);
        request.addEventListener('success', () => {
          const database = request.result, createTransaction = database.transaction.bind(database);
          database.transaction = (...args: Parameters<IDBDatabase['transaction']>) => {
            transaction = createTransaction(...args);
            transaction.addEventListener('error', () => {errors++;});
            transaction.addEventListener('abort', () => {aborts++;ended();});
            transaction.addEventListener('complete', () => ended());
            return transaction;
          };
        });
        return request;
      },
    };
    const result = load({indexedDB: observed})(() => {
      commits++;
      if (terminal === 'error') {
        // Artificial infrastructure stimulus: duplicate keys produce a real
        // ConstraintError; this is not an observed browser failure.
        const store = transaction.objectStore('mutex');
        store.add('first', 'duplicate');store.add('second', 'duplicate');
      } else if (terminal === 'versionchange') {
        const keepAlive = () => {
          const request = transaction.objectStore('mutex').get('hold');
          request.onsuccess = keepAlive;
        };
        keepAlive();
        upgraded = new Promise<void>((resolve, reject) => {
          const upgrade = factory.open(databaseName, 2);
          upgrade.onsuccess = () => {upgrade.result.close();resolve();};
          upgrade.onerror = () => reject(upgrade.error);
        });
      } else queueMicrotask(() => {
        if (terminal === 'signal') abort.abort();
        else transaction.abort();
      });
      return true;
    }, abort.signal);
    assert.equal(await result, true, 'aborting only the mutex cannot retract an accepted external write');
    await done;await upgraded;
    assert.equal(commits, 1);assert.equal(aborts, 1);
    if (terminal === 'error') assert.ok(errors > 0, 'the induced ConstraintError must reach the transaction');
  });
}

test('an already aborted admission never opens IndexedDB', async () => {
  const abort = new AbortController();abort.abort();
  const run = load({indexedDB: {open() {assert.fail('a canceled admission cannot open the coordinator');}}});
  assert.equal(await run(() => assert.fail('a canceled admission cannot commit'), abort.signal), false);
});
