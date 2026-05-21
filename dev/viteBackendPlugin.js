import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 5000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isPortOpen = (host, port) =>
  new Promise((resolve) => {
    const socket = new net.Socket();

    const cleanup = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(1000);
    socket.once('connect', () => cleanup(true));
    socket.once('timeout', () => cleanup(false));
    socket.once('error', () => cleanup(false));
    socket.connect(port, host);
  });

const waitForPort = async (host, port, attempts = 20) => {
  for (let index = 0; index < attempts; index += 1) {
    if (await isPortOpen(host, port)) {
      return true;
    }

    await wait(500);
  }

  return false;
};

export const ensureBackendForDev = ({
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  backendDir = path.resolve(process.cwd(), '../Backend'),
} = {}) => {
  let backendProcess = null;
  let startupPromise = null;

  return {
    name: 'ensure-backend-for-dev',
    apply: 'serve',
    configureServer(server) {
      const startBackend = async () => {
        if (startupPromise) {
          return startupPromise;
        }

        startupPromise = (async () => {
          if (await isPortOpen(host, port)) {
            console.log(`[vite] Backend already running on http://${host}:${port}`);
            return;
          }

          console.log('[vite] Starting local backend server...');

          backendProcess = spawn(process.execPath, ['server.js'], {
            cwd: backendDir,
            stdio: 'inherit',
            windowsHide: true,
          });

          const ready = await waitForPort(host, port);

          if (!ready) {
            throw new Error(`Backend did not start on http://${host}:${port}`);
          }

          console.log(`[vite] Backend ready on http://${host}:${port}`);
        })().catch((error) => {
          startupPromise = null;
          throw error;
        });

        return startupPromise;
      };

      startBackend().catch((error) => {
        console.error(`[vite] Failed to start backend: ${error.message}`);
      });

      server.httpServer?.once('close', () => {
        if (backendProcess && !backendProcess.killed) {
          backendProcess.kill();
        }
      });
    },
  };
};
