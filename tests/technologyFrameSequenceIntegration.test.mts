import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const stage = await readFile(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url), 'utf8');

test('conecta as camadas new-cena à timeline ScrollTrigger da etapa de tecnologias', () => {
  assert.match(stage, /getTechnologyFrameSequence/);
  assert.match(stage, /technology-frame-layer/);
  assert.match(stage, /frameSequence\.frames\.map/);
  assert.match(stage, /frameLayerRefs/);
  assert.match(stage, /frame\.src/);
  assert.doesNotMatch(stage, /SCENE_TWO_IMAGE/);
});
