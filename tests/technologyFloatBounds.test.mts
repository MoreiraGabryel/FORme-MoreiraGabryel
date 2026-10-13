import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {createHarness, elements} from './helpers/technologyHarness.cjs';

function mount(width, seed = 0.43, fieldWidth = width) {
  let frame;
  const height = 568;
  const globals = {
    window: {
      innerWidth: width, innerHeight: height,
      matchMedia: (query) => ({matches: query.includes('max-width'), addEventListener() {}, removeEventListener() {}}),
      requestAnimationFrame: (fn) => { frame = fn; return 1; }, cancelAnimationFrame() { frame = null; },
    },
    document: {hidden: false},
    Math: Object.assign(Object.create(Math), {random: () => seed}),
  };
  const harness = createHarness({
    gsap: {gsap: {registerPlugin() {}}},
    'gsap/ScrollTrigger': {ScrollTrigger: {}}, 'gsap/SplitText': {SplitText: {}},
  }, globals);
  const {TechnologyAndAboutStage} = harness.load(fileURLToPath(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url)));
  const props = {locale: 'pt', rawStageProgress: 0.6, stageStyle: {}, onProgress() {}};
  const tree = harness.render(TechnologyAndAboutStage, props);
  const field = elements(tree, (node) => node.props?.className === 'technologies-float-field')[0];
  field.props.ref.current = {getBoundingClientRect: () => ({width: fieldWidth, height})};
  const anchors = elements(tree, (node) => node.props?.className?.startsWith('technology-float-anchor'));
  const pairs = anchors.map((anchor) => {
    const button = elements(anchor, (node) => node.props?.className === 'technology-float-button')[0];
    const anchorNode = {style: {}};
    const buttonNode = {style: {}, offsetWidth: 44, offsetHeight: 44};
    anchor.props.ref(anchorNode);
    button.props.ref(buttonNode);
    return {anchor: anchorNode, button: buttonNode};
  });
  harness.flush();
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  const buttonRule = css.match(/\.technology-float-button \{([^}]+)\}/)[1];
  const translated = /translate:\s*-50%\s+-50%\s*;/.test(buttonRule);
  return {
    pairs, width: fieldWidth, height, translated,
    frame(time) { frame(time); },
    progress(value) {
      props.rawStageProgress = value;
      harness.render(TechnologyAndAboutStage, props);
      harness.flush();
    },
    dispose() { harness.dispose(); },
  };
}

function bounds(host, pair) {
  const [, x, y] = pair.anchor.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
  const [, rotation, scale] = pair.button.style.transform.match(/rotate\(([-\d.]+)deg\) scale\(([-\d.]+)\)/);
  const radians = Number(rotation) * Math.PI / 180;
  const halfExtent = 22 * Number(scale) * (Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians)));
  // A zero-sized anchor has no -50% offset. Center the actual button instead.
  const centerX = host.width / 2 + Number(x) + (host.translated ? 0 : 22);
  const centerY = host.height / 2 + Number(y) + (host.translated ? 0 : 22);
  return {x: Number(x), y: Number(y), centerX, centerY,
    left: centerX - halfExtent, right: centerX + halfExtent,
    top: centerY - halfExtent, bottom: centerY + halfExtent};
}

test('mobile floating positions center the actual 44px button rather than the zero-sized anchor', () => {
  const host = mount(320);
  try {
    host.frame(0);
    for (const pair of host.pairs) {
      const box = bounds(host, pair);
      assert.equal(box.centerX, host.width / 2 + box.x, 'button center must coincide with its animated anchor');
      assert.equal(box.centerY, host.height / 2 + box.y);
    }
  } finally { host.dispose(); }
});

test('mobile clamp accounts for intro ejection and the actual scaled button dimensions', () => {
  for (const seed of [0, 0.1, 0.25, 0.43, 0.6, 0.75, 0.9]) {
    const host = mount(320, seed, 240);
    try {
    for (let step = 0; step <= 100; step++) {
      host.progress(0.045 + step * 0.005);
      host.frame(step * 32);
      for (const pair of host.pairs) {
        const box = bounds(host, pair);
        assert.ok(box.left >= -0.015 && box.right <= host.width + 0.015 && box.top >= -0.015 && box.bottom <= host.height + 0.015,
          `intro step ${step} clips an icon: ${JSON.stringify(box)}`);
      }
    }
    } finally { host.dispose(); }
  }
});

test('mobile 320px and 375px fields contain the fully scaled rotated drifting buttons at every sampled frame', () => {
  for (const width of [320, 375]) {
    const host = mount(width);
    try {
      for (let time = 0; time <= 16000; time += 32) {
        host.frame(time);
        for (const pair of host.pairs) {
          const box = bounds(host, pair);
          assert.ok(box.left >= -0.015 && box.right <= width + 0.015 && box.top >= -0.015 && box.bottom <= host.height + 0.015,
            `${width}px @ ${time}ms clips a scaled drifting icon: ${JSON.stringify(box)}`);
        }
      }
    } finally { host.dispose(); }
  }
});
