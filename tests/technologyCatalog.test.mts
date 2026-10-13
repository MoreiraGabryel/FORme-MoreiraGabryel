import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/config/technologies.ts', import.meta.url), 'utf8');
// O import type de Locale é apagado pelo suporte TS do Node.
const {TECHNOLOGIES} = await import('../src/config/technologies.ts');

const additions = ['html5', 'css3', 'gsap', 'lenis', 'framer-motion', 'express', 'sqlite', 'mercadopago', 'mcp'];

test('disponibiliza as nove novas tecnologias sem remover as 16 originais', () => {
  assert.equal(TECHNOLOGIES.length, 25);
  assert.equal(new Set(TECHNOLOGIES.map((item) => item.id)).size, 25);
  for (const id of additions) assert.ok(TECHNOLOGIES.some((item) => item.id === id), id);
  for (const id of ['java', 'python', 'springboot', 'pyarmor', 'javascript', 'typescript', 'react', 'tailwind', 'vite', 'nodejs', 'git', 'github', 'cloudflare', 'firebase', 'postgresql', 'supabase']) {
    assert.ok(TECHNOLOGIES.some((item) => item.id === id), id);
  }
});

test('cada tecnologia tem aplicação curta em PT/EN e categoria, sem placeholders', () => {
  assert.match(source, /category:/, 'As categorias da stack ainda não existem');
  for (const item of TECHNOLOGIES) {
    for (const locale of ['pt', 'en'] as const) {
      assert.ok(item.category[locale].length > 2, item.id);
      assert.ok(item.description[locale].length >= 50, item.id);
      assert.ok(item.description[locale].length < 290, item.id);
      assert.ok(item.tooltip[locale].length > 8, item.id);
      assert.doesNotMatch(item.description[locale], /fict[ií]ci|placeholder|lorem ipsum/i);
    }
  }
});

test('todos os ícones são SVG locais existentes, sem scripts ou referências externas', async () => {
  for (const item of TECHNOLOGIES) {
    assert.match(item.icon, /^\/icons\/[a-z0-9-]+\.svg$/);
    const svg = await readFile(new URL(`../public${item.icon}`, import.meta.url), 'utf8');
    assert.match(svg, /<svg[\s>]/);
    assert.match(svg, /viewBox=/);
    assert.doesNotMatch(svg, /<script|<foreignObject|\son\w+=|(?:href|src)=["']https?:/i);
  }
});
