import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createHarness, elements} from './helpers/technologyHarness.cjs';

function mount({width = 390, progress = 0.6, reducedMotion = false} = {}) {
  let nextFrame = 0;
  const frames = new Map<number, (time: number) => void>();
  const host = createHarness({
    gsap: {gsap: {registerPlugin() {}}},
    'gsap/ScrollTrigger': {ScrollTrigger: {}},
    'gsap/SplitText': {SplitText: {}},
  }, {
    window: {
      innerWidth: width, innerHeight: 844,
      matchMedia: (query: string) => ({matches: query.includes('max-width') ? width < 768 : query.includes('reduced-motion') && reducedMotion,
        addEventListener() {}, removeEventListener() {}}),
      requestAnimationFrame(callback: (time: number) => void) {const id = ++nextFrame;frames.set(id, callback);return id;},
      cancelAnimationFrame(id: number) {frames.delete(id);},
    },
    document: {hidden: false},
    Math: Object.assign(Object.create(Math), {random: () => 0.43}),
  });
  const {TechnologyAndAboutStage} = host.load(fileURLToPath(new URL('../src/components/sections/TechnologyAndAboutStage.tsx', import.meta.url)));
  const {TECHNOLOGIES} = host.load(fileURLToPath(new URL('../src/config/technologies.ts', import.meta.url)));
  const {getTechnologyPages} = host.load(fileURLToPath(new URL('../src/utils/technologyStackLayout.ts', import.meta.url)));
  const pages = getTechnologyPages(TECHNOLOGIES, width < 768);
  const props = {locale: 'pt', rawStageProgress: progress, stageStyle: {}, onProgress() {}};
  let tree;
  let previousAnchors = [];
  let pairs = [];
  const render = () => {
    tree = host.render(TechnologyAndAboutStage, props);
    previousAnchors.forEach(anchor => {
      anchor.props.ref(null);
      elements(anchor, node => node.props?.className === 'technology-float-button')[0].props.ref(null);
    });
    const field = elements(tree, node => node.props?.className === 'technologies-float-field')[0];
    field.props.ref.current = {getBoundingClientRect: () => ({width: width - 16, height: 720})};
    previousAnchors = elements(tree, node => node.props?.className?.startsWith('technology-float-anchor'));
    pairs = previousAnchors.map(anchor => {
      const button = elements(anchor, node => node.props?.className === 'technology-float-button')[0];
      const anchorNode = {style: {opacity: '0', transform: ''}};
      const buttonNode = {style: {}, offsetWidth: 44, offsetHeight: 44};
      anchor.props.ref(anchorNode);button.props.ref(buttonNode);
      return {label: button.props['aria-label'], anchor: anchorNode, button};
    });
    host.flush();
  };
  render();
  return {
    pages,
    get pairs() {return pairs;},
    frame(time = 100) {const pending = [...frames.values()];frames.clear();pending.forEach(callback => callback(time));},
    changePage(direction: 'next' | 'previous') {
      const label = direction === 'next' ? 'Próximo grupo' : 'Grupo anterior';
      const button = elements(tree, node => node.props?.['aria-label'] === label)[0];
      assert.ok(button && !button.props.disabled, `${label} must be available`);
      button.props.onClick();render();
    },
    progress(value: number) {props.rawStageProgress = value;render();},
    dispose() {host.dispose();},
  };
}

function expectVisiblePage(host, pageIndex) {
  assert.deepEqual(Array.from(host.pairs, (pair: {label: string}) => pair.label).sort(), Array.from(host.pages[pageIndex], (item: {label: string}) => item.label).sort());
  for (const pair of host.pairs) {
    assert.ok(Number(pair.anchor.style.opacity) > 0.5,
      `selected page ${pageIndex + 1}: ${pair.label} remains hidden at opacity ${pair.anchor.style.opacity}`);
    assert.match(pair.anchor.style.transform, /translate3d\(/);
    assert.equal(pair.button.props.disabled, false);
    const icon = elements(pair.button, node => node.props?.className === 'technology-inline-icon')[0];
    assert.equal(icon.props.src, host.pages[pageIndex].find(item => item.label === pair.label).icon);
  }
}

test('all mobile groups keep their catalog icons visible going forward and back without scrolling', () => {
  const host = mount();
  try {
    const seen = new Set<string>();
    for (let page = 0; page < host.pages.length; page++) {
      if (page) host.changePage('next');
      host.frame();expectVisiblePage(host, page);
      host.pages[page].forEach(item => seen.add(item.id));
    }
    assert.equal(seen.size, host.pages.flat().length);
    for (let page = host.pages.length - 2; page >= 0; page--) {
      host.changePage('previous');host.frame();expectVisiblePage(host, page);
    }
  } finally {host.dispose();}
});

test('manually selected mobile groups do not remain hidden behind the global scroll entrance', () => {
  for (const reducedMotion of [false, true]) {
    for (const width of [320, 390, 430, 767]) {
      const host = mount({width, progress: 0.03, reducedMotion});
      try {
        for (let page = 1; page < host.pages.length; page++) {
          host.changePage('next');host.frame();expectVisiblePage(host, page);
        }
        for (let page = host.pages.length - 2; page >= 0; page--) {
          host.changePage('previous');host.frame();expectVisiblePage(host, page);
        }
      } finally {host.dispose();}
    }
  }
});

test('desktop keeps its complete catalog and original scroll-controlled entrance', () => {
  const host = mount({width: 1280, progress: 0.03});
  try {
    assert.equal(host.pages.length, 1);
    assert.equal(host.pairs.length, host.pages[0].length);
    host.frame();
    assert.ok(host.pairs.every(pair => Number(pair.anchor.style.opacity) === 0));
    host.progress(0.6);host.frame();expectVisiblePage(host, 0);
  } finally {host.dispose();}
});
