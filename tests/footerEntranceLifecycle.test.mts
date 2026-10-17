import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {gsap as realGsap} from 'gsap';
import {createHarness, elements} from './helpers/technologyHarness.cjs';
import {HOME_COPY} from '../src/config/homeContent.ts';

// Reconcile heading identity by React key. Every new heading receives its OWN
// characters; reusing one array masked entrances missing on subsequent phrases.
function mount({compact = false, reduced = false} = {}) {
  const tweens: any[] = [];
  const timelines: any[] = [];
  const mounted = new Map<string, any>();
  let previousRefs: any[] = [];
  let tree: any;
  const gsap = {...realGsap, registerPlugin() {},
    to(targets: any, vars: any) {const tween = realGsap.to(targets, vars);tweens.push(tween);return tween;},
    timeline(vars: any) {const timeline = realGsap.timeline(vars);timelines.push(timeline);return timeline;},
  };
  const harness = createHarness({
    gsap: {gsap}, 'gsap/ScrollTrigger': {ScrollTrigger: {create() {}}},
    '../../utils/sceneRefresh': {requestSceneRefresh() {}},
    '../../hooks/useAmbientVideo': {useAmbientVideo() {}},
    '../../hooks/useScrubbedVideo': {useScrubbedVideo() {}},
  }, {window: {matchMedia: (query: string) => ({matches: query.includes('max-width') ? compact : reduced,
    addEventListener() {}, removeEventListener() {}})}});
  const Component = harness.load(fileURLToPath(new URL('../src/components/sections/FakeFooterStage.tsx', import.meta.url))).FakeFooterStage;
  const props = {copy: HOME_COPY.pt, locale: 'pt', footerPhraseIndex: 0, stageStyle: {}, shellStyle: {},
    portalLayerStyle: {}, entryProgress: 0, entryOpacity: 0, ambientOpacity: 0, ambientPlaying: false,
    footerProgress: 0, statementRotationActive: false, effectsActive: true, onProgress() {}};
  function render() {
    tree = harness.render(Component, props);
    previousRefs.forEach(ref => {ref.current = null;});
    previousRefs = [];
    const keys = new Set<string>();
    for (const node of elements(tree, (node: any) => Boolean(node.props?.ref) && typeof node.props.ref === 'object')) {
      const ref = node.props.ref;
      if (node.type === 'h2') {
        keys.add(node.key);
        if (!mounted.has(node.key)) {
          const spans = elements(node, (child: any) => child.props?.className === 'fake-footer-statement-char');
          const chars = spans.map((span: any) => ({text: span.props.children, autoAlpha: 1, y: 0, filter: 'blur(0px)', force3D: true}));
          mounted.set(node.key, {key: node.key, chars, querySelectorAll: () => chars});
        }
        ref.current = mounted.get(node.key);
      } else {
        ref.current = {querySelectorAll: () => [], parentElement: null};
      }
      previousRefs.push(ref);
    }
    for (const key of mounted.keys()) if (!keys.has(key)) mounted.delete(key);
    harness.flush();
  }
  function settle() {for (let i = 0; i < 4; i++) render();}
  settle();
  return {tweens, timelines,
    get incoming() {return [...mounted.values()].find(node => node.key.endsWith('-incoming'));},
    get outgoing() {return [...mounted.values()].find(node => node.key.endsWith('-outgoing'));},
    get tree() {return tree;},
    progress(value: number) {props.footerProgress = value;settle();},
    active(value: boolean) {props.effectsActive = value;settle();},
    rotation(value: boolean) {props.statementRotationActive = value;settle();},
    phrase(value: number) {props.footerPhraseIndex = value;settle();},
    flush: settle,
    dispose() {harness.dispose();realGsap.ticker.sleep();},
  };
}

function assertStable(node: any) {
  assert.ok(node.chars.every((c: any) => c.autoAlpha === 1 && c.y === 0 && c.filter === 'blur(0px)'));
}

test('does not consume offstage entrance; visible entry rises center-out and loses its blur', () => {
  const host = mount();
  try {
    assert.equal(host.tweens.length, 0);
    host.progress(.06);
    assert.equal(host.tweens.length, 1);
    host.progress(.08);
    assert.equal(host.tweens.length, 1, 'scroll within the window does not restart');
    const tween = host.tweens[0];tween.pause().progress(.25);
    const chars = host.incoming.chars;
    assert.ok(chars[Math.floor(chars.length / 2)].autoAlpha > chars[0].autoAlpha);
    tween.progress(1);
    assertStable(host.incoming);
  } finally {host.dispose();}
});

test('mobile entrance is shorter and unmount releases its tween', () => {
  const host = mount({compact: true});host.progress(.06);
  const tween = host.tweens[0];
  try {
    assert.equal(tween.vars.duration, .36);
    assert.equal(tween.vars.stagger.amount, .18);
    assert.ok(host.incoming.chars.every((char: any) => char.y === 8));
  } finally {host.dispose();}
  assert.equal(tween.parent, null);
});

