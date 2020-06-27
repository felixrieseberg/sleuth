import { app } from 'electron';
import { URL } from 'url';
import { getCurrentWindow } from './windows';
import { STATE_IPC } from '../shared-constants';

export function installProtocol() {
  if (!app.setAsDefaultProtocolClient('sleuth')) {
    console.log(`Failed to install sleuth:// protocol handler`);
  }

  app.on('open-url', async (_event, url) => {
    handleUrl(url);
  });

  app.on('second-instance', (_event, argv) => {
    const url = argv.find((v) => v.startsWith('sleuth://'));

    if (url) handleUrl(url);
  });
}

export async function handleUrl(url: string) {
  const parsed = new URL(url);
  const window = await getCurrentWindow();

  if (parsed.host === 'bookmarks' && parsed.searchParams.has('data')) {
    // searchParams.get() will do replacements we don't like
    window.webContents.send(STATE_IPC.OPEN_BOOKMARKS, parsed.search.replace('?data=', ''));
  }
}

