import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdtemp, mkdir, writeFile, readFile, readdir, rm, truncate, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/prepare-cloudflare-release.mjs', import.meta.url));
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'cloudflare-release-'));
  const input = join(root, 'dist');
  const output = join(root, 'payload');
  const files = {
    'index.html': '<script type="module" src="/assets/app.js"></script>',
    '_headers': '/*\n  X-Content-Type-Options: nosniff',
    '_worker.js': 'export default {fetch(){return new Response("test worker fixture")}}',
    'favicon.ico': 'test icon fixture',
    'assets/app.js': 'const icon="/icons/react.svg"; const flag="/flags/br.svg"; const frame=n=>`/media/entry_${n}.webp`;',
    'assets/app.css': 'body{background:url("/media/hero.webp")}',
    'assets/app.js.map': '{"sources":["private source fixture"]}',
    'icons/react.svg': '<svg/>', 'flags/br.svg': '<svg/>',
    'media/hero.webp': 'fixture', 'media/entry_1.webp': 'fixture', 'media/entry_2.webp': 'fixture',
    'media/unused-source.webm': 'unreferenced original fixture',
    'media/internal-metadata.json': '{}',
    'docs/private.md': 'internal documentation fixture', '.env': 'internal configuration fixture',
  };
  for (const [name, content] of Object.entries(files)) {
    await mkdir(join(input, name, '..'), {recursive: true});
    await writeFile(join(input, name), content);
  }
  return {root, input, output};
}
async function list(root, prefix = '') {
  const files = [];
  for (const entry of await readdir(join(root, prefix), {withFileTypes: true})) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await list(root, relative));else files.push(relative);
  }
  return files.sort();
}

test('release contains runtime dependencies but no source, maps, private docs or unused media', async () => {
  assert.ok(existsSync(script), 'The minimal Cloudflare release packager has not been implemented');
  const host = await fixture();
  try {
    const result = spawnSync(process.execPath, [script, host.input, host.output], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await list(host.output), [
      'THIRD_PARTY_NOTICES.txt', '_headers', '_worker.js',
      'assets/app.css', 'assets/app.js', 'favicon.ico', 'flags/br.svg', 'icons/react.svg',
      'index.html', 'media/entry_1.webp', 'media/entry_2.webp', 'media/hero.webp',
    ].sort());
    assert.equal(await readFile(join(host.output, 'assets/app.js'), 'utf8'), await readFile(join(host.input, 'assets/app.js'), 'utf8'));
    assert.match(await readFile(join(host.output, 'THIRD_PARTY_NOTICES.txt'), 'utf8'), /react/);
    const repeated = spawnSync(process.execPath, [script, host.input, host.output], {encoding: 'utf8'});
    assert.notEqual(repeated.status, 0);
    assert.equal(await readFile(join(host.output, 'index.html'), 'utf8'), await readFile(join(host.input, 'index.html'), 'utf8'));
  } finally {await rm(host.root, {recursive: true, force: true});}
});

test('unsafe or incomplete builds fail before creating any output', async () => {
  const cases = [
    async host => writeFile(join(host.input, 'assets/app.css'), 'body{background:url("/media/missing.webp")}'),
    async host => writeFile(join(host.input, 'assets/app.js'), '//# sourceMappingURL=app.js.map'),
    async host => writeFile(join(host.input, 'assets/app.js'), 'const file="/media/../../private.svg"'),
    async host => truncate(join(host.input, 'media/hero.webp'), 25 * 1024 * 1024 + 1),
    async host => symlink(join(host.input, '.env'), join(host.input, 'media/secret.svg')),
  ];
  for (const change of cases) {
    const host = await fixture();
    try {
      await change(host);
      const result = spawnSync(process.execPath, [script, host.input, host.output], {encoding: 'utf8'});
      assert.notEqual(result.status, 0);
      assert.equal(existsSync(host.output), false);
    } finally {await rm(host.root, {recursive: true, force: true});}
  }
});
