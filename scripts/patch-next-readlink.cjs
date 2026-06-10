const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: path.join(process.cwd(), 'node_modules', 'next', 'dist', 'build', 'webpack', 'plugins', 'next-trace-entrypoints-plugin.js'),
    from: '(e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN")',
    to: '(e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN" || e.code === "EISDIR")'
  },
  {
    file: path.join(process.cwd(), 'node_modules', 'next', 'dist', 'build', 'collect-build-traces.js'),
    from: '(e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN")',
    to: '(e.code === "EINVAL" || e.code === "ENOENT" || e.code === "UNKNOWN" || e.code === "EISDIR")'
  }
];

let changed = 0;

for (const item of replacements) {
  if (!fs.existsSync(item.file)) {
    console.warn(`[patch-next-readlink] skipped missing file: ${item.file}`);
    continue;
  }

  const source = fs.readFileSync(item.file, 'utf8');

  if (source.includes(item.to)) {
    console.log(`[patch-next-readlink] already patched: ${path.relative(process.cwd(), item.file)}`);
    continue;
  }

  if (!source.includes(item.from)) {
    throw new Error(`[patch-next-readlink] target pattern not found in ${item.file}`);
  }

  fs.writeFileSync(item.file, source.replace(item.from, item.to), 'utf8');
  changed += 1;
  console.log(`[patch-next-readlink] patched: ${path.relative(process.cwd(), item.file)}`);
}

console.log(`[patch-next-readlink] done (${changed} file(s) changed)`);
