import { app } from 'electron';
import { URL } from 'url';

/**
 * Attempts to secure the app by disallowing things we do
 * not need.
 *
 * @export
 */
export function secureApp() {
  app.on('web-contents-created', (_event, webContents) => {
    // Disallow navigation
    webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);

      if (parsedUrl.hostname !== 'slack.com' && parsedUrl.protocol !== 'file') {
        event.preventDefault();
      }
    });

    // Disallow new-window
    webContents.on('new-window', (event) => {
      event.preventDefault();
    });
  });
}
