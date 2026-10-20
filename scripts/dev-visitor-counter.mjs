import {fileURLToPath} from 'node:url';
import {Miniflare} from 'miniflare';

const worker = new Miniflare({
  modules: true,
  scriptPath: fileURLToPath(new URL('../public/_worker.js', import.meta.url)),
  compatibilityDate: '2026-07-01',
  d1Databases: ['VISITOR_COUNTER_DB'],
  d1Persist: fileURLToPath(new URL('../.wrangler/visitor-counter/', import.meta.url)),
  host: '127.0.0.1',
  port: 8788,
});

process.once('SIGINT', () => void worker.dispose());
process.once('SIGTERM', () => void worker.dispose());
console.log(`Visitor counter API ready: ${await worker.ready}`);
