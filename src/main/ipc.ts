import { ipcMain, shell } from 'electron';

export class IpcManager {
  constructor(readonly mainWindow: Electron.BrowserWindow) {
    this.setupFileDrop();
    this.setupProcessingStatus();
  }

  public openFile(path: string) {
    this.mainWindow.webContents.send('file-dropped', path);
  }

  private setupProcessingStatus() {
    ipcMain.on('processing-status', (_event, status: any) => {
      this.mainWindow.webContents.send('processing-status', status);
    });
  }

  private setupFileDrop() {
    this.mainWindow.webContents.on('will-navigate', (e, url) => {
      e.preventDefault();

      if (!url.startsWith('file:///')) {
        shell.openExternal(url);
      } else {
        this.openFile(decodeURIComponent(url.replace('file:///', '/')))
      }
    });
  }
}
