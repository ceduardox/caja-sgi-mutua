const { app, BrowserWindow, dialog } = require('electron');
const { join } = require('node:path');
const { existsSync, mkdirSync } = require('node:fs');
const { createServer } = require('node:net');

let appPort = process.env.PORT || '4173';

let mainWindow;

async function startLocalServer() {
  const dataDir = join(app.getPath('userData'), 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  appPort = await findAvailablePort(Number(appPort));
  process.env.PORT = String(appPort);
  process.env.SGI_DATA_DIR = dataDir;
  require(join(__dirname, '..', 'app-local', 'server.js'));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    title: 'SGI Market Caja',
    backgroundColor: '#f7f9fc',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  try {
    await waitForServer(`http://localhost:${appPort}/api/health`);
    await mainWindow.loadURL(`http://localhost:${appPort}`);
  } catch (error) {
    dialog.showErrorBox('SGI Market Caja', `No se pudo iniciar la caja local.\n\n${error.message}`);
    app.quit();
  }
}

async function waitForServer(url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 8000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error('El servidor local no respondio a tiempo.');
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, '127.0.0.1');
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + 40; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error('No hay puertos locales disponibles para iniciar la caja.');
}

app.whenReady().then(async () => {
  await startLocalServer();
  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
