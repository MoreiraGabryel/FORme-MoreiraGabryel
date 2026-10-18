import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {Miniflare} from 'miniflare';

const moduleUrl = new URL('../src/utils/heroVisitCounter.ts', import.meta.url);
const origin = 'https://portfolio.example';

test('StrictMode, remounts and Hero reentry share one real increment per document', async () => {
  assert.ok(existsSync(moduleUrl), 'The page-scoped Hero counter request has not been implemented');
  const worker = new Miniflare({modules: true, scriptPath: fileURLToPath(new URL('../public/_worker.js', import.meta.url)),
    compatibilityDate: '2026-07-01', d1Databases: ['VISITOR_COUNTER_DB'], port: 0});
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async (input, options) => {
    requests++;
    assert.equal(input, '/api/visits');
    assert.equal(options?.method, 'POST');
    assert.equal(options?.credentials, 'omit');
    assert.equal(options?.cache, 'no-store');
    assert.equal(options?.keepalive, true);
    const response = await worker.dispatchFetch(`${origin}${input}`, {method: options?.method, headers: {Origin: origin}});
    return new Response(await response.arrayBuffer(), {status: response.status, headers: Object.fromEntries(response.headers)});
  };
  try {
    const {countHeroVisitOnce} = await import(`${moduleUrl.href}?document=one`);
    const first = countHeroVisitOnce();
    assert.equal(countHeroVisitOnce(), first);
    assert.deepEqual(await first, {previous: 0, total: 1});
    assert.deepEqual(await countHeroVisitOnce(), {previous: 0, total: 1});
    assert.equal(requests, 1);
    const nextDocument = await import(`${moduleUrl.href}?document=two`);
    assert.deepEqual(await nextDocument.countHeroVisitOnce(), {previous: 1, total: 2});
    assert.equal(requests, 2);
  } finally {globalThis.fetch = originalFetch; await worker.dispose();}
});

test('unavailable and malformed responses stay empty and never retry an uncertain increment', async () => {
  const originalFetch = globalThis.fetch;
  const invalid = [null, {}, {previous: -1, total: 0}, {previous: 2, total: 8}, {previous: 2, total: '3'}];
  try {
    for (const [index, value] of invalid.entries()) {
      let requests = 0;
      globalThis.fetch = async () => {requests++;return new Response(JSON.stringify(value));};
      const module = await import(`${moduleUrl.href}?invalid=${index}`);
      assert.equal(await module.countHeroVisitOnce(), null);
      assert.equal(await module.countHeroVisitOnce(), null);
      assert.equal(requests, 1);
    }
    let requests = 0;
    globalThis.fetch = async () => {requests++;throw new TypeError('Offline transport fixture');};
    const offline = await import(`${moduleUrl.href}?offline`);
    assert.equal(await offline.countHeroVisitOnce(), null);
    assert.equal(await offline.countHeroVisitOnce(), null);
    assert.equal(requests, 1);
    globalThis.fetch = async () => new Response('{"error":"Counter unavailable"}', {status: 503});
    const unavailable = await import(`${moduleUrl.href}?unavailable`);
    assert.equal(await unavailable.countHeroVisitOnce(), null);
    globalThis.fetch = async () => new Response('<html>Static preview without an API</html>');
    const html = await import(`${moduleUrl.href}?html`);
    assert.equal(await html.countHeroVisitOnce(), null);
  } finally {globalThis.fetch = originalFetch;}
});
