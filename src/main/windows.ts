import { BrowserWindow } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import windowStateKeeper from 'electron-window-state';

import { settingsFileManager } from './settings';
import { config } from '../config';
import { getIconPath, ICON_NAMES } from '../utils/app-icon';

export let windows: Array<Electron.BrowserWindow> = [];

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  manage: (window: BrowserWindow) => void;
  unmanage: () => void;
}

/**
 * Get a window position
 *
 * @returns {WindowState}
 */
function getWindowState() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 800
  }) as WindowState;

  let x = mainWindowState.x;
  let y = mainWindowState.y;

  // If creating additional windows, move them a little
  if (windows.length > 0) {
    const pos = windows[windows.length - 1].getBounds();

    x = pos.x + 15;
    y = pos.y + 15;
  }

  return {
    mainWindowState,
    x,
    y
  };
}

/**
 * Create a main window
 *
 * @returns {Promise<BrowserWindow>}
 */
export async function createWindow(): Promise<BrowserWindow> {
  console.log(`Creating window. Current number of windows: ${windows.length}`);

  // Let's keep the window position in mind
  const { mainWindowState, x, y } = getWindowState();

  // We might want a custom window
  const icon = process.platform !== 'darwin' && !!(await settingsFileManager.getItem('isMarkIcon'))
    ? getIconPath(ICON_NAMES.mark)
    : getIconPath(ICON_NAMES.default);

  // Create the browser window.
  const options: Electron.BrowserWindowConstructorOptions = {
    x,
    y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    show: !!config.isDevMode,
    icon: process.platform !== 'darwin' ? icon : undefined,
    minHeight: 500,
    minWidth: 1170,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
    webPreferences: {
      webviewTag: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  };
  console.log(`Windows: Creating window with options`, options);

  const mainWindow = new BrowserWindow(options);

  mainWindowState.manage(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadFile('./dist/static/index.html');

  // Open the DevTools.
  if (config.isDevMode) {
    await installExtension(REACT_DEVELOPER_TOOLS);
    mainWindow.webContents.openDevTools();
  }

  windows.push(mainWindow);

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // windows.(mainWindow);
    windows = windows.filter((w) => w !== mainWindow);
  });

  console.log(`Created window. Current window size: ${windows.length}`);

  return mainWindow;
}

/**
 * Get the main window
 *
 * @export
 * @returns {Promise<BrowserWindow>}
 */
export async function getCurrentWindow(): Promise<BrowserWindow> {
  // If a window is focused, return that one
  const focused = BrowserWindow.getFocusedWindow();

  if (focused) {
    return focused;
  }

  // No window focused? Find a ready one
  for (const window of windows) {
    const isBusy = window.webContents.send('are-you-busy') as unknown as boolean;

    console.log(`Asked window ${window.id} if it's busy. Answer: ${isBusy}`);

    if (isBusy === false) {
      return window;
    }
  }

  // None ready or focused? The first one then.
  if (windows && windows.length > 0) {
    return windows[0];
  }

  // Wow, no windows? Make one
  await createWindow();
  return getCurrentWindow();
}
