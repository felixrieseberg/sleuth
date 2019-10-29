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
      if (file.startsWith('logs') || file.startsWith('slack-logs')) {
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

  const result = remote.dialog.showMessageBox({
    title: 'Delete File?',
    message: `Do you want to move ${filePath} to the ${trashName}?`,
    type: 'question',
    buttons: [ 'Cancel', `Move to ${trashName}` ],
    cancelId: 0
  });

  if (result) {
    shell.moveItemToTrash(filePath);
  }

  return !!result;
}

export async function deleteSuggestions(filePaths: Array<string>) {
  const trashName = process.platform === 'darwin'
    ? 'trash'
    : 'recycle bin';

  const result = remote.dialog.showMessageBox({
    title: 'Delete Files?',
    message: `Do you want to move all log files older than 48 hours to the ${trashName}?`,
    type: 'question',
    buttons: [ 'Cancel', `Move to ${trashName}` ],
    cancelId: 0
  });

  if (result) {
    filePaths.forEach(shell.moveItemToTrash);
  }
}
