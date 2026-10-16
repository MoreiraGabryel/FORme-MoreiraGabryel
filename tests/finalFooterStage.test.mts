import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {createHarness, elements} from './helpers/technologyHarness.cjs';
import {IDBFactory} from 'fake-indexeddb';

function setup({count = 0, enabled = true, reduced = false} = {}) {
  let now = 0, id = 0;
  const timers = new Map<number, {at: number; run: () => void}>();
  const rafs = new Map<number, () => void>();
  const query = Object.assign(new EventTarget(), {matches: reduced});
  const storage = new Map([['moreiragabryel:footer-scene:v1', String(count)]]);
  const document = Object.assign(new EventTarget(), {hidden: false, body: {},documentElement: {dataset: {}}});
  const visualViewport = Object.assign(new EventTarget(), {height:800,offsetTop:0});
  const window = Object.assign(new EventTarget(), {
    innerHeight:800,visualViewport,
    matchMedia: () => query,
    localStorage: {getItem: (key: string) => storage.get(key) ?? null,setItem: (key: string,value: string) => storage.set(key,value)},
    requestAnimationFrame(callback: () => void) {const token=++id;rafs.set(token,callback);return token;},
    cancelAnimationFrame(token: number) {rafs.delete(token);},
  });
  class Video extends EventTarget {
    currentTime=0;duration=10.055556;muted=false;loop=false;playsInline=false;playbackRate=1;
    preload='none';plays=0;loads=0;paused=true;
    play() {this.plays++;this.paused=false;return Promise.resolve();}
    pause() {this.paused=true;}
    load() {this.loads++;}
  }
  const video=new Video();
  const overlay={hidden:true,dataset:{} as Record<string,string>,style:{setProperty() {}}};
  let top=1600;
  const section={getBoundingClientRect: () => ({top,bottom:top+800,height:800})};
  let locks=0,releases=0,returns=0;
  const host=createHarness({'./FinalFooterStage.css': {},'../../utils/footerSceneInputLock': {acquireFooterSceneInputLock() {locks++;return {returnToTop() {returns++;top=1600;},release() {releases++;}};}}}, {
    document,window,indexedDB: new IDBFactory(),AbortController,
    setTimeout(run: () => void,delay:number) {const token=++id;timers.set(token,{at:now+delay,run});return token;},
    clearTimeout(token:number) {timers.delete(token);},performance:{now:() => now},
  });
  const pending: Promise<boolean>[] = [];
  const policy = host.load(fileURLToPath(new URL('../src/utils/footerScenePolicy.ts', import.meta.url)));
  const createCounter = policy.createFooterVisitCounter;
  policy.createFooterVisitCounter = (...args: any[]) => {
    const counter = createCounter(...args);
    return {...counter, consume(...args: [signal?: AbortSignal, onCommitted?: () => void]) {
      const result = counter.consume(...args);pending.push(result);return result;
    }};
  };
  let Component:any;
  try {Component=host.load(fileURLToPath(new URL('../src/components/sections/FinalFooterStage.tsx',import.meta.url))).FinalFooterStage;}
  catch {assert.fail('the final footer component must exist');}
  let tree:any;
  const render=() => {
    tree=host.render(Component,{enabled,locale:'pt'});
    for(const node of elements(tree,(node:any) => Boolean(node.props?.ref))) {
      if(node.type==='section') node.props.ref.current=section;
      else if(node.type==='video') node.props.ref.current=video;
      else if(node.props['data-footer-scene-overlay']!==undefined) node.props.ref.current=overlay;
    }
    host.flush();return tree;
  };
  const flushRaf=() => {const callbacks=[...rafs.values()];rafs.clear();callbacks.forEach(run=>run());};
  render();
  return {video,overlay,query,document,window,storage,timers,rafs,render,
    get tree() {return tree;},get locks(){return locks;},get releases(){return releases;},get returns(){return returns;},
    scroll(value:number) {top=value;window.dispatchEvent(new Event('scroll'));flushRaf();},
    enable(value:boolean) {enabled=value;render();},
    advance(ms:number) {const until=now+ms;for(let loops=0;loops<1000;loops++){const next=[...timers].filter(([,v])=>v.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].run();}now=until;},
    dispose(){host.dispose();},
    async promises(){await Promise.all(pending);await Promise.resolve();await Promise.resolve();},
  };
}

