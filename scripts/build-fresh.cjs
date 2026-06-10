#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const port = process.env.PORT || '3000';

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  });
}

function runInherited(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    windowsHide: false,
    env: process.env,
  });

  return typeof result.status === 'number' ? result.status : 1;
}

function cleanNextDir() {
  const nextDir = path.join(projectRoot, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('[build:fresh] .next removido com sucesso');
  } else {
    console.log('[build:fresh] .next não existe; nada para limpar');
  }
}

function getListenerPids(portNumber) {
  const result = run('netstat', ['-ano']);
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Falha ao executar netstat');
  }

  const lines = result.stdout.split(/\r?\n/);
  const pids = new Set();

  for (const line of lines) {
    const normalized = line.trim().replace(/\s+/g, ' ');
    if (!normalized) continue;
    const parts = normalized.split(' ');
    if (parts.length < 5) continue;
    const localAddress = parts[1] || '';
    const state = parts[3] || '';
    const pid = parts[4] || '';

    if (!localAddress.endsWith(':' + portNumber)) continue;
    if (state.toUpperCase() !== 'LISTENING') continue;
    if (/^\d+$/.test(pid)) pids.add(pid);
  }

  return [...pids];
}

function getCommandLine(pid) {
  const result = run('wmic', ['process', 'where', `processid=${pid}`, 'get', 'commandline', '/value']);
  if (result.status !== 0) return '';
  return (result.stdout || '').toLowerCase();
}

function isSafeToKill(pid) {
  const commandLine = getCommandLine(pid);
  return commandLine.includes('next') || commandLine.includes('node');
}

function freePortIfNeeded() {
  const pids = getListenerPids(port);
  if (pids.length === 0) {
    console.log(`[build:fresh] porta ${port} livre`);
    return;
  }

  console.log(`[build:fresh] porta ${port} ocupada por PID(s): ${pids.join(', ')}`);

  for (const pid of pids) {
    if (!isSafeToKill(pid)) {
      throw new Error(`A porta ${port} está ocupada pelo PID ${pid}, que não parece ser Node/Next. Libere manualmente antes de continuar.`);
    }

    const killed = run('taskkill', ['/PID', String(pid), '/T', '/F']);
    if (killed.status !== 0) {
      throw new Error(killed.stderr || `Falha ao encerrar PID ${pid}`);
    }
    console.log(`[build:fresh] PID ${pid} encerrado para liberar a porta ${port}`);
  }
}

try {
  freePortIfNeeded();
  cleanNextDir();

  console.log('[build:fresh] reaplicando patch do Next');
  const patchExit = runInherited(process.execPath, [path.join(projectRoot, 'scripts', 'patch-next-readlink.cjs')]);
  if (patchExit !== 0) {
    process.exit(patchExit);
  }

  console.log('[build:fresh] executando next build');
  const buildExit = runInherited(process.execPath, [path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build']);
  process.exit(buildExit);
} catch (error) {
  console.error(`[build:fresh] erro: ${error.message}`);
  process.exit(1);
}
