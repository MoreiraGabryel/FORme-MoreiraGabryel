import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness, elements} from './helpers/technologyHarness.cjs';
import {HOME_COPY} from '../src/config/homeContent.ts';

function mountFooter(width = 390) {
  let trigger;
  let observer;
  let observed;
  let observerOptions;
  let scrub;
  let ambient;
  const mediaWell = {};
  const host = createHarness({
    gsap: {gsap: {registerPlugin() {}, set() {}, to() {}, context(run) {run();return {revert() {}};}}},
    'gsap/ScrollTrigger': {ScrollTrigger: {create(vars) {trigger = vars;}}},
    '../../utils/sceneRefresh': {requestSceneRefresh() {}},
    '../../utils/stableViewport': {getStableViewportHeight: () => 700},
    '../../hooks/useScrubbedVideo': {useScrubbedVideo(_ref, _progress, options) {scrub = options;}},
    '../../hooks/useAmbientVideo': {useAmbientVideo(_ref, options) {ambient = options;}},
  }, {
    window: {innerWidth: width, innerHeight: 700,
      matchMedia: query => ({matches: query.includes('max-width') && width <= Number(query.match(/([\d.]+)px/)[1]), addEventListener() {}, removeEventListener() {}})},
    IntersectionObserver: class {
      constructor(callback, options) {observer = callback;observerOptions = options;}
      observe(target) {observed = target;}
      disconnect() {}
    },
  });
  const Component = host.load(fileURLToPath(new URL('../src/components/sections/FakeFooterStage.tsx', import.meta.url))).FakeFooterStage;
  const props = {copy: HOME_COPY.pt, locale: 'pt', footerPhraseIndex: 0,
    stageStyle: {}, shellStyle: {}, portalLayerStyle: {}, entryProgress: 1,
    entryOpacity: 0, ambientOpacity: 0.72, ambientPlaying: true, footerProgress: 0.7,
    statementRotationActive: false, effectsActive: true, onProgress() {},
  };
  let tree;
  const nodes = new Map();
  const render = () => {
    tree = host.render(Component, props);
    for (const node of elements(tree, node => node.props?.ref && typeof node.props.ref === 'object')) {
      const identity = node.props.className;
      if (!nodes.has(identity)) nodes.set(identity, {identity, querySelectorAll: () => [], parentElement: mediaWell});
      node.props.ref.current = nodes.get(identity);
    }
    host.flush();
  };
  render();render();
  observer([{isIntersecting: true}]);render();render();
  const video = className => elements(tree, node => node.props?.className === className)[0];
  return {
    props, render, nodes,
    get trigger() {return trigger;}, get observed() {return observed;}, get observerOptions() {return observerOptions;},
    get scrub() {return scrub;}, get ambient() {return ambient;},
    get entryOpacity() {return video('fake-footer-entry-video').props.style.opacity;},
    get ambientOpacity() {return video('fake-footer-ambient-video').props.style.opacity;},
    dispose() {host.dispose();},
  };
}

test('mobile uses the desktop scroll-driven portal handoff without a separate presentation gate', () => {
  const h = mountFooter();
  try {
    assert.equal(h.entryOpacity, 0);
    assert.equal(h.ambientOpacity, 0.72);
    assert.equal(h.ambient.active, true);
    assert.equal(h.scrub.enabled, true);
    assert.equal(h.scrub.maxSeekStep, undefined);
    assert.equal(h.scrub.onPresented, undefined);
    h.props.effectsActive = false;h.render();
    assert.equal(h.scrub.enabled, false);
    assert.equal(h.ambient.prepare, undefined);
    assert.equal(h.ambient.active, false);
  } finally {h.dispose();}
});

test('mobile uses its own viewport for the desktop scroll formula and prewarms the section', () => {
  const h = mountFooter();
  try {
    assert.equal(h.trigger.end(), `+=${Math.round(700 * 3.8)}`);
    assert.ok(h.observed === h.nodes.get('fake-footer-stage'));
    assert.equal(h.observerOptions.rootMargin, '700px 0px');
    assert.equal(h.observerOptions.threshold, 0);
  } finally {h.dispose();}
});

test('desktop keeps original distance, observer and immediate portal handoff contract', () => {
  const h = mountFooter(1280);
  try {
    assert.equal(h.trigger.end(), `+=${Math.round(700 * 3.8)}`);
    assert.equal(h.observerOptions.threshold, 0.1);
    assert.equal(h.observerOptions.rootMargin, undefined);
    assert.equal(h.entryOpacity, 0);
    assert.equal(h.ambientOpacity, 0.72);
    assert.equal(h.ambient.active, true);
    assert.equal(h.scrub.maxSeekStep, undefined);
  } finally {h.dispose();}
});

function technologyClock(width) {
  let options;
  const chain = {to() {return this;}, fromTo() {return this;}};
  const host = createHarness({
    gsap: {gsap: {registerPlugin() {}, set() {}, timeline(vars) {options = vars;return chain;}, context(run) {run();return {revert() {}};}}},
    'gsap/ScrollTrigger': {ScrollTrigger: {}}, 'gsap/SplitText': {SplitText: {create: () => ({chars: [], revert() {}})}},
    '../../utils/sceneRefresh': {requestSceneRefresh() {}},
    '../../hooks/usePointerDepth': {usePointerDepth() {}},
  }, {window: {innerWidth: width,
    matchMedia: query => ({matches: query.includes('max-width') && width < 768, addEventListener() {}, removeEventListener() {}}),
    requestAnimationFrame: () => 1, cancelAnimationFrame() {}}, document: {hidden: false},
  });
  const Component = host.load(fileURLToPath(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url))).TechnologyAndAboutStage;
  const tree = host.render(Component, {locale: 'pt', rawStageProgress: 0, stageStyle: {}, onProgress() {}});
  for (const node of elements(tree, node => Boolean(node.props?.ref))) {
    if (typeof node.props.ref === 'object') node.props.ref.current = {};
    else if (node.props.className === 'technology-frame-layer') node.props.ref({});
  }
  host.flush();
  return {get options() {return options;}, dispose() {host.dispose();}};
}

test('mobile frame timeline reuses the desktop scrub calibration', () => {
  const h = technologyClock(390);
  try {assert.equal(h.options.scrollTrigger.scrub, 0.72);} finally {h.dispose();}
});

test('desktop technology scrub calibration stays unchanged', () => {
  const h = technologyClock(1280);
  try {assert.equal(h.options.scrollTrigger.scrub, 0.72);} finally {h.dispose();}
});
