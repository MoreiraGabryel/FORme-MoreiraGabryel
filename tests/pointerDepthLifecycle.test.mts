import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {gsap as realGsap} from 'gsap';
import {createHarness} from './helpers/technologyHarness.cjs';

function mount({desktop = true, reduced = false} = {}) {
  const surface = Object.assign(new EventTarget(), {getBoundingClientRect: () => ({left: 0, top: 0, width: 1000, height: 700})});
  const target = {x: 0, y: 0, scale: 1, force3D: true, willChange: ''};
  const document = Object.assign(new EventTarget(), {hidden: false});
  const window = new EventTarget();
  const mediaQueries: any[] = [];
  let refreshMedia = () => {};
  const gsap = {...realGsap, matchMedia() {
    const contexts: any[] = [];
    return {add(queries: any, callback: any) {
      mediaQueries.push(queries);
      refreshMedia = () => {
        contexts.splice(0).forEach(ctx => ctx.revert());
        contexts.push(realGsap.context(() => callback({conditions: {desktop, reduced}})));
      };
      refreshMedia();
    }, revert() {contexts.forEach(ctx => ctx.revert());}};
  }};
  const harness = createHarness({gsap: {gsap}}, {document, window});
  let hook: any;
  try {hook = harness.load(fileURLToPath(new URL('../src/hooks/usePointerDepth.ts', import.meta.url))).usePointerDepth;}
  catch {assert.fail('pointer-depth hook must exist');}
  const surfaceRef = {current: surface};
  const targetRef = {current: target};
  let strength = 1;
  const render = () => {harness.render(() => hook(surfaceRef, targetRef, strength));harness.flush();};
  render();
  return {target, mediaQueries,
    move(x: number, y: number, pointerType = 'mouse') {
      surface.dispatchEvent(Object.assign(new Event('pointermove'), {clientX: x, clientY: y, pointerType}));
    },
    settle() {realGsap.getTweensOf(target).forEach(tween => tween.pause().progress(1));},
    start() {realGsap.getTweensOf(target).forEach(tween => tween.pause().progress(0));},
    leave() {surface.dispatchEvent(new Event('pointerleave'));},
    hidden(value: boolean) {document.hidden = value;document.dispatchEvent(new Event('visibilitychange'));},
    capability(fine: boolean, reduce = false) {desktop = fine;reduced = reduce;refreshMedia();},
    blur() {window.dispatchEvent(new Event('blur'));},
    resize() {window.dispatchEvent(new Event('resize'));},
    strength(value: number) {strength = value;render();},
    dispose() {harness.dispose();realGsap.ticker.sleep();},
  };
}

test('desktop mouse drives a separate depth plane with GSAP; touch cannot move it', () => {
  const host = mount();
  try {
    assert.match(host.mediaQueries[0].desktop, /hover: hover/);
    assert.match(host.mediaQueries[0].desktop, /pointer: fine/);
    host.move(1000, 700);host.settle();
    assert.equal(host.target.x, -15);assert.equal(host.target.y, -10.5);
    assert.equal(host.target.scale, 1.052);
    host.leave();host.settle();
    assert.equal(host.target.x, 0);assert.equal(host.target.scale, 1);
    host.move(1000, 700, 'touch');host.settle();
    assert.equal(host.target.x, 0);
  } finally {host.dispose();}
});

test('handoff, hidden tab and cleanup remove pointer motion without stale replay', () => {
  const host = mount();
  try {
    host.move(1000, 700);host.settle();
    host.strength(0);
    assert.equal(host.target.x, 0);assert.equal(host.target.scale, 1);
    host.move(1000, 700);host.settle();assert.equal(host.target.x, 0);
    host.strength(1);host.move(1000, 700);host.settle();
    host.hidden(true);assert.equal(host.target.x, 0);assert.equal(host.target.scale, 1);
    host.move(1000, 700);host.settle();assert.equal(host.target.x, 0);
    host.hidden(false);host.settle();assert.equal(host.target.x, 0);
    host.move(0, 0);host.start();
    assert.equal(host.target.x, 0, 'resuming must start from neutral, not quickTo cached coordinates');
    assert.equal(host.target.scale, 1);
    host.settle();assert.ok(host.target.x > 0);
  } finally {host.dispose();}
  host.move(1000, 700);host.settle();
  assert.equal(host.target.x, 0);assert.equal(host.target.scale, 1);
  assert.equal(realGsap.getTweensOf(host.target).length, 0, 'real GSAP cleanup must not resurrect killed quickTo tweens');
});

test('capability changes release all old tweens and resize/blur clear cached pointer position', () => {
  const host = mount();
  try {
    host.move(1000, 700);host.settle();
    host.capability(false);
    assert.equal(realGsap.getTweensOf(host.target).length, 0);
    assert.equal(host.target.x, 0);assert.equal(host.target.scale, 1);
    host.capability(true);host.move(1000, 700);host.settle();
    host.blur();assert.equal(host.target.x, 0);assert.equal(host.target.scale, 1);
    host.move(0, 0);host.settle();
    host.resize();assert.equal(host.target.x, 0);assert.equal(host.target.scale, 1);
    host.move(1000, 700);host.settle();
    host.capability(true, true);
    assert.equal(realGsap.getTweensOf(host.target).length, 0);
    assert.equal(host.target.x, 0);assert.equal(host.target.scale, 1);
  } finally {host.dispose();}
  assert.equal(realGsap.getTweensOf(host.target).length, 0);
});

test('coarse/mobile and reduced-motion conditions never animate the depth plane', () => {
  for (const conditions of [{desktop: false}, {reduced: true}]) {
    const host = mount(conditions);
    try {
      host.move(1000, 700);host.settle();
      assert.equal(host.target.x, 0);assert.equal(host.target.scale, 1);
    } finally {host.dispose();}
  }
});
