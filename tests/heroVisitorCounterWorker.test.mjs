import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {Miniflare} from 'miniflare';

const workerPath = fileURLToPath(new URL('../public/_worker.js', import.meta.url));
const origin = 'https://portfolio.example';

function createWorker(options = {}) {
  assert.ok(existsSync(workerPath), 'The Cloudflare counter Worker has not been implemented');
  return new Miniflare({
    modules: true, scriptPath: workerPath, compatibilityDate: '2026-07-01',
    d1Databases: ['VISITOR_COUNTER_DB'], port: 0, ...options,
  });
}

function visit(worker) {
  return worker.dispatchFetch(`${origin}/api/visits`, {method: 'POST', headers: {Origin: origin}});
}

test('each entry replaces one aggregate and returns the real previous and current totals', async () => {
  const worker = createWorker();
  try {
    const first = await visit(worker);
    assert.equal(first.status, 200);
    assert.equal(first.headers.get('Cache-Control'), 'no-store');
    assert.equal(first.headers.get('Set-Cookie'), null);
    assert.deepEqual(await first.json(), {previous: 0, total: 1});
    assert.deepEqual(await (await visit(worker)).json(), {previous: 1, total: 2});
    const db = await worker.getD1Database('VISITOR_COUNTER_DB');
    assert.deepEqual((await db.prepare('SELECT * FROM visitor_count').all()).results, [{id: 1, total: 2}]);
  } finally {await worker.dispose();}
});

test('only same-origin POST entries may change the total', async () => {
  const worker = createWorker();
  try {
    const get = await worker.dispatchFetch(`${origin}/api/visits`);
    assert.equal(get.status, 405);
    assert.equal(get.headers.get('Allow'), 'POST');
    for (const headers of [{}, {Origin: 'https://other.example'}, {Origin: 'null'}]) {
      const response = await worker.dispatchFetch(`${origin}/api/visits`, {method: 'POST', headers});
      assert.equal(response.status, 403);
    }
    assert.deepEqual(await (await visit(worker)).json(), {previous: 0, total: 1});
  } finally {await worker.dispose();}
});

test('an unconfigured database returns unavailable rather than an invented count', async () => {
  const worker = createWorker({d1Databases: []});
  try {
    const response = await visit(worker);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {error: 'Counter unavailable'});
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  } finally {await worker.dispose();}
});

test('simultaneous entries each receive their own atomic increment without losing a visit', async () => {
  const worker = createWorker();
  try {
    const counts = await Promise.all(Array.from({length: 32}, async () => (await visit(worker)).json()));
    assert.deepEqual(counts.map(value => value.total).sort((a, b) => a - b), Array.from({length: 32}, (_, i) => i + 1));
    assert.ok(counts.every(value => value.previous === value.total - 1));
    const db = await worker.getD1Database('VISITOR_COUNTER_DB');
    assert.deepEqual((await db.prepare('SELECT * FROM visitor_count').all()).results, [{id: 1, total: 32}]);
    assert.deepEqual((await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all()).results, [{name: 'visitor_count'}]);
  } finally {await worker.dispose();}
});

test('restarting the Worker preserves the total in the same database', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hero-counter-d1-'));
  let worker;
  try {
    worker = createWorker({d1Persist: directory});
    assert.deepEqual(await (await visit(worker)).json(), {previous: 0, total: 1});
    await worker.dispose();
    worker = createWorker({d1Persist: directory});
    assert.deepEqual(await (await visit(worker)).json(), {previous: 1, total: 2});
  } finally {await worker?.dispose(); await rm(directory, {recursive: true, force: true});}
});

test('API success and failures send their own security headers instead of relying on static asset rules', async () => {
  const worker = createWorker();
  const unconfigured = createWorker({d1Databases: []});
  try {
    const responses = [await visit(worker), await worker.dispatchFetch(`${origin}/api/visits`),
      await worker.dispatchFetch(`${origin}/api/visits`, {method: 'POST'}), await visit(unconfigured)];
    assert.deepEqual(responses.map(response => response.status), [200, 405, 403, 503]);
    for (const response of responses) {
      assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
      assert.equal(response.headers.get('Cross-Origin-Resource-Policy'), 'same-origin');
      assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    }
  } finally {await worker.dispose(); await unconfigured.dispose();}
});
