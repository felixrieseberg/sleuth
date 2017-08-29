import { ipcMain, shell, BrowserWindow } from 'electron';

export class IpcManager {
  constructor() {
    this.setupFileDrop();
    this.setupProcessingStatus();
  }

  public openFile(path: string) {
    this.getMainWindow().webContents.send('file-dropped', path);
  }

  private setupProcessingStatus() {
    ipcMain.on('processing-status', (_event: any, status: any) => {
      this.getMainWindow().webContents.send('processing-status', status);
    });
  }

  private getMainWindow(): Electron.BrowserWindow {
    const allWindows = BrowserWindow.getAllWindows();

    if (allWindows && allWindows.length > 0) {
      return allWindows[0];
    } else {
      throw new Error('Could not find window!');
    }
  }

  private setupFileDrop() {
    this.getMainWindow().webContents.on('will-navigate', (e, url) => {
      e.preventDefault();

      if (!url.startsWith('file:///')) {
        shell.openExternal(url);
      } else {
        this.openFile(decodeURIComponent(url.replace('file:///', '/')));
      }
    });
  }
}
