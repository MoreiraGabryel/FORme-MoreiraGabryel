import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createRestorationReactHost} from './helpers/restorationReactHost.cjs';

for (const mode of [{name: 'desktop', reduced: false, width: 1440, height: 1000}, {name: 'mobile reduced-motion', reduced: true, width: 390, height: 800}]) {
test(`installed React commits real App restoration before ready without remount: ${mode.name}`, async () => {
  const host = createRestorationReactHost(mode), {React} = host;
  const committed: any = {}, order: string[] = [];
  let restore: (signal: AbortSignal) => Promise<void>, stageProgress: (p: number) => void, footerProgress: (p: number) => void;
  let mounts = 0, unmounts = 0;
  function Hero(props: any) {
    React.useEffect(() => {mounts++;return () => {unmounts++;};}, []);
    React.useLayoutEffect(() => {committed.hero = props.heroProgress;order.push(`commit:${props.heroProgress}`);});
    return React.createElement('section', {'data-hero-progress': props.heroProgress});
  }
  function Stage(props: any) {
    stageProgress = props.onProgress;
    React.useLayoutEffect(() => {committed.stage = props.rawStageProgress;committed.handoff = props.stageStyle['--hero-handoff'];});
    return null;
  }
  function Footer(props: any) {
    footerProgress = props.onProgress;
    React.useLayoutEffect(() => {committed.footer = props.footerProgress;committed.blackout = props.stageStyle['--fake-footer-exit-blackout'];});
    return null;
  }
  function Final(props: any) {restore = props.onRestore;return null;}
  const load = host.loader({
    gsap: {gsap: {getTweensOf: () => [], ticker: {add() {}, remove() {}}}},
    'gsap/ScrollTrigger': {ScrollTrigger: {sort() {order.push('sort');}, refresh() {order.push('refresh');stageProgress(0);footerProgress(0);}, update() {}, getAll: () => []}},
    './components/sections/LoadingScreen': {LoadingScreen: () => null},
    './components/sections/HeroIntro': {HeroIntro: Hero}, './components/sections/TechnologyAndAboutStage': {TechnologyAndAboutStage: Stage},
    './components/sections/FakeFooterStage': {FakeFooterStage: Footer}, './components/sections/FinalFooterStage': {FinalFooterStage: Final},
    './components/effects/CodeBurstLayer': {CodeBurstLayer: () => null}, './components/legal/LegalPage': {LegalPage: () => null},
    './i18n/useTranslation': {useTranslation: () => ({locale: 'pt', setLocale() {}})}, './hooks/useSmoothScroll': {useSmoothScroll() {}},
  });
  try {
    const App = load(fileURLToPath(new URL('../src/App.tsx', import.meta.url))).default;
    host.render(App);
    host.ReactDOM.flushSync(() => {stageProgress(1);footerProgress(1);});
    assert.equal(committed.hero, 1);assert.equal(committed.stage, 1);assert.equal(typeof restore!, 'function');
    const acquire = load(fileURLToPath(new URL('../src/utils/footerSceneInputLock.ts', import.meta.url))).acquireFooterSceneInputLock;
    const lock = acquire(host.doc, host.win, restore!);
    host.win.scrollY = 0;host.win.dispatchEvent(new Event('scroll'));
    host.ReactDOM.flushSync(() => {});
    assert.equal(committed.hero, 1, 'a real React render must retain the pre-lock progress');
    let ready = false;
    const pending = lock.returnToTop(new AbortController().signal).then(() => {order.push('ready');ready = true;});
    assert.equal(ready, false);assert.equal(committed.hero, 1);
    for (let i = 0; i < 12 && !ready; i++) {host.frame();await Promise.resolve();}
    await pending;
    assert.deepEqual(committed, {hero: 0, stage: 0, handoff: '0', footer: 0, blackout: '0'});
    assert.ok(order.indexOf('refresh') < order.lastIndexOf('commit:0'));
    assert.ok(order.lastIndexOf('commit:0') < order.indexOf('ready'), 'real child useLayoutEffect, not a simulated flush call, witnesses commit');
    assert.equal(mounts, 1);assert.equal(unmounts, 0);
    assert.equal(host.container.inert, true);lock.release();
    assert.equal(host.container.inert, false);
  } finally {await host.dispose();}
  assert.equal(unmounts, 1, 'the only unmount is test cleanup');
});
}
