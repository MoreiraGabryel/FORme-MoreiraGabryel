const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Minimal host for the installed React reconciler, not a browser/layout engine.
function createRestorationReactHost({reduced = false, width = 1440, height = 1000} = {}) {
  const frames = new Map(), timers = new Map();
  let id = 0;
  let doc, win;
  class Node extends EventTarget {
    constructor(name, type = 1) {
      super();this.nodeType = type;this.nodeName = type === 1 ? name.toUpperCase() : name;
      this.tagName = this.nodeName;this.localName = name;this.namespaceURI = 'http://www.w3.org/1999/xhtml';
      this.ownerDocument = doc;this.parentNode = null;this.childNodes = [];this.attributes = new Map();this.dataset = {};this.inert = false;
      const values = new Map();
      this.style = {setProperty: (n, v) => values.set(n, v), removeProperty: n => values.delete(n), getPropertyValue: n => values.get(n) ?? '', getPropertyPriority: () => ''};
    }
    get firstChild() {return this.childNodes[0] ?? null;}
    get lastChild() {return this.childNodes.at(-1) ?? null;}
    get nextSibling() {const nodes = this.parentNode?.childNodes ?? [];return nodes[nodes.indexOf(this) + 1] ?? null;}
    appendChild(node) {node.parentNode?.removeChild(node);this.childNodes.push(node);node.parentNode = this;return node;}
    insertBefore(node, before) {if (!before) return this.appendChild(node);node.parentNode?.removeChild(node);this.childNodes.splice(this.childNodes.indexOf(before), 0, node);node.parentNode = this;return node;}
    removeChild(node) {this.childNodes.splice(this.childNodes.indexOf(node), 1);node.parentNode = null;return node;}
    setAttribute(name, value) {this.attributes.set(name, String(value));}
    removeAttribute(name) {this.attributes.delete(name);}
    getAttribute(name) {return this.attributes.get(name) ?? null;}
    get textContent() {return this._text ?? this.childNodes.map(n => n.textContent).join('');}
    set textContent(value) {this._text = String(value);for (const n of this.childNodes) n.parentNode = null;this.childNodes = [];}
    get isConnected() {return this === doc || Boolean(this.parentNode?.isConnected);}
    closest() {return null;}
    focus() {doc.activeElement = this;}
    getBoundingClientRect() {const cls = this.getAttribute('class');return {width, height, left: 0, top: (cls === 'technology-flow' ? 4500 : cls === 'fake-footer-flow' ? 12220 : 0) - win.scrollY};}
  }
  doc = new Node('#document', 9);doc.ownerDocument = null;
  doc.createElement = name => new Node(name);
  doc.createElementNS = (_ns, name) => new Node(name);
  doc.createTextNode = text => {const n = new Node('#text', 3);n.nodeValue = text;n.textContent = text;return n;};
  doc.hidden = false;doc.visibilityState = 'visible';
  doc.documentElement = new Node('html');doc.appendChild(doc.documentElement);
  doc.body = new Node('body');doc.documentElement.appendChild(doc.body);doc.activeElement = doc.body;
  const container = new Node('div');container.setAttribute('id', 'root');doc.body.appendChild(container);
  doc.getElementById = id => {
    const visit = n => n.getAttribute('id') === id ? n : n.childNodes.map(visit).find(Boolean);
    return visit(doc.documentElement) ?? null;
  };
  win = Object.assign(new EventTarget(), {
    document: doc, scrollY: 16000, scrollX: 0, innerWidth: width, innerHeight: height, location: {pathname: '/'},
    HTMLElement: Node, HTMLIFrameElement: class {},
    matchMedia: query => Object.assign(new EventTarget(), {matches: query.includes('reduced-motion') ? reduced : false}),
    requestAnimationFrame(fn) {frames.set(++id, fn);return id;}, cancelAnimationFrame(key) {frames.delete(key);},
    setInterval(fn, delay) {timers.set(++id, {fn, delay});return id;},clearInterval(key) {timers.delete(key);},
    scrollTo({top, left}) {win.scrollY = top;win.scrollX = left;win.dispatchEvent(new Event('scroll'));},
  });doc.defaultView = win;
  const saved = {window: global.window, document: global.document, Image: global.Image};
  Object.assign(global, {window: win, document: doc, Image: class {}});
  const React = require('react'), ReactDOM = require('react-dom'), {createRoot} = require('react-dom/client');
  const cache = new Map();
  function loader(overrides = {}) {
    function load(filename) {
      if (cache.has(filename)) return cache.get(filename).exports;
      if (filename.endsWith('.css')) return {};
      const module = {exports: {}};cache.set(filename, module);
      const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022}}).outputText;
      const localRequire = name => {
        if (Object.hasOwn(overrides, name)) return overrides[name];
        if (!name.startsWith('.')) return require(name);
        const base = path.resolve(path.dirname(filename), name);
        return load([base, `${base}.ts`, `${base}.tsx`].find(f => fs.existsSync(f)));
      };
      vm.runInNewContext('(function(require,module,exports){' + code + '\n})', {console, performance, window: win, document: doc, Image: global.Image, Event, CustomEvent, AbortController}, {filename})(localRequire, module, module.exports);
      return module.exports;
    }
    return load;
  }
  const root = createRoot(container);
  return {React, ReactDOM, win, doc, container, frames, timers, loader,
    render(Component) {ReactDOM.flushSync(() => root.render(React.createElement(Component)));},
    frame() {const batch = [...frames.values()];frames.clear();batch.forEach(fn => fn(0));},
    async dispose() {
      ReactDOM.flushSync(() => root.unmount());
      // Let the installed scheduler drain its already queued host callbacks.
      await new Promise(resolve => setImmediate(resolve));
      Object.assign(global, saved);
    },
  };
}
module.exports = {createRestorationReactHost};
