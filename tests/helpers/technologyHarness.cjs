const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Run the actual TS/TSX with a narrow hook/element host, not a browser.
// Dependencies (Lenis/DOM surfaces) can be supplied at their external seams.
function createHarness(overrides = {}, globals = {}) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const memo = (factory, deps) => {
    const index = cursor++;
    if (!slots[index] || !same(slots[index].deps, deps)) slots[index] = {value: factory(), deps};
    return slots[index].value;
  };
  const effect = (setup, deps) => {
    const index = cursor++;
    if (!slots[index] || !same(slots[index].deps, deps)) {
      effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = {deps, cleanup: setup()};
      });
    }
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = {value: typeof initial === 'function' ? initial() : initial};
      return [slots[index].value, (value) => {
        slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
      }];
    },
    useRef: (value) => memo(() => ({current: value}), []),
    useMemo: memo,
    useCallback: (fn, deps) => memo(() => fn, deps),
    useEffect: effect,
    useLayoutEffect: effect,
  };
  const element = (type, props, key) => ({type, props, key});
  const cache = new Map();
  const mocks = {react, 'react/jsx-runtime': {jsx: element, jsxs: element}, 'react-dom': {createPortal: (tree) => tree}, ...overrides};
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = {exports: {}};
    cache.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
    }}).outputText;
    const localRequire = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (!id.startsWith('.')) return require(id);
      const base = path.resolve(path.dirname(filename), id);
      const target = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => fs.existsSync(candidate));
      return load(target);
    };
    vm.runInNewContext('(function(require,module,exports){' + code + '\n})', {
      console, performance, ...globals,
    }, {filename})(localRequire, module, module.exports);
    return module.exports;
  }
  return {
    load,
    render(component, props) { cursor = 0; return component(props); },
    flush() { const pending = effects; effects = []; pending.forEach((run) => run()); },
    dispose() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}
function elements(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap((item) => elements(item, predicate));
  return [...(predicate(tree) ? [tree] : []), ...elements(tree.props?.children, predicate)];
}
module.exports = {createHarness, elements};
