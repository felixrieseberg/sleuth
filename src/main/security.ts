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
    webContents.on('will-navigate', (event, url) => {
      const parsedUrl = new URL(url);

      const isSlack = parsedUrl.hostname.endsWith('slack.com');
      const isOkta = parsedUrl.hostname.endsWith('okta.com');
      const isFile = parsedUrl.protocol === 'file';

      if (!isSlack && !isOkta && !isFile) {
        console.warn(`Prevented navigation to ${url}`);
        console.log(`Hostname: ${parsedUrl.hostname}`);
        event.preventDefault();
      }
    });

    // Disallow new-window
    webContents.on('new-window', (event, url) => {
      console.warn(`Prevented new-window for ${url}`);
      event.preventDefault();
    });
  });
}