test('the real footer component keeps the character hidden until full coverage and returns cleanly', async () => {
  const h=setup();
  try {
    assert.equal(h.video.plays,0);assert.equal(h.overlay.hidden,true);
    h.scroll(600);assert.equal(h.video.loads,1,'approach preloads without revealing the character');
    assert.equal(h.video.plays,0);assert.equal(h.overlay.hidden,true);
    h.scroll(2);assert.equal(h.video.plays,0);
    h.scroll(0);assert.equal(h.video.plays,1);assert.equal(h.locks,1);
    h.video.dispatchEvent(new Event('playing'));await h.promises();h.render();
    assert.equal(h.overlay.hidden,false);
    h.video.currentTime=6.5;h.video.dispatchEvent(new Event('timeupdate'));
    assert.equal(h.overlay.dataset.mediaPhase,'interference');
    h.video.dispatchEvent(new Event('ended'));h.advance(420);h.render();
    assert.equal(h.returns,1);assert.equal(h.releases,1);assert.equal(h.overlay.hidden,true);
  } finally {h.dispose();}
});

test('playback does not flash a fully formed poster or depend on compositing an invisible video', () => {
  const h=setup();
  try {
    const video=elements(h.tree,(node:any)=>node.type==='video')[0];
    assert.equal(video.props.poster,undefined,'the clean still must not replace the original fragmented entrance before its first frame');
    const css=readFileSync(new URL('../src/components/sections/FinalFooterStage.css',import.meta.url),'utf8');
    assert.doesNotMatch(css,/\[data-state="playing"\]\[data-frame-ready=/,'do not wait for a compositor callback to make a fully transparent video visible');
    assert.match(css,/\.footer-scene-overlay\[hidden\][\s\S]*?display:\s*none\s*!important/);
  } finally {h.dispose();}
});

test('disabled and exhausted journeys do not preload, reveal or acquire a scene lock', () => {
  for(const options of [{enabled:false},{count:2}]) {
    const h=setup(options);
    try {h.scroll(0);h.render();assert.equal(h.video.loads,0);assert.equal(h.video.plays,0);assert.equal(h.locks,0);assert.equal(h.overlay.hidden,true);}
    finally {h.dispose();}
  }
});

test('visibility and page-cache events pause or release resources without replaying the same arrival', async () => {
  const h=setup();
  try {
    h.scroll(0);h.video.dispatchEvent(new Event('playing'));await h.promises();
    h.document.hidden=true;h.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(h.video.paused,true);h.advance(20000);assert.equal(h.releases,0);
    h.document.hidden=false;h.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(h.video.plays,3);h.video.dispatchEvent(new Event('playing'));
    assert.equal(h.storage.get('moreiragabryel:footer-scene:v1'),'1');
    h.window.dispatchEvent(new Event('pagehide'));h.render();
    assert.equal(h.releases,1);assert.equal(h.overlay.hidden,true);assert.equal(h.timers.size,0);
    h.window.dispatchEvent(new Event('pageshow'));h.scroll(0);assert.equal(h.video.plays,3);
    h.scroll(600);h.scroll(0);assert.equal(h.video.plays,4);
    h.enable(false);assert.equal(h.releases,2);assert.equal(h.overlay.hidden,true);
  } finally {h.dispose();}
  assert.equal(h.rafs.size,0);assert.equal(h.timers.size,0);
});

test('mobile coverage uses the visible viewport and motion preferences update without restarting video', () => {
  const h=setup();
  try {
    h.window.visualViewport.height=700;h.window.visualViewport.offsetTop=40;
    h.scroll(42);assert.equal(h.video.plays,0);
    h.scroll(40);assert.equal(h.video.plays,1);
    h.query.matches=true;h.query.dispatchEvent(new Event('change'));
    assert.equal(h.overlay.dataset.reducedMotion,'true');assert.equal(h.video.plays,1);
    const css=readFileSync(new URL('../src/components/sections/FinalFooterStage.css',import.meta.url),'utf8');
    assert.match(css,/100dvh/);assert.match(css,/object-fit:\s*contain/);
  } finally {h.dispose();}
});

test('the final scene replaces only the empty section after FakeFooter and waits for the existing loader', () => {
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
  assert.match(app,/import\s*\{FinalFooterStage\}/,'the approved final scene must be wired into the real App');
  assert.match(app,/<FinalFooterStage\s+enabled=\{loaded\}\s+locale=\{locale\}\s+onRestore=\{restoreScene\}\s*\/>/);
  assert.doesNotMatch(app,/function FinalBlackoutStage/);
  assert.ok(app.lastIndexOf('<FinalFooterStage')>app.lastIndexOf('<FakeFooterStage'));
});

test('portrait video stays inside a bounded viewport grid on short and narrow devices', () => {
  const css=readFileSync(new URL('../src/components/sections/FinalFooterStage.css',import.meta.url),'utf8');
  assert.match(css,/grid-template-rows:\s*minmax\(0,\s*1fr\)/);
  assert.match(css,/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(css,/min-height:\s*0/);assert.match(css,/min-width:\s*0/);
  assert.match(css,/object-fit:\s*contain/);assert.match(css,/touch-action:\s*pinch-zoom/);
});
