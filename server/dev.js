import { existsSync, readdirSync, statSync, watchFile, unwatchFile } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_ENV_PATH = join(__dirname, '..', '.env');
const WATCH_DIRECTORIES = ['config', 'middleware', 'routes', 'utils'];

let child = null;
let childExitHandler = null;
let isStopping = false;
let isRestarting = false;
let restartTimer = null;

function getWatchTargets() {
  const files = [join(__dirname, 'index.js')];

  for (const directory of WATCH_DIRECTORIES) {
    const directoryPath = join(__dirname, directory);
    for (const entry of readdirSync(directoryPath)) {
      const filePath = join(directoryPath, entry);
      if (statSync(filePath).isFile()) {
        files.push(filePath);
      }
    }
  }

  if (existsSync(ROOT_ENV_PATH)) {
    files.push(ROOT_ENV_PATH);
  }

  return files;
}

function startServer() {
  child = spawn(process.execPath, ['index.js'], {
    cwd: __dirname,
    stdio: 'inherit',
  });

  childExitHandler = () => {
    child = null;
    childExitHandler = null;

    if (isRestarting && !isStopping) {
      isRestarting = false;
      startServer();
    }
  };

  child.on('exit', childExitHandler);
}

function restartServer(changedPath) {
  if (isStopping) return;

  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  restartTimer = setTimeout(() => {
    restartTimer = null;
    console.log(`[watch] Change detected in ${changedPath}. Restarting server...`);

    if (!child) {
      startServer();
      return;
    }

    if (isRestarting) return;
    isRestarting = true;
    child.kill('SIGTERM');
  }, 100);
}

function stopWatcher(signal) {
  isStopping = true;

  for (const filePath of getWatchTargets()) {
    unwatchFile(filePath);
  }

  if (!child) {
    process.exit(0);
  }

  child.once('exit', () => process.exit(0));
  child.kill(signal);
}

for (const filePath of getWatchTargets()) {
  watchFile(filePath, { interval: 250 }, (current, previous) => {
    if (current.mtimeMs !== previous.mtimeMs) {
      restartServer(filePath);
    }
  });
}

process.on('SIGINT', () => stopWatcher('SIGINT'));
process.on('SIGTERM', () => stopWatcher('SIGTERM'));

startServer();
