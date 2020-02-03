import { remote, shell } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import { formatDistanceToNow } from 'date-fns';

import { Suggestions } from './interfaces';

const debug = require('debug')('sleuth:suggestions');

export async function getItemsInDownloadFolder(): Promise<Suggestions> {
  const suggestions = {};

  try {
    const dir = remote.app.getPath('downloads');
    const contents = await fs.readdir(dir);

    for (const file of contents) {
      // If the file is from #alerts-desktop-logs, the server will
      // have named it, not the desktop app itself.
      // It'll look like T8KJ1FXTL_U8KCVGGLR_1580765146766674.zip
      const serverFormat = /\w{8}_\w{8,9}_\d{16}.zip/
      const shouldAdd = file.startsWith('logs') ||
        file.startsWith('slack-logs') ||
        serverFormat.test(file);

      if (shouldAdd) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const age = formatDistanceToNow(stats.mtimeMs);

        suggestions[filePath] = { ...stats, age };
      }
    }
  } catch (error) {
    debug(error);
  }

  return suggestions;
}

export async function deleteSuggestion(filePath: string) {
  const trashName = process.platform === 'darwin'
    ? 'trash'
    : 'recycle bin';

  const { response } = await remote.dialog.showMessageBox({
    title: 'Delete File?',
    message: `Do you want to move ${filePath} to the ${trashName}?`,
    type: 'question',
    buttons: [ 'Cancel', `Move to ${trashName}` ],
    cancelId: 0
  });

  if (response) {
    shell.moveItemToTrash(filePath);
  }

  return !!response;
}

export async function deleteSuggestions(filePaths: Array<string>) {
  const trashName = process.platform === 'darwin'
    ? 'trash'
    : 'recycle bin';

  const { response } = await remote.dialog.showMessageBox({
    title: 'Delete Files?',
    message: `Do you want to move all log files older than 48 hours to the ${trashName}?`,
    type: 'question',
    buttons: [ 'Cancel', `Move to ${trashName}` ],
    cancelId: 0
  });

  if (response) {
    filePaths.forEach(shell.moveItemToTrash);
  }

  return !!response;
}
