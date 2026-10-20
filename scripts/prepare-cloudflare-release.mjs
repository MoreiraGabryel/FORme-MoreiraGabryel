import {cp, mkdir, readdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {dirname, extname, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

const [inputArgument, outputArgument] = process.argv.slice(2);
if (!inputArgument || !outputArgument) throw new Error('Usage: node scripts/prepare-cloudflare-release.mjs <dist> <new-output-directory>');
const input = await realpath(resolve(inputArgument));
const output = resolve(outputArgument);
if (output === input || output.startsWith(input + sep)) throw new Error('Output must be outside the build directory');
const files = new Map();
async function walk(directory) {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in a release');
    if (entry.isDirectory()) await walk(path);
    else files.set(relative(input, path).split(sep).join('/'), path);
  }
}
await walk(input);
const selected = new Set(['index.html', '_headers', '_worker.js']);
for (const name of selected) if (!files.has(name)) throw new Error(`Missing build entry: ${name}`);
if (files.has('favicon.ico')) selected.add('favicon.ico');
const runtimeFile = /\.(?:avif|css|gif|ico|jpe?g|js|json|mjs|mp3|mp4|ogg|png|svg|ttf|wasm|webm|webp|woff2?)$/i;
for (const name of files.keys()) if (name.startsWith('assets/') && runtimeFile.test(name)) selected.add(name);
const cssUrl = /url\(\s*["']?([^"')\s]+)["']?\s*\)/g;
function reference(value) {
  const path = value.split(/[?#]/, 1)[0];
  if (!path.startsWith('/') || path.startsWith('//')) return;
  const name = path.slice(1);
  if (name.split('/').includes('..') || name.includes('\\')) throw new Error('Unsafe asset reference');
  if (runtimeFile.test(name)) {
    if (!files.has(name)) throw new Error(`Missing referenced asset: ${name}`);
    selected.add(name);
  } else if (/^(?:media|icons|flags|fonts)\//.test(name)) {
    // Retain candidates for concatenated public paths instead of breaking dynamic media.
    for (const file of files.keys()) if (file.startsWith(name) && runtimeFile.test(file)) selected.add(file);
  }
}
function stringReferences(value) {
  reference(value);
  for (const match of value.matchAll(cssUrl)) reference(match[1]);
}
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const inspected = new Set();
for (const name of selected) {
  if (inspected.has(name) || !/\.(?:html|js|mjs|css)$/.test(name)) continue;
  inspected.add(name);
  const content = await readFile(files.get(name), 'utf8');
  if (/sourceMappingURL\s*=/.test(content)) throw new Error(`Source map reference in release: ${name}`);
  for (const match of content.matchAll(cssUrl)) reference(match[1]);
  if (name.endsWith('.html')) for (const match of content.matchAll(/(?:src|href)=["']([^"']+)["']/g)) reference(match[1]);
  if (/\.(?:js|mjs)$/.test(name)) {
    const source = ts.createSourceFile(name, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const visit = node => {
      if (ts.isStringLiteralLike(node)) stringReferences(node.text);
      if (ts.isTemplateExpression(node) && node.head.text.startsWith('/')) {
        const pattern = new RegExp('^' + escape(node.head.text.slice(1)) + node.templateSpans.map(span => '[^/]*' + escape(span.literal.text)).join('') + '$');
        for (const file of files.keys()) if (runtimeFile.test(file) && pattern.test(file)) selected.add(file);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
}
for (const name of selected) {
  if (/\.(?:map|md|ts|tsx|sqlite|db)$/i.test(name) || /(?:^|\/)(?:\.env[^/]*|\.git|node_modules|src|tests|docs)(?:\/|$)/.test(name)) throw new Error(`Non-deploy file selected: ${name}`);
  if ((await stat(files.get(name))).size > 25 * 1024 * 1024) throw new Error(`Cloudflare asset exceeds 25 MiB: ${name}`);
}

const project = fileURLToPath(new URL('../', import.meta.url));
const dependencyTree = JSON.parse(execFileSync('npm', ['ls', '--omit=dev', '--all', '--json'], {cwd: project, encoding: 'utf8'}));
const runtimePackages = new Set();
function dependencies(tree) {
  for (const [name, dependency] of Object.entries(tree.dependencies ?? {})) {
    if (dependency.version) runtimePackages.add(name);
    dependencies(dependency);
  }
}
dependencies(dependencyTree);
let notices = 'Third-party runtime notices\n\n';
for (const name of [...runtimePackages].sort()) {
  const directory = resolve(project, 'node_modules', name);
  const metadata = JSON.parse(await readFile(resolve(directory, 'package.json'), 'utf8'));
  const licenses = (await readdir(directory)).filter(file => /^(?:licen[cs]e|copying)(?:\.|$)/i.test(file));
  notices += `${name}@${metadata.version}\n${metadata.license ?? 'See package licensing information'}\n`;
  for (const license of licenses) notices += await readFile(resolve(directory, license), 'utf8') + '\n';
  notices += '\n';
}
if (files.has('icons/stack-sources.json')) {
  const icons = JSON.parse(await readFile(files.get('icons/stack-sources.json'), 'utf8'));
  notices += 'Icon sources\n' + icons.map(icon => `${icon.id}: ${icon.source}`).join('\n') + '\n';
}

// Never delete or overwrite an existing destination, including a previous release.
await mkdir(dirname(output), {recursive: true});
await mkdir(output);
for (const name of [...selected].sort()) {
  const target = resolve(output, name);
  await mkdir(dirname(target), {recursive: true});
  await cp(files.get(name), target, {force: false, errorOnExist: true});
}
await writeFile(resolve(output, 'THIRD_PARTY_NOTICES.txt'), notices, {flag: 'wx'});
console.log(JSON.stringify({output, files: [...selected, 'THIRD_PARTY_NOTICES.txt'].sort(), omitted: [...files.keys()].filter(name => !selected.has(name)).sort()}, null, 2));