test('reduced motion keeps newly keyed phrases clear and stationary without tweens', () => {
  const host = mount({reduced: true});
  try {
    host.progress(.2);host.rotation(true);
    const initial = host.incoming;host.phrase(1);
    assert.notEqual(host.incoming, initial);
    assertStable(host.incoming);
    assert.equal(host.outgoing, undefined);
    assert.equal(host.tweens.length + host.timelines.length, 0);
  } finally {host.dispose();}
});

test('new keyed phrases dissolve upward before their own center-out entrance, without a 3D drum', () => {
  const host = mount();
  try {
    host.progress(.2);host.tweens[0].pause().progress(1);host.rotation(true);
    const initial = host.incoming;host.phrase(1);
    const incoming = host.incoming;const outgoing = host.outgoing;
    assert.notEqual(incoming, initial);
    assert.notEqual(incoming.chars, outgoing.chars);
    assert.ok(incoming.chars.every((c: any) => c.autoAlpha === 0 && c.y === 12 && c.filter === 'blur(3px)'));
    assert.equal(host.timelines.length, 1);
    const timeline = host.timelines[0].pause();
    const [exit, entry] = timeline.getChildren(false, true, false);
    assert.deepEqual(exit.targets(), outgoing.chars);
    assert.deepEqual(entry.targets(), incoming.chars);
    assert.equal(exit.vars.stagger.from, 'edges');
    assert.equal(entry.vars.stagger.from, 'center');
    assert.equal(entry.startTime(), exit.totalDuration() + .06);
    timeline.time(exit.totalDuration());
    assert.ok(outgoing.chars.every((c: any) => c.autoAlpha === 0 && c.y === -12 && c.filter === 'blur(3px)'));
    assert.ok(incoming.chars.every((c: any) => c.autoAlpha === 0));
    timeline.progress(1);host.flush();
    assert.equal(host.outgoing, undefined);
    assert.equal(host.incoming, incoming, 'completion must not remount the entering phrase');
    assertStable(incoming);
    assert.equal(elements(host.tree, (node: any) => node.props?.className === 'fake-footer-statement-drum').length, 0);
  } finally {host.dispose();}
});

test('enabling phrase cycling during the initial entrance does not restart it', () => {
  const host = mount();
  try {
    host.progress(.06);
    const first = host.tweens[0].pause().progress(.25);
    host.progress(.2);host.rotation(true);
    assert.equal(host.tweens.length, 1, 'rotation gate is not a new keyed phrase');
    assert.notEqual(first.parent, null);
    first.progress(1);assertStable(host.incoming);
  } finally {host.dispose();}
});

test('hidden tab, offstage, and blackout interrupt phrase transitions without replaying or leaving outgoing nodes', () => {
  for (const stop of ['hidden', 'offstage', 'blackout', 'rotation'] as const) {
    const host = mount();
    try {
      host.progress(.2);host.tweens[0].pause().progress(1);host.rotation(true);host.phrase(1);
      const timeline = host.timelines[0].pause().progress(.4);
      const incoming = host.incoming;
      if (stop === 'hidden') host.active(false);
      else if (stop === 'rotation') host.rotation(false);
      else host.progress(stop === 'blackout' ? .94 : .02);
      assert.equal(timeline.parent, null, `${stop} must release the timeline`);
      assert.equal(host.outgoing, undefined);
      assertStable(incoming);
      timeline.vars.onComplete();host.flush();
      host.active(true);host.progress(.2);host.rotation(true);
      assert.equal(host.timelines.length, 1, 'cancelled phrase settles, rather than replaying on return');
      assert.equal(host.incoming, incoming);
    } finally {host.dispose();}
  }
});

test('rapid phrase replacement kills stale callbacks and unmount releases the current transition', () => {
  const host = mount();
  let current: any;
  try {
    host.progress(.2);host.tweens[0].pause().progress(1);host.rotation(true);host.phrase(1);
    const first = host.timelines[0].pause().progress(.3);
    host.phrase(2);current = host.timelines[1].pause();
    assert.equal(first.parent, null);
    const incoming = host.incoming;const outgoing = host.outgoing;
    first.vars.onComplete();host.flush();
    assert.equal(host.incoming, incoming);
    assert.equal(host.outgoing, outgoing, 'stale completion cannot remove another transition layer');
    assert.ok(incoming.chars.every((c: any) => c.autoAlpha === 0 && c.filter === 'blur(3px)'));
  } finally {host.dispose();}
  assert.equal(current.parent, null);
});

test('hidden interruption releases entrance, completed entrance is not replayed, and reentry rearms', () => {
  const host = mount();
  try {
    host.progress(.06);
    const first = host.tweens.at(-1);first.pause().progress(.25);
    host.active(false);assert.equal(first.parent, null);
    host.active(true);
    const second = host.tweens.at(-1);assert.notEqual(second, first);second.pause().progress(1);
    const count = host.tweens.length;
    host.active(false);host.active(true);assert.equal(host.tweens.length, count);
    host.progress(0);host.progress(.06);assert.equal(host.tweens.length, count + 1);
    host.progress(.94);assert.equal(host.tweens.at(-1).parent, null);
  } finally {host.dispose();}
});
