#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');
const port = String(process.env.PORT || '3000');
const host = process.env.HOST || '127.0.0.1';
const isWindows = process.platform === 'win32';

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    windowsHide: true,
    env: process.env,
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

function uniqueNumbersFromText(text) {
  const matches = text.match(/\b\d+\b/g) || [];
  return [...new Set(matches)];
}

function getListenerPids(portNumber) {
  if (isWindows) {
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

  const ssResult = run('ss', ['-ltnp', `( sport = :${portNumber} )`]);
  if (ssResult.status === 0) {
    return uniqueNumbersFromText(
      ssResult.stdout
        .split(/\r?\n/)
        .filter((line) => line.includes('LISTEN'))
        .map((line) => {
          const processMatches = [...line.matchAll(/pid=(\d+)/g)].map((match) => match[1]);
          return processMatches.join(' ');
        })
        .join(' '),
    );
  }

  const lsofResult = run('lsof', ['-ti', `TCP:${portNumber}`, '-sTCP:LISTEN']);
  if (lsofResult.status === 0) {
    return uniqueNumbersFromText(lsofResult.stdout);
  }

  throw new Error((ssResult.stderr || lsofResult.stderr || 'Falha ao descobrir processos na porta').trim());
}

function getCommandLine(pid) {
  if (isWindows) {
    const result = run('wmic', ['process', 'where', `ProcessId=${pid}`, 'get', 'CommandLine', '/value']);
    if (result.status !== 0) return '';
    return (result.stdout || '').toLowerCase();
  }

  const result = run('ps', ['-p', String(pid), '-o', 'command=']);
  if (result.status !== 0) return '';
  return (result.stdout || '').toLowerCase();
}

function isSafeToKill(pid) {
  const commandLine = getCommandLine(pid);
  return commandLine.includes('vite') || commandLine.includes('node');
}

function terminatePid(pid) {
  if (isWindows) {
    const killed = run('taskkill', ['/PID', String(pid), '/T', '/F']);
    if (killed.status !== 0) {
      throw new Error(killed.stderr || `Falha ao encerrar PID ${pid}`);
    }
    return;
  }

  const graceful = run('kill', ['-TERM', String(pid)]);
  if (graceful.status !== 0) {
    throw new Error(graceful.stderr || `Falha ao encerrar PID ${pid}`);
  }

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const probe = run('kill', ['-0', String(pid)]);
    if (probe.status !== 0) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150);
  }

  const forced = run('kill', ['-KILL', String(pid)]);
  if (forced.status !== 0) {
    throw new Error(forced.stderr || `Falha ao forçar encerramento do PID ${pid}`);
  }
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

    terminatePid(pid);
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

  child.on('exit', (code) => process.exit(code ?? 0));
}

try {
  freePortIfNeeded();
  cleanViteCache();
  startDevServer();
} catch (error) {
  console.error(`[dev:fresh] erro: ${error.message}`);
  process.exit(1);
}
