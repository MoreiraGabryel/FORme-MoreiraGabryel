import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
const wrangler = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');

function group(agent) {
  return robots.split(/\n\s*\n/).find(block => block.split('\n').some(line => line.trim().toLowerCase() === `user-agent: ${agent}`.toLowerCase()));
}

test('search engines are allowed and AI crawlers are disallowed', () => {
  const everyone = group('*');
  assert.match(everyone, /^Allow: \/$/m);
  assert.match(everyone, /^Disallow: \/api\/$/m);
  for (const agent of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'PerplexityBot']) {
    assert.match(group(agent), /^Disallow: \/$/m, `${agent} must be disallowed`);
  }
  assert.equal(group('Googlebot'), undefined);
  assert.equal(group('Bingbot'), undefined);
});

test('deploys keep the workers.dev address and preview URLs disabled', () => {
  assert.match(wrangler, /"workers_dev":\s*false/);
  assert.match(wrangler, /"preview_urls":\s*false/);
});
