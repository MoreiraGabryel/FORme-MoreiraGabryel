import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness, elements} from './helpers/technologyHarness.cjs';

function mount() {
  function HeroIntro() {}
  function TechnologyAndAboutStage() {}
  function FakeFooterStage() {}
  const harness = createHarness({
    gsap: {gsap: {ticker: {add() {}, remove() {}}}},
    './components/sections/LoadingScreen': {LoadingScreen() {}},
    './components/sections/HeroIntro': {HeroIntro},
    './components/sections/TechnologyAndAboutStage': {TechnologyAndAboutStage},
    './components/sections/FakeFooterStage': {FakeFooterStage},
    './components/effects/CodeBurstLayer': {CodeBurstLayer() {}},
    './components/legal/LegalPage': {LegalPage() {}},
    './i18n/useTranslation': {useTranslation: () => ({locale: 'pt', setLocale() {}})},
    './hooks/useSmoothScroll': {useSmoothScroll() {}},
  }, {window: {location: {pathname: '/'}}, document: {}});
  const App = harness.load(fileURLToPath(new URL('../src/App.tsx', import.meta.url))).default;
  const render = () => {
    const tree = harness.render(App, {});
    return {stage: elements(tree, (node) => node.type === TechnologyAndAboutStage)[0],
      footer: elements(tree, (node) => node.type === FakeFooterStage)[0]};
  };
  let scene = render();
  return {
    progress(stack: number, footer: number) {
      scene.stage.props.onProgress(stack);
      assert.equal(typeof scene.footer.props.onProgress, 'function', 'App must consume footer pin progress');
      scene.footer.props.onProgress(footer);
      scene = render();
      return scene.footer.props;
    },
  };
}

test('keeps the footer fully hidden before its pin and while the stack sequence is unfinished', () => {
  const host = mount();
  for (const [stack, footer] of [[0.84, 0], [0.98, 0.1], [1, 0]]) {
    const props = host.progress(stack, footer);
    assert.equal(props.stageStyle['--fake-footer-entrance'], '0');
    assert.equal(props.entryOpacity, 0);
    assert.equal(props.entryProgress, 0);
  }
});

test('reveals the pinned footer continuously and reverses back to blackout on upward scroll', () => {
  const host = mount();
  const before = host.progress(1, 0);
  const early = host.progress(1, 0.04);
  const settled = host.progress(1, 0.12);
  assert.equal(before.stageStyle['--fake-footer-entrance'], '0');
  assert.ok(Number(early.stageStyle['--fake-footer-entrance']) > 0);
  assert.ok(Number(early.stageStyle['--fake-footer-entrance']) < 1);
  assert.equal(settled.stageStyle['--fake-footer-entrance'], '1');
  assert.ok(early.entryProgress < settled.entryProgress);
  const reverse = host.progress(1, 0.04);
  assert.equal(reverse.stageStyle['--fake-footer-entrance'], early.stageStyle['--fake-footer-entrance']);
  assert.equal(reverse.entryProgress, early.entryProgress);
  const blackout = host.progress(1, 0);
  assert.equal(blackout.entryOpacity, 0);
  assert.equal(blackout.stageStyle['--fake-footer-entrance'], '0');
});
