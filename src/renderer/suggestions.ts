import { remote, shell } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import { formatDistanceToNow } from 'date-fns';

import { Suggestions, Suggestion } from './interfaces';
import { StringMap } from '../shared-constants';

const debug = require('debug')('sleuth:suggestions');

export async function getItemsInDownloadFolder(): Promise<Suggestions> {
  let suggestions = {};

  // We'll get suggestions from the downloads folder and
  // the desktop
  try {
    const downloadsDir = remote.app.getPath('downloads');
    const downloads = (await fs.readdir(downloadsDir))
      .map((file) => path.join(downloadsDir, file));

    const desktopDir = remote.app.getPath('desktop');
    const desktop = (await fs.readdir(desktopDir))
      .map((file) => path.join(desktopDir, file));

    suggestions = {
      ...(await getSuggestions(downloads)),
      ...(await getSuggestions(desktop))
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

/**
 * Takes an array of file paths and checks if they're files we'd like
 * to suggest
 *
 * @param {Array<string>} input
 * @returns {Promise<StringMap<Suggestion>>}
 */
async function getSuggestions(input: Array<string>): Promise<StringMap<Suggestion>> {
  const suggestions: StringMap<Suggestion> = {};

  for (const file of input) {
    debug(`Checking ${file}`);

    // If the file is from #alerts-desktop-logs, the server will
    // have named it, not the desktop app itself.
    // It'll look like T8KJ1FXTL_U8KCVGGLR_1580765146766674.zip
    const serverFormat = /\w{9}_\w{9}_\d{16}\.zip/
    const shouldAdd = file.startsWith('logs') ||
      file.startsWith('slack-logs') ||
      serverFormat.test(file);

    if (shouldAdd) {
      try {
        const stats = fs.statSync(file);
        const age = formatDistanceToNow(stats.mtimeMs);

        suggestions[file] = { ...stats, age };
      } catch (error) {
        debug(`Tried to add ${file}, but failed: ${error}`);
      }
    }
  }

  return suggestions;
}