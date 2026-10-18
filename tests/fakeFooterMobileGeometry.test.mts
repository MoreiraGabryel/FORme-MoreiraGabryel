import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import test from 'node:test';
import postcss, {type Root} from 'postcss';
import * as scenes from '../src/config/scenes.ts';
import {getFakeFooterHandoffOverlap} from '../src/utils/fakeFooterHandoff.ts';

// Code-level geometry models only: not native layout, content sizing, or GSAP execution.
const baseCss = postcss.parse(readFileSync(new URL('../src/index.css', import.meta.url), 'utf8'));
const mobileCssUrl = new URL('../src/components/sections/FakeFooterStage.mobile.css', import.meta.url);
const mobileWidths = [320, 640, 641, 767];
const rootFontSizes = [14, 16, 20];
const selectors = ['.fake-footer-flow', '.fake-footer-stage', '.fake-footer-sticky', '.fake-footer-surface', '.fake-footer-media'];

type Viewport = {stable: number; large: number; dynamic: number; rootFont: number};
type Variables = Record<string, string | number>;
type Declarations = Record<string, string>;

function mobileCss() {
  assert.ok(existsSync(mobileCssUrl), 'missing FakeFooterStage.mobile.css');
  return postcss.parse(readFileSync(mobileCssUrl, 'utf8'));
}

// Deliberately narrow evaluator: only these geometry units, functions, and multiplication.
// Fail closed on any unsupported expression; never execute CSS as JavaScript.
function pixels(value: string, viewport: Viewport, variables: Variables = {}): number {
  const expression = value.trim();
  const variable = /^var\((--[\w-]+)\)$/.exec(expression);
  if (variable) {
    const resolved = variables[variable[1]];
    assert.notEqual(resolved, undefined, `unresolved ${expression}`);
    return typeof resolved === 'number' ? resolved : pixels(resolved, viewport, variables);
  }
  const fn = /^(calc|max|clamp)\((.*)\)$/.exec(expression);
  if (fn) {
    const values = postcss.list.comma(fn[2]).map(part => pixels(part, viewport, variables));
    if (fn[1] === 'calc') {
      assert.equal(values.length, 1);
      return values[0];
    }
    if (fn[1] === 'max') return Math.max(...values);
    assert.equal(values.length, 3);
    return Math.max(values[0], Math.min(values[1], values[2]));
  }
  const factors = postcss.list.split(expression, ['*'], false);
  if (factors.length > 1) {
    return factors.reduce((result, part) => result * pixels(part, viewport, variables), 1);
  }
  const number = /^(-?\d+(?:\.\d+)?)(px|rem|lvh|dvh|vh)?$/.exec(expression);
  assert.ok(number, `unsupported geometry expression: ${expression}`);
  const unitSize = {
    px: 1,
    rem: viewport.rootFont,
    vh: viewport.large / 100,
    lvh: viewport.large / 100,
    dvh: viewport.dynamic / 100,
  };
  return Number(number[1]) * (number[2] ? unitSize[number[2] as keyof typeof unitSize] : 1);
}

function declarations(roots: Root[], selector: string, width: number): Declarations {
  const result: Declarations = {};
  for (const root of roots) {
    root.walkRules(rule => {
      if (!rule.selectors.includes(selector)) return;
      for (let parent = rule.parent; parent && parent.type !== 'root'; parent = parent.parent) {
        assert.equal(parent.type, 'atrule', 'geometry model does not support nested selectors');
        if (parent.type !== 'atrule') return;
        assert.equal(parent.name, 'media', 'unsupported geometry at-rule');
        const query = /^\((max|min)-width:\s*([\d.]+)px\)$/.exec(parent.params);
        assert.ok(query, `unsupported geometry media query: ${parent.params}`);
        if (query[1] === 'max' ? width > Number(query[2]) : width < Number(query[2])) return;
      }
      rule.walkDecls(declaration => {
        assert.notEqual(declaration.important, true, 'geometry must not fight inline pin styles');
        result[declaration.prop] = declaration.value;
      });
    });
  }
  return result;
}

function geometry(width: number, viewport: Viewport, mobile = mobileCss()) {
  const roots = [baseCss, mobile];
  const flow = declarations(roots, '.fake-footer-flow', width);
  const variables: Variables = {
    '--stable-vh': viewport.stable,
    '--fake-footer-handoff-overlap': flow['--fake-footer-handoff-overlap'],
  };
  const value = (selector: string, property: string, fallback = '0px') =>
    pixels(declarations(roots, selector, width)[property] ?? fallback, viewport, variables);
  return {
    overlap: pixels(flow['--fake-footer-handoff-overlap'], viewport, variables),
    marginTop: value('.fake-footer-flow', 'margin-top'),
    marginBottom: value('.fake-footer-flow', 'margin-bottom'),
    stage: value('.fake-footer-stage', 'min-height'),
    sticky: value('.fake-footer-sticky', 'min-height'),
    stickyTop: value('.fake-footer-sticky', 'top'),
    surface: value('.fake-footer-surface', 'min-height'),
    media: value('.fake-footer-media', 'height'),
  };
}

test('mobile and desktop pin distance use the same viewport-relative formula', () => {
  const distance = (scenes as unknown as Record<string, unknown>).getFakeFooterScrollDistance;
  assert.equal(typeof distance, 'function', 'missing getFakeFooterScrollDistance export');
  const scrollDistance = distance as (height: number) => number;

  for (const height of [320, 400, 640, 700, 767, 844, 1040, 1200, 1440, 700.25]) {
    assert.equal(
      scrollDistance(height),
      Math.round(scenes.FAKE_FOOTER_SCENE.lengthInViewports * height),
    );
  }
});

test('geometry evaluator handles CSS math without evaluating arbitrary code', () => {
  const viewport = {stable: 700, large: 844, dynamic: 700, rootFont: 16};
  assert.equal(pixels('clamp(72px, calc(var(--stable-vh) * 0.13), 128px)', viewport, {'--stable-vh': 700}), 91);
  assert.equal(pixels('max(var(--stable-vh), 100lvh)', viewport, {'--stable-vh': 700}), 844);
  assert.equal(pixels('max(var(--stable-vh), 100dvh)', viewport, {'--stable-vh': 700}), 700);
  assert.equal(pixels('4.5rem', viewport), 72);
  assert.equal(pixels('calc(91px * -1)', viewport), -91);
  assert.throws(() => pixels('process.exit(1)', viewport), /unsupported geometry expression/);
  assert.throws(() => pixels('100svh', viewport), /unsupported geometry expression/);
  assert.throws(() => pixels('var(--unknown)', viewport), /unresolved/);
});

test('stylesheet scopes geometry and exit visibility to mobile without transforming the pin', () => {
  const css = mobileCss();
  const rules = css.nodes.filter(node => node.type !== 'comment');
  assert.equal(rules.length, 2);
  for (const rule of rules) {
    assert.equal(rule.type, 'atrule');
    if (rule.type !== 'atrule') return;
    assert.equal(rule.name, 'media');
    assert.ok(['(max-width: 767.98px)', '(max-width: 640px)'].includes(rule.params));
  }
  const allowed: Record<string, string[]> = {
    '.fake-footer-flow': ['--fake-footer-handoff-overlap', 'margin-bottom'],
    '.fake-footer-stage': ['min-height'],
    '.fake-footer-sticky': ['min-height', '--fake-footer-entry-feather'],
    '.fake-footer-surface': ['min-height', 'row-gap', 'padding-top'],
    '.fake-footer-media': ['height', 'bottom'],
    '.fake-footer-left-column .fake-footer-cta-block': ['transform'],
    '.fake-footer-exit-blackout': ['z-index', 'transition'],
    '.fake-footer-stage[data-mobile-exited] .fake-footer-sticky': ['opacity', 'visibility', 'pointer-events'],
  };
  css.walkRules(rule => {
    assert.ok(rules.some(parent => parent === rule.parent), 'all overrides must be inside a mobile media rule');
    for (const selector of rule.selectors) {
      assert.ok(allowed[selector], `out-of-scope selector: ${selector}`);
      rule.walkDecls(declaration => {
        assert.ok(allowed[selector].includes(declaration.prop), `out-of-scope property: ${declaration.prop}`);
      });
    }
  });
});

