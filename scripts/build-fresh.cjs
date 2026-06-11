#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    windowsHide: false,
    env: process.env,
    ...options,
  });
}

try {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, {recursive: true, force: true});
    console.log('[build:fresh] dist removido com sucesso');
  } else {
    console.log('[build:fresh] dist não existe; nada para limpar');
  }

  const tscBin = path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');
  const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

  const typecheck = run(process.execPath, [tscBin, '-b']);
  if (typecheck.status !== 0) {
    process.exit(typeof typecheck.status === 'number' ? typecheck.status : 1);
  }

  const build = run(process.execPath, [viteBin, 'build']);
  process.exit(typeof build.status === 'number' ? build.status : 1);
} catch (error) {
  console.error(`[build:fresh] erro: ${error.message}`);
  process.exit(1);
}
