import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness, elements} from './helpers/technologyHarness.cjs';
import {HOME_COPY} from '../src/config/homeContent.ts';

function mount() {
  let trigger;
  const frames: Array<() => void> = [];
  const harness = createHarness({
    gsap: {gsap: {registerPlugin() {}, set() {}, to() {}, context(run: () => void) {run();return {revert() {}};}}},
    'gsap/ScrollTrigger': {ScrollTrigger: {create(vars: object) { trigger = vars; }, sort() {}, refresh() {}}},
    '../../hooks/useAmbientVideo': {useAmbientVideo() {}},
    '../../hooks/useScrubbedVideo': {useScrubbedVideo() {}},
  }, {
    window: {matchMedia: () => ({matches: false, addEventListener() {}, removeEventListener() {}}),
      requestAnimationFrame(callback: () => void) { frames.push(callback);return 1; }, dispatchEvent() {}},
    Event,
  });
  const Component = harness.load(fileURLToPath(new URL('../src/components/sections/FakeFooterStage.tsx', import.meta.url))).FakeFooterStage;
  const progress: number[] = [];
  const tree = harness.render(Component, {copy: HOME_COPY.pt, locale: 'pt', footerPhraseIndex: 0,
    stageStyle: {}, shellStyle: {}, portalLayerStyle: {}, entryProgress: 0, entryOpacity: 0,
    ambientOpacity: 0, ambientPlaying: false, footerProgress: 0, statementRotationActive: false,
    onProgress(value: number) {progress.push(value);},
  });
  for (const node of elements(tree, (node) => Boolean(node.props?.ref) && typeof node.props.ref === 'object')) {
    node.props.ref.current = {querySelectorAll: () => [], parentElement: null};
  }
  harness.flush();
  return {trigger, progress, harness};
}

test('footer publishes the actual pin progress on refresh and scroll instead of a separate geometry clock', () => {
  const host = mount();
  try {
    assert.equal(typeof host.trigger?.onRefresh, 'function', 'footer refresh must publish its actual pin progress');
    assert.equal(typeof host.trigger?.onUpdate, 'function');
    host.trigger.onRefresh({progress: 0.2});
    host.trigger.onUpdate({progress: 0.6});
    assert.deepEqual(host.progress, [0.2, 0.6]);
    assert.equal(host.trigger.refreshPriority, 1);
  } finally {host.harness.dispose();}
});