test('mobile overlap matches the real JS helper at font sizes 14/16/20 and widths 320/640/641/767', () => {
  const css = mobileCss();
  for (const width of mobileWidths) for (const rootFont of rootFontSizes) {
    for (const stable of [400, 553.8, 700, 844, 984.6, 1200]) {
      const actual = geometry(width, {stable, large: 1200, dynamic: 844, rootFont}, css);
      const expected = getFakeFooterHandoffOverlap(stable);
      assert.ok(Math.abs(actual.overlap - expected) <= 0.5, `${width}px/${rootFont}px/${stable}px overlap`);
      assert.ok(actual.overlap >= 72 && actual.overlap <= 128);
      assert.equal(actual.marginTop, -actual.overlap);
      assert.equal(actual.stickyTop, -actual.overlap);
    }
  }
});

test('outer allocation covers 844px while content stays at 700px through toolbar changes', () => {
  const css = mobileCss();
  for (const width of mobileWidths) for (const rootFont of rootFontSizes) {
    const states = [700, 744, 800, 844].map(dynamic =>
      geometry(width, {stable: 700, large: 844, dynamic, rootFont}, css),
    );
    assert.equal(states[0].surface, 700);
    assert.equal(states.at(-1)!.surface, 700);
    for (const state of states) {
      assert.equal(state.stage, 844);
      assert.equal(state.sticky, 844);
      assert.ok(state.surface <= state.sticky);
      assert.equal(state.surface, 700);
      // Pin captures the large envelope before toolbar movement, even with resize refresh ignored.
      const capturedInlineHeight = states[0].sticky;
      const capturedInlineMaxHeight = states[0].sticky;
      const pinnedHeight = Math.max(state.sticky, Math.min(capturedInlineHeight, capturedInlineMaxHeight));
      assert.equal(pinnedHeight, 844);
      assert.ok(state.surface <= pinnedHeight);
    }
    for (const stable of [400, 844, 900]) {
      const state = geometry(width, {stable, large: 844, dynamic: 700, rootFont}, css);
      assert.equal(state.stage, Math.max(stable, 844));
      assert.ok(state.surface <= state.sticky);
    }
  }
});

test('background covers the large viewport without resizing the content surface', () => {
  const css = mobileCss();
  for (const width of mobileWidths) for (const rootFont of rootFontSizes) {
    assert.equal(declarations([baseCss, css], '.fake-footer-media', width).bottom, 'auto');
    for (const dynamic of [700, 844]) {
      const state = geometry(width, {stable: 700, large: 844, dynamic, rootFont}, css);
      assert.equal(state.media, state.sticky);
      assert.equal(state.media, 844);
      assert.equal(state.surface, 700);
    }
  }
});

test('negative bottom margin compensates the relative sticky offset at the next section boundary', () => {
  const css = mobileCss();
  for (const width of mobileWidths) for (const rootFont of rootFontSizes) {
    for (const dynamic of [700, 844]) {
      const state = geometry(width, {stable: 700, large: 844, dynamic, rootFont}, css);
      for (const pinSpacing of [0, scenes.getFakeFooterScrollDistance(700)]) {
        const renderedStickyEnd = state.marginTop + state.stickyTop + state.sticky + pinSpacing;
        const nextSectionStart = state.marginTop + state.stage + pinSpacing + state.marginBottom;
        assert.equal(nextSectionStart, renderedStickyEnd, 'no trailing relative-offset gap');
        assert.equal(state.marginBottom, state.stickyTop);
      }
    }
  }
});

test('768px and wider keep every original fake-footer declaration and desktop geometry', () => {
  const css = mobileCss();
  for (const width of [768, 980, 1440]) for (const rootFont of rootFontSizes) {
    for (const selector of selectors) {
      assert.deepEqual(
        declarations([baseCss, css], selector, width),
        declarations([baseCss], selector, width),
        `${selector} at ${width}px`,
      );
    }
    const viewport = {stable: 700, large: 844, dynamic: 844, rootFont};
    const flow = declarations([baseCss, css], '.fake-footer-flow', width);
    assert.equal(
      pixels(flow['--fake-footer-handoff-overlap'], viewport),
      Math.max(4.5 * rootFont, Math.min(844 * 0.13, 8 * rootFont)),
    );
    assert.equal(pixels(declarations([baseCss, css], '.fake-footer-sticky', width)['min-height'], viewport, {'--stable-vh': 700}), 700);
  }
});
