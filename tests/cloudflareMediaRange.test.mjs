import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {Miniflare} from 'miniflare';

const workerPath = fileURLToPath(new URL('../public/_worker.js', import.meta.url));
const origin = 'https://portfolio.example';
const video = Uint8Array.from({length: 1000}, (_, index) => index % 251);

// Mirrors the static asset layer: Range is ignored and the whole file returns as 200.
function createWorker() {
  return new Miniflare({
    modules: true, scriptPath: workerPath, compatibilityDate: '2026-07-01', port: 0,
    d1Databases: ['VISITOR_COUNTER_DB'],
    serviceBindings: {
      ASSETS: async request => new URL(request.url).pathname === '/media/clip.mp4'
        ? new Response(video, {headers: {'Content-Type': 'video/mp4', ETag: '"clip"', 'X-Content-Type-Options': 'nosniff'}})
        : new Response('not found', {status: 404}),
    },
  });
}

async function bytes(response) {return new Uint8Array(await response.arrayBuffer());}

test('a bounded Range request returns only that slice as 206', async () => {
  const worker = createWorker();
  try {
    const response = await worker.dispatchFetch(`${origin}/media/clip.mp4`, {headers: {Range: 'bytes=100-199'}});
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), 'bytes 100-199/1000');
    assert.equal(response.headers.get('Content-Length'), '100');
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
    assert.equal(response.headers.get('Content-Type'), 'video/mp4');
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.deepEqual(await bytes(response), video.slice(100, 200));
  } finally {await worker.dispose();}
});

test('open-ended, suffix and oversized ranges are clamped to the file', async () => {
  const worker = createWorker();
  try {
    const open = await worker.dispatchFetch(`${origin}/media/clip.mp4`, {headers: {Range: 'bytes=900-'}});
    assert.equal(open.status, 206);
    assert.equal(open.headers.get('Content-Range'), 'bytes 900-999/1000');
    const suffix = await worker.dispatchFetch(`${origin}/media/clip.mp4`, {headers: {Range: 'bytes=-50'}});
    assert.equal(suffix.headers.get('Content-Range'), 'bytes 950-999/1000');
    assert.deepEqual(await bytes(suffix), video.slice(950));
    const oversized = await worker.dispatchFetch(`${origin}/media/clip.mp4`, {headers: {Range: 'bytes=0-99999'}});
    assert.equal(oversized.headers.get('Content-Range'), 'bytes 0-999/1000');
  } finally {await worker.dispose();}
});

test('a start beyond the file is 416 and an unparseable Range falls back to the full file', async () => {
  const worker = createWorker();
  try {
    const beyond = await worker.dispatchFetch(`${origin}/media/clip.mp4`, {headers: {Range: 'bytes=5000-'}});
    assert.equal(beyond.status, 416);
    assert.equal(beyond.headers.get('Content-Range'), 'bytes */1000');
    const multi = await worker.dispatchFetch(`${origin}/media/clip.mp4`, {headers: {Range: 'bytes=0-10,20-30'}});
    assert.equal(multi.status, 200);
    assert.equal((await bytes(multi)).length, 1000);
  } finally {await worker.dispose();}
});

test('a plain request returns the whole file and advertises byte ranges', async () => {
  const worker = createWorker();
  try {
    const response = await worker.dispatchFetch(`${origin}/media/clip.mp4`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Accept-Ranges'), 'bytes');
    assert.deepEqual(await bytes(response), video);
  } finally {await worker.dispose();}
});

test('missing media and other asset paths pass through untouched', async () => {
  const worker = createWorker();
  try {
    const missing = await worker.dispatchFetch(`${origin}/media/none.mp4`, {headers: {Range: 'bytes=0-9'}});
    assert.equal(missing.status, 404);
    const other = await worker.dispatchFetch(`${origin}/assets/app.js`);
    assert.equal(other.status, 404);
    assert.equal(other.headers.get('Accept-Ranges'), null);
  } finally {await worker.dispose();}
});
