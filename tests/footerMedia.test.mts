import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';

const media = new URL('../public/media/', import.meta.url);

test('the complete approved footer clip is packaged with transparent and black fallbacks', () => {
  for (const file of ['footer-character.webm', 'footer-character.mp4', 'footer-character-poster.webp', 'footer-character-media.json']) {
    assert.ok(existsSync(new URL(file, media)), `missing processed footer asset: ${file}`);
  }
  const manifest = JSON.parse(readFileSync(new URL('footer-character-media.json', media), 'utf8'));
  assert.equal(manifest.source.sha256, 'eba6cc99bf1cdef028a6710db80438e52bb52855120d6ae9a8367a44fd3973da');
  assert.equal(manifest.output.frames, 362, 'the full clip must not be replaced by a two-second sample');
  assert.equal(manifest.output.fps, 36);
  assert.equal(manifest.output.width, 720);
  assert.equal(manifest.output.height, 1148);
  assert.equal(manifest.verification.sourceUnchanged, true);
  assert.equal(manifest.verification.fullDecodePassed, true);
  assert.equal(manifest.verification.audioTrack, true);
  assert.deepEqual(manifest.verification.alphaRange, [0, 255]);
  assert.equal(readFileSync(new URL('footer-character.mp4', media)).toString('ascii', 4, 8), 'ftyp');
  assert.equal(readFileSync(new URL('footer-character-poster.webp', media)).toString('ascii', 8, 12), 'WEBP');
});

test('public media provenance does not expose local machine or scratch paths', () => {
  const text = readFileSync(new URL('footer-character-media.json', media), 'utf8');
  assert.ok(!text.includes('/home/'), 'public metadata must contain portable provenance, not private absolute paths');
  assert.ok(!text.includes('.hermes/cache/'));
});
