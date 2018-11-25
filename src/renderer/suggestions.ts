import { remote, shell } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import { distanceInWordsToNow } from 'date-fns';

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
        const age = distanceInWordsToNow(stats.mtimeMs);

        suggestions[filePath] = { ...stats, age };
      }
    }
  } catch (error) {
    debug(error);
  }

  return suggestions;
}

export function deleteSuggestion(filePath: string) {
  return new Promise((resolve) => {
    const trashName = process.platform === 'darwin'
      ? 'trash'
      : 'recycle bin';

    remote.dialog.showMessageBox({
      title: 'Delete File?',
      message: `Do you want to move ${filePath} to the ${trashName}?`,
      type: 'question',
      buttons: [ 'Cancel', `Move to ${trashName}` ],
      cancelId: 0
    }, (result) => {
      if (result) {
        shell.moveItemToTrash(filePath);
      }

      resolve(!!result);
    });
  });
}