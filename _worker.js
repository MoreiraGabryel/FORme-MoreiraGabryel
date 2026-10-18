const responseHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
