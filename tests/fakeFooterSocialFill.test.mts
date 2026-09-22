import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const footerStage = await readFile(new URL('../src/components/sections/FakeFooterStage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');

test('aplica preenchimento de marca aos links sociais do Fake Footer', () => {
  assert.match(footerStage, /data-social=\{item\.icon\}/);
  assert.match(footerStage, /className="fake-footer-social-fill" aria-hidden="true"/);

  const linkRule = css.match(/\.fake-footer-social-link\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const fillRule = css.match(/\.fake-footer-social-fill\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

  assert.match(linkRule, /color: #C7EDFF;/);
  assert.match(fillRule, /transform: scaleY\(0\);/);
  assert.match(css, /\.fake-footer-social-link:hover \.fake-footer-social-fill,[\s\S]*?transform: scaleY\(1\);/);
  assert.match(css, /data-social='instagram'[\s\S]*?#405DE6/);
  assert.match(css, /data-social='linkedin'[\s\S]*?#0A66C2/);
  assert.match(css, /data-social='whatsapp'[\s\S]*?#25D366/);
  assert.match(css, /data-social='email'[\s\S]*?--social-hover-icon: #102840;/);
  assert.match(css, /data-social='github'[\s\S]*?--social-hover-icon: #102840;/);
});
