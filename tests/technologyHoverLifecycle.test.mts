import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {gsap as realGsap} from 'gsap';
import {createHarness, elements} from './helpers/technologyHarness.cjs';

function mount(reducedMotion = false) {
  const positionTickers = new Set();
  const timelines = [];
  const cards = new Map();
  let reverted = 0;
  const gsap = {
    ...realGsap, registerPlugin() {},
    timeline(options) { const timeline = realGsap.timeline(options); timelines.push(timeline); return timeline; },
    context(run) {
      const ctx = realGsap.context(run);
      return {revert() { reverted++; ctx.revert(); }};
    },
    ticker: {add: (fn) => positionTickers.add(fn), remove: (fn) => positionTickers.delete(fn)},
  };
  const mocks = {gsap: {gsap}, 'gsap/ScrollTrigger': {ScrollTrigger: {}}, 'gsap/SplitText': {SplitText: {}}};
  const globals = {
    document: {hidden: false, body: {}},
    window: {innerWidth: 1440, innerHeight: 900, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
      matchMedia: (query) => ({matches: query.includes('prefers-reduced-motion') && reducedMotion, addEventListener() {}, removeEventListener() {}})},
  };
  const stage = createHarness(mocks, globals);
  const {TechnologyAndAboutStage} = stage.load(fileURLToPath(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url)));
  const props = {locale: 'pt', rawStageProgress: 0.6, stageStyle: {}, onProgress() {}};
  let tree;
  function render() {
    tree = stage.render(TechnologyAndAboutStage, props);
    elements(tree, (node) => node.props?.className === 'technology-float-button').forEach((button) => {
      button.props.ref({getBoundingClientRect: () => ({left: 400, top: 400, width: 44, height: 44, right: 444, bottom: 444})});
    });
    stage.flush();
    const children = elements(tree, (node) => node.type?.name === 'TechnologyHoverCard');
    const present = new Set(children.map((child) => child.props.technology.id));
    for (const [id, card] of cards) {
      if (!present.has(id)) { card.harness.dispose(); cards.delete(id); }
    }
    for (const child of children) {
      const id = child.props.technology.id;
      let card = cards.get(id);
      if (!card) {
        const harness = createHarness(mocks, globals);
        const component = harness.load(fileURLToPath(new URL('../src/components/technology/TechnologyHoverCard.tsx', import.meta.url))).TechnologyHoverCard;
        const numericTarget = () => ({opacity: 0, x: 0, y: 0, rotationY: 0, scaleY: 0, force3D: true});
        const blades = [numericTarget(), numericTarget()];
        const content = [numericTarget(), numericTarget(), numericTarget()];
        const seam = numericTarget();
        const node = {opacity: 0, force3D: true, style: {}, offsetWidth: 300, offsetHeight: 180,
          querySelectorAll: (selector) => selector === '.technology-card-blade' ? blades : content,
          querySelector: () => seam};
        card = {harness, component, node, timeline: null};
        cards.set(id, card);
      }
      const rendered = card.harness.render(card.component, child.props);
      rendered.props.ref.current = card.node;
      const previous = timelines.length;
      card.harness.flush();
      if (timelines.length > previous) card.timeline = timelines.at(-1);
      card.props = child.props;
    }
  }
  render();
  render(); // Apply the motion preference effect without rebuilding the scene.
  return {
    cards, positionTickers, timelines,
    get reverted() { return reverted; },
    enter(id, pointer = false) {
      const button = elements(tree, (node) => node.props?.className === 'technology-float-button' && node.props['aria-label'] === id)[0];
      assert.ok(button, `missing button ${id}`);
      if (pointer) button.props.onPointerEnter({pointerType: 'mouse'});
      else button.props.onFocus();
      render();
    },
    leave(id) {
      const button = elements(tree, (node) => node.props?.className === 'technology-float-button' && node.props['aria-label'] === id)[0];
      button.props.onBlur(); render();
    },
    render,
    progress(value) { props.rawStageProgress = value; render(); render(); },
    dispose() { cards.forEach((card) => card.harness.dispose()); stage.dispose(); realGsap.ticker.sleep(); },
  };
}

test('cross-icon hover retains the outgoing card until the real GSAP reverse completes', () => {
  const host = mount();
  try {
    host.enter('GSAP', true);
    const a = host.cards.get('gsap');
    a.timeline.progress(1);
    host.enter('React', true);
    assert.ok(host.cards.get('gsap') === a, 'changing tooltip identity must not unmount the outgoing card');
    assert.equal(a.timeline.reversed(), true);
    assert.equal(a.node.style.visibility, 'visible');
    assert.equal(host.positionTickers.size, 1, 'only the currently open card positions itself');
    a.timeline.totalTime(0, false);
    host.render();
    assert.equal(host.cards.has('gsap'), false, 'completed outgoing card must be disposed');
    assert.equal(host.cards.has('react'), true, 'outgoing completion must not remove the incoming card');
    assert.equal(host.reverted, 1);
  } finally { host.dispose(); }
  assert.equal(host.positionTickers.size, 0);
  assert.ok(host.timelines.every((timeline) => timeline.parent === null));
});

test('fast keyboard A to B to A reentry reuses A and clears its stale reverse completion', () => {
  const host = mount();
  try {
    host.enter('GSAP');
    const a = host.cards.get('gsap');
    a.timeline.progress(1);
    host.enter('React');
    const b = host.cards.get('react');
    b.timeline.progress(0.5);
    host.enter('GSAP');
    assert.ok(host.cards.get('gsap') === a, 'reentry must reuse the still-closing A instance');
    assert.equal(a.timeline.reversed(), false);
    assert.equal(a.timeline.eventCallback('onReverseComplete'), undefined);
    b.timeline.totalTime(0, false);
    host.render();
    assert.ok(host.cards.get('gsap') === a);
    assert.equal(host.cards.has('react'), false);
    assert.equal(a.node.style.visibility, 'visible');
    host.leave('GSAP');
    a.timeline.totalTime(0, false);
    host.render();
    assert.equal(host.cards.size, 0);
    assert.equal(host.positionTickers.size, 0);
  } finally { host.dispose(); }
  assert.ok(host.timelines.every((timeline) => timeline.parent === null));
});

test('reduced-motion cross-icon hover disposes the outgoing card without retaining a ticker', () => {
  const host = mount(true);
  try {
    host.enter('GSAP');
    host.enter('React');
    host.render();
    assert.equal(host.cards.has('gsap'), false);
    assert.equal(host.cards.has('react'), true);
    host.leave('React');
    host.render();
    assert.equal(host.cards.size, 0, 'immediate close must notify presence ownership too');
    assert.equal(host.positionTickers.size, 0);
  } finally { host.dispose(); }
});

test('leaving the stage removes reduced-motion hover presence after immediate exit', () => {
  const host = mount(true);
  try {
    host.enter('GSAP');
    host.progress(0.99);
    assert.equal(host.cards.size, 0, 'inactive-stage completion must not retain a hidden card');
    assert.equal(host.positionTickers.size, 0);
  } finally { host.dispose(); }
});
