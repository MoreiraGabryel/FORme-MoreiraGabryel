#!/usr/bin/env node
const { spawnSync } = require('child_process');
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
  const result = run('wmic', ['process', 'where', `ProcessId=${pid}`, 'get', 'CommandLine', '/value']);
  if (result.status !== 0) return '';
  return (result.stdout || '').toLowerCase();
}

function isSafeToKill(pid) {
  const commandLine = getCommandLine(pid);
  return commandLine.includes('next') || commandLine.includes('node');
}

try {
  const pids = getListenerPids(port);

  if (pids.length === 0) {
    console.log(`[dev:stop] nenhuma aplicação ouvindo na porta ${port}`);
    process.exit(0);
  }

  console.log(`[dev:stop] porta ${port} ocupada por PID(s): ${pids.join(', ')}`);

  for (const pid of pids) {
    if (!isSafeToKill(pid)) {
      throw new Error(`A porta ${port} está ocupada pelo PID ${pid}, que não parece ser Node/Next. Abortei por segurança.`);
    }

    const killed = run('taskkill', ['/PID', String(pid), '/T', '/F']);
    if (killed.status !== 0) {
      throw new Error(killed.stderr || `Falha ao encerrar PID ${pid}`);
    }

    console.log(`[dev:stop] PID ${pid} encerrado`);
  }
} catch (error) {
  console.error(`[dev:stop] erro: ${error.message}`);
  process.exit(1);
}
