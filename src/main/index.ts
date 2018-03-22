import { config } from '../config';
import { app, BrowserWindow } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import * as windowStateKeeper from 'electron-window-state';

import { IpcManager } from './ipc';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: Electron.BrowserWindow | null;
let ipcManager: IpcManager;

if (require('electron-squirrel-startup')) {
  // No-op, we're done here
} else {
  const createWindow = async () => {
    require('electron-context-menu')();

    const mainWindowState = windowStateKeeper({
      defaultWidth: 1200,
      defaultHeight: 800
    });

    // Create the browser window.
    mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      show: !!config.isDevMode,
      minHeight: 500,
      minWidth: 1000,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined
    });

    mainWindowState.manage(mainWindow);

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/../static/index.jade`);

    // Open the DevTools.
    if (config.isDevMode) {
      await installExtension(REACT_DEVELOPER_TOOLS);
      mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });

    ipcManager = new IpcManager();
  };

  // Whenever the app has finished launching
  app.on('will-finish-launching', () => {
    app.on('open-file', (event, path) => {
      event.preventDefault();

      function openWhenReady() {
        if (ipcManager) {
          ipcManager.openFile(path);
        } else {
          setTimeout(openWhenReady, 500);
        }
      }

      openWhenReady();
    });
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow();
    }
  });
}
