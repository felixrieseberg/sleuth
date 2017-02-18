export function setupFileDrop(browserWindow: Electron.BrowserWindow) {
  browserWindow.webContents.on('will-navigate', (e, url) => {
    e.preventDefault();

    url = url.replace('file:///', '/');
    browserWindow.webContents.send('file-dropped', url);
  });
}
