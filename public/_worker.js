const responseHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
};

// The static asset layer answers Range requests with the whole file (200, no
// Accept-Ranges). Scrubbed videos set currentTime, so browsers need real partial
// content to seek before the file has finished downloading.
async function serveMedia(request, env) {
  const range = request.headers.get('Range');
  if (!range) {
    const whole = await env.ASSETS.fetch(request);
    if (!whole.ok) return whole;
    const headers = new Headers(whole.headers);
    headers.set('Accept-Ranges', 'bytes');
    return new Response(whole.body, {status: whole.status, headers});
  }

  const headers = new Headers(request.headers);
  headers.delete('Range');
  const source = await env.ASSETS.fetch(new Request(request.url, {headers}));
  if (!source.ok) return source;
  const body = await source.arrayBuffer();
  const size = body.byteLength;
  const responseHeaders = new Headers(source.headers);
  responseHeaders.set('Accept-Ranges', 'bytes');

  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match || (match[1] === '' && match[2] === '')) {
    return new Response(body, {status: 200, headers: responseHeaders});
  }
  let start;
  let end;
  if (match[1] === '') {
    start = Math.max(size - Number(match[2]), 0);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1);
  }
  if (size === 0 || start >= size || start > end) {
    responseHeaders.set('Content-Range', `bytes */${size}`);
    return new Response(null, {status: 416, headers: responseHeaders});
  }
  responseHeaders.set('Content-Range', `bytes ${start}-${end}/${size}`);
  responseHeaders.set('Content-Length', String(end - start + 1));
  return new Response(body.slice(start, end + 1), {status: 206, headers: responseHeaders});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/media/') && request.method === 'GET') return serveMedia(request, env);
    if (url.pathname !== '/api/visits') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') {
      return Response.json({error: 'Method not allowed'}, {status: 405, headers: {...responseHeaders, Allow: 'POST'}});
    }
    if (request.headers.get('Origin') !== url.origin) {
      return Response.json({error: 'Forbidden'}, {status: 403, headers: responseHeaders});
    }

    try {
      // One transaction and one row: concurrent entries never overwrite each other.
      const [, result] = await env.VISITOR_COUNTER_DB.batch([
        env.VISITOR_COUNTER_DB.prepare('CREATE TABLE IF NOT EXISTS visitor_count (id INTEGER PRIMARY KEY CHECK (id = 1), total INTEGER NOT NULL)'),
        env.VISITOR_COUNTER_DB.prepare('INSERT INTO visitor_count (id, total) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET total = total + 1 RETURNING total'),
      ]);
      const total = result.results[0].total;
      return Response.json({previous: total - 1, total}, {headers: responseHeaders});
    } catch {
      return Response.json({error: 'Counter unavailable'}, {status: 503, headers: responseHeaders});
    }
  },
};
