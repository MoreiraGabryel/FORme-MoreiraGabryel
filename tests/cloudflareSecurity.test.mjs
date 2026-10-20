import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

test('production headers restrict scripts, framing and connections without blocking the existing fonts', () => {
  const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  assert.match(headers, /Content-Security-Policy:.*script-src 'self'(?:;|\s*;)/);
  assert.match(headers, /connect-src 'self'/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /object-src 'none'/);
  assert.match(headers, /base-uri 'none'/);
  assert.match(headers, /https:\/\/fonts.googleapis.com/);
  assert.match(headers, /https:\/\/fonts.gstatic.com/);
  assert.match(headers, /Referrer-Policy: no-referrer/);
  assert.doesNotMatch(headers, /unsafe-eval/);
});
