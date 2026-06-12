#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const host = process.env.HOST || '127.0.0.1';
const port = process.env.PORT || '3000';

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
  const stop = run(process.execPath, [path.join(projectRoot, 'scripts', 'stop-dev.cjs')]);
  if (stop.status !== 0) {
    process.exit(typeof stop.status === 'number' ? stop.status : 1);
  }

  const build = run(process.execPath, [path.join(projectRoot, 'scripts', 'build-fresh.cjs')]);
  if (build.status !== 0) {
    process.exit(typeof build.status === 'number' ? build.status : 1);
  }

  console.log(`[preview:fresh] iniciando preview em http://${host}:${port}`);
  const child = spawn(
    process.execPath,
    [path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--host', host, '--port', port, '--strictPort'],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      windowsHide: false,
      env: process.env,
    }
  );

  child.on('exit', code => process.exit(code ?? 0));
} catch (error) {
  console.error(`[preview:fresh] erro: ${error.message}`);
  process.exit(1);
}
