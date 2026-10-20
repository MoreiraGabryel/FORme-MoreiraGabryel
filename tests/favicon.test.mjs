import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);

test('the tab and mobile icons explicitly reference the approved avatar instead of the old fallback', () => {
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map(match => match[0]);
  const version = createHash('sha256').update(readFileSync(new URL('public/media/nav-icon.webp', root))).digest('hex').slice(0, 12);
  const expected = [
    ['icon', `/favicon.ico?v=${version}`, '16x16 32x32 48x48 64x64 128x128 256x256'],
    ['icon', `/favicon-avatar-32.png?v=${version}`, '32x32'],
    ['apple-touch-icon', `/apple-touch-icon-avatar.png?v=${version}`, '180x180'],
  ];
  for (const [rel, href, sizes] of expected) {
    assert.ok(links.some(link => link.includes(`rel="${rel}"`) && link.includes(`href="${href}"`) && link.includes(`sizes="${sizes}"`)),
      `Missing explicit, versioned avatar icon: ${href}`);
  }
  const ico = readFileSync(new URL('public/favicon.ico', root));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  const frames = Array.from({length: ico.readUInt16LE(4)}, (_, index) => {
    const offset = 6 + index * 16;
    const width = ico[offset] || 256;
    const height = ico[offset + 1] || 256;
    assert.equal(width, height);
    assert.ok(ico.readUInt32LE(offset + 12) + ico.readUInt32LE(offset + 8) <= ico.length);
    return width;
  }).sort((a, b) => a - b);
  assert.deepEqual(frames, [16, 32, 48, 64, 128, 256]);
  for (const [name, size] of [['favicon-avatar-32.png', 32], ['apple-touch-icon-avatar.png', 180]]) {
    const png = readFileSync(new URL(`public/${name}`, root));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});
