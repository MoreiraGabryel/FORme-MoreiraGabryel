#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const port = process.env.PORT || '3000';
const host = process.env.HOST || '127.0.0.1';

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  });
}

function cleanViteCache() {
  const viteDir = path.join(projectRoot, 'node_modules', '.vite');
  if (fs.existsSync(viteDir)) {
    fs.rmSync(viteDir, {recursive: true, force: true});
    console.log('[dev:fresh] cache do Vite removido com sucesso');
  } else {
    console.log('[dev:fresh] cache do Vite não existe; nada para limpar');
  }
}

function getListenerPids(portNumber) {
  const result = run('netstat', ['-ano']);
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Falha ao executar netstat');
  }

  const pids = new Set();
  const lines = result.stdout.split(/\r?\n/);

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
  const result = run('wmic', ['process', 'where', `ProcessId=${pid}`, 'get', 'CommandLine', '/value']);
  if (result.status !== 0) return '';
  return (result.stdout || '').toLowerCase();
}

function isSafeToKill(pid) {
  const commandLine = getCommandLine(pid);
  return commandLine.includes('vite') || commandLine.includes('node');
}

function freePortIfNeeded() {
  const pids = getListenerPids(port);
  if (pids.length === 0) {
    console.log(`[dev:fresh] porta ${port} livre`);
    return;
  }

  console.log(`[dev:fresh] porta ${port} ocupada por PID(s): ${pids.join(', ')}`);

  for (const pid of pids) {
    if (!isSafeToKill(pid)) {
      throw new Error(`A porta ${port} está ocupada pelo PID ${pid}, que não parece ser Node/Vite. Libere manualmente antes de continuar.`);
    }

    const killed = run('taskkill', ['/PID', String(pid), '/T', '/F']);
    if (killed.status !== 0) {
      throw new Error(killed.stderr || `Falha ao encerrar PID ${pid}`);
    }

    console.log(`[dev:fresh] PID ${pid} encerrado para liberar a porta ${port}`);
  }
}

function startDevServer() {
  console.log(`[dev:fresh] iniciando Vite em http://${host}:${port}`);
  const child = spawn(process.execPath, [path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', host, '--port', port], {
    cwd: projectRoot,
    stdio: 'inherit',
    windowsHide: false,
    env: process.env,
  });

  child.on('exit', code => process.exit(code ?? 0));
}

try {
  freePortIfNeeded();
  cleanViteCache();
  startDevServer();
} catch (error) {
  console.error(`[dev:fresh] erro: ${error.message}`);
  process.exit(1);
}
