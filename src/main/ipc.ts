import { shell, BrowserWindow, app, ipcMain, dialog } from 'electron';
import * as path from 'path';

import { createWindow } from './windows';
import { settingsFileManager } from './settings';

export class IpcManager {
  constructor() {
    this.setupFileDrop();
    this.setupOpenWindow();
    this.setupMessageBoxHandler();
    this.setupWindowReady();
    this.setupGetPath();
    this.setupSettings();
    this.setupOpenDialog();
    this.setupSaveDialog();
  }

  public openFile(pathName: string) {
    this.getCurrentWindow().webContents.send('file-dropped', pathName);
  }

  private getCurrentWindow(): Electron.BrowserWindow {
    const window = BrowserWindow.getFocusedWindow();

    if (window) {
      return window;
    } else {

      const windows = BrowserWindow.getAllWindows();

      if (windows.length > 0) {
        return windows[0];
      } else {
        throw new Error('Could not find window!');
      }
    }
  }

  private setupFileDrop() {
    app.on('browser-window-created', (_e, window) => {
      const parent = window.getParentWindow();

      if (parent) {
        return;
      }

      window.webContents.on('will-navigate', (e, url) => {
        e.preventDefault();

        if (!url.startsWith('file:///')) {
          shell.openExternal(url);
        } else {
          this.openFile(decodeURIComponent(url.replace('file:///', '/')));
        }
      });
    });
  }

  private setupOpenWindow() {
    ipcMain.on('new-sleuth-window', () => {
      createWindow();
    });
  }

  private setupWindowReady() {
    ipcMain.on('window-ready', (event) => {
      try {
        const browserWindow = BrowserWindow.fromWebContents(event.sender);

        if (browserWindow) {
          browserWindow.show();
        }
      } catch (error) {
        console.warn(`Could not show window`, error);
      }
    });
  }

  private setupMessageBoxHandler() {
    ipcMain.handle('message-box', async (_event, options: Electron.MessageBoxOptions) => {
      return dialog.showMessageBox(options);
    });
  }

  private setupGetPath() {
    type name = 'home' | 'appData' | 'userData' | 'cache' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'logs' | 'pepperFlashSystemPlugin';

    ipcMain.handle('get-path', (_event, pathName: name) => {
      return app.getPath(pathName);
    });
  }

  private setupSettings() {
    ipcMain.handle('get-settings', (_event, key: string) => settingsFileManager.getItem(key));
    ipcMain.handle('set-settings', (_event, key: string, value: any) => settingsFileManager.setItem(key, value));
  }

  private setupOpenDialog() {
    ipcMain.handle('show-open-dialog', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);

      if (!window) return {
        filePaths: []
      };

      return dialog.showOpenDialog(window, {
        defaultPath: app.getPath('downloads'),
        properties: [ 'openDirectory' ]
      });
    });
  }

  private setupSaveDialog() {
    ipcMain.handle('show-save-dialog', async (event, filename: string) => {
      const window = BrowserWindow.fromWebContents(event.sender);

      if (!window) return {
        filePaths: []
      };

      return dialog.showSaveDialog(window, {
        defaultPath: path.join(app.getPath('downloads'), filename),
        properties: ['createDirectory']
      });
    });
  }
}

export const ipcManager = new IpcManager();
