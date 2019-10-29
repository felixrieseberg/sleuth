import { shell, BrowserWindow, app, ipcMain } from 'electron';
import { createWindow } from './windows';

export class IpcManager {
  constructor() {
    this.setupFileDrop();
    this.setupOpenWindow();
  }

  public openFile(path: string) {
    this.getCurrentWindow().webContents.send('file-dropped', path);
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
}

export const ipcManager = new IpcManager();
