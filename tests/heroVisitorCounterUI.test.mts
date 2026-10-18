import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createHarness, elements} from './helpers/technologyHarness.cjs';

const componentUrl = new URL('../src/components/common/HeroVisitorCounter.tsx', import.meta.url);
const requestUrl = new URL('../src/utils/heroVisitCounter.ts', import.meta.url);

function mount({hidden = false, reducedMotion = false} = {}) {
  assert.ok(existsSync(componentUrl), 'The discrete Hero counter component has not been implemented');
  const listeners = new Map();
  const motion = [];
  let requests = 0;
  let reverts = 0;
  const document = {hidden, addEventListener: (name, listener) => listeners.set(name, listener), removeEventListener: name => listeners.delete(name)};
  const timeline = {fromTo(...args) {motion.push(args);return this;}, progress() {return this;}};
  const host = createHarness({gsap: {gsap: {
    context(callback) {callback();return {revert() {reverts++;}};},
    timeline() {return timeline;},
  }}}, {document, window: {matchMedia: () => ({matches: reducedMotion, addEventListener() {}, removeEventListener() {}})},
    fetch: async () => {requests++;return new Response(JSON.stringify({previous: 124, total: 125}));}});
  const {HeroVisitorCounter} = host.load(fileURLToPath(componentUrl));
  const counter = host.load(fileURLToPath(requestUrl));
  const props = {active: false, locale: 'pt'};
  let tree;
  const render = () => {
    tree = host.render(HeroVisitorCounter, props);
    elements(tree, element => element.props.ref).forEach(element => {element.props.ref.current = {style: {}};});
    host.flush();
    return tree;
  };
  return {props, motion, render, get requests() {return requests;}, get reverts() {return reverts;},
    async settle() {await counter.countHeroVisitOnce();return render();},
    visibility(hidden) {document.hidden = hidden;listeners.get('visibilitychange')?.();return render();},
    dispose() {host.dispose();}};
}

test('only an active visible Hero registers and rolls the server total once', async () => {
  const host = mount();
  try {
    assert.equal(host.render(), null);
    assert.equal(host.requests, 0);
    host.props.active = true;
    host.render();
    assert.equal(host.requests, 1);
    const tree = await host.settle();
    assert.equal(tree.props['aria-label'], '125 visitas ao site');
    assert.equal(elements(tree, node => node.type === 'svg').length, 1);
    assert.deepEqual(Array.from(elements(tree, node => node.props.className?.includes('__previous')), node => node.props.children), ['124']);
    assert.deepEqual(Array.from(elements(tree, node => node.props.className?.includes('__current')), node => node.props.children), ['125']);
    assert.equal(host.motion.length, 2);
    host.props.active = false;host.render();
    host.props.active = true;host.render();await host.settle();
    host.props.locale = 'en';
    assert.equal(host.render().props['aria-label'], '125 site visits');
    assert.equal(host.requests, 1);
    assert.equal(host.motion.length, 2);
  } finally {host.dispose();}
});

test('hidden arrivals wait for visibility and reduced motion shows the final total without a tween', async () => {
  const host = mount({hidden: true, reducedMotion: true});
  try {
    host.props.active = true;host.render();
    assert.equal(host.requests, 0);
    host.visibility(false);
    assert.equal(host.requests, 1);
    const tree = await host.settle();
    assert.equal(tree.props['aria-label'], '125 visitas ao site');
    assert.equal(host.motion.length, 0);
  } finally {host.dispose();}
});

test('hiding the page releases the roll and returning does not count or animate again', async () => {
  const host = mount();
  try {
    host.props.active = true;host.render();await host.settle();
    assert.equal(host.motion.length, 2);
    host.visibility(true);
    assert.equal(host.reverts, 1);
    host.visibility(false);await host.settle();
    assert.equal(host.requests, 1);
    assert.equal(host.motion.length, 2);
  } finally {host.dispose();}
});
