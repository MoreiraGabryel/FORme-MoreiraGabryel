import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness, elements} from './helpers/technologyHarness.cjs';

function mount() {
  const document = Object.assign(new EventTarget(), {hidden: false});
  const timers = new Map<number, number>();
  let timerId = 0;
  function FakeFooterStage() {}
  function TechnologyAndAboutStage() {}
  const harness = createHarness({
    gsap: {gsap: {ticker: {add() {}, remove() {}}}},
    './components/sections/LoadingScreen': {LoadingScreen() {}},
    './components/sections/HeroIntro': {HeroIntro() {}},
    './components/sections/TechnologyAndAboutStage': {TechnologyAndAboutStage},
    './components/sections/FakeFooterStage': {FakeFooterStage},
    './components/effects/CodeBurstLayer': {CodeBurstLayer() {}},
    './components/legal/LegalPage': {LegalPage() {}},
    './i18n/useTranslation': {useTranslation: () => ({locale: 'pt', setLocale() {}})},
    './hooks/useSmoothScroll': {useSmoothScroll() {}},
  }, {document, Image: class {src = '';}, window: {
    location: {pathname: '/'},
    setInterval(_callback: () => void, delay: number) {timers.set(++timerId, delay);return timerId;},
    clearInterval(id: number) {timers.delete(id);},
  }});
  const App = harness.load(fileURLToPath(new URL('../src/App.tsx', import.meta.url))).default;
  let footer: any;
  let stage: any;
  function render() {
    const tree = harness.render(App, {});
    footer = elements(tree, node => node.type === FakeFooterStage)[0].props;
    stage = elements(tree, node => node.type === TechnologyAndAboutStage)[0].props;
    harness.flush();
  }
  render();render();
  return {
    get footer() {return footer;},
    get rotationTimers() {return [...timers].filter(([, delay]) => delay === 3200).map(([id]) => id);},
    progress(stack: number, progress: number) {stage.onProgress(stack);footer.onProgress(progress);render();render();},
    visible(visible: boolean) {document.hidden = !visible;document.dispatchEvent(new Event('visibilitychange'));render();render();},
    dispose() {harness.dispose();},
  };
}

test('footer suspends its timer and automatic effects in a hidden tab and restarts with a fresh interval', () => {
  const host = mount();
  try {
    assert.equal(host.rotationTimers.length, 0);
    host.progress(1, .2);
    assert.equal(host.rotationTimers.length, 1);
    const initialTimer = host.rotationTimers[0];
    host.visible(false);
    assert.equal(host.rotationTimers.length, 0);
    assert.equal(host.footer.statementRotationActive, false);
    assert.equal(host.footer.effectsActive, false);
    host.visible(true);
    assert.equal(host.rotationTimers.length, 1);
    assert.ok(host.rotationTimers[0] !== initialTimer, 'tab return must get a fresh delay, not a backlog');
    assert.equal(host.footer.effectsActive, true);
    host.progress(1, .97);
    assert.equal(host.rotationTimers.length, 0, 'blackout must release the phrase timer');
    host.progress(.9, 0);
    assert.equal(host.rotationTimers.length, 0, 'stack reentry must not cycle the footer');
  } finally {host.dispose();}
  assert.equal(host.rotationTimers.length, 0, 'unmount must release timers');
});
