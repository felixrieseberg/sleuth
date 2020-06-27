import { shell } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import { formatDistanceToNow } from 'date-fns';

import { Suggestions, Suggestion } from '../interfaces';
import { getPath, showMessageBox } from './ipc';

const debug = require('debug')('sleuth:suggestions');

export async function getItemsInSuggestionFolders(): Promise<Suggestions> {
 let suggestionsArr: Array<Suggestion>;

  // We'll get suggestions from the downloads folder and
  // the desktop
  try {
    const downloadsDir = await getPath('downloads');
    const downloads = (await fs.readdir(downloadsDir))
      .map((file) => path.join(downloadsDir, file));

    const desktopDir = await getPath('desktop');
    const desktop = (await fs.readdir(desktopDir))
      .map((file) => path.join(desktopDir, file));

    suggestionsArr = (await getSuggestions(downloads)).concat(await getSuggestions(desktop));
    const sortedSuggestions  = suggestionsArr.sort((a, b) => {
      return b.mtimeMs - a.mtimeMs;
    });

    return sortedSuggestions;
  } catch (error) {
    debug(error);
  }
  return [];
}

export async function deleteSuggestion(filePath: string) {
  const trashName = process.platform === 'darwin'
    ? 'trash'
    : 'recycle bin';

  const { response } = await showMessageBox({
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

  const { response } = await showMessageBox({
    title: 'Delete Files?',
    message: `Do you want to move all log files older than 48 hours to the ${trashName}?`,
    type: 'question',
    buttons: [ 'Cancel', `Move to ${trashName}` ],
    cancelId: 0
  });

  if (response) {
    filePaths.forEach((filePath) => shell.moveItemToTrash(filePath));
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
async function getSuggestions(input: Array<string>): Promise<Array<Suggestion>> {
  const suggestions: Array<Suggestion> = [];

  for (const file of input) {
    debug(`Checking ${file}`);
    // If the file is from #alerts-desktop-logs, the server will
    // have named it, not the desktop app itself.
    // It'll look like T8KJ1FXTL_U8KCVGGLR_1580765146766674.zip
    const serverFormat = /\w{9,}_\w{9,}_\d{16,}\.zip/;
    const logsFormat = /.*logs.*\.zip/;
    const shouldAdd = logsFormat.test(file) || serverFormat.test(file);

    if (shouldAdd) {
      try {
        const stats = fs.statSync(file);
        const age = formatDistanceToNow(stats.mtimeMs);

        suggestions.push({filePath: file, ...stats, age });
      } catch (error) {
        debug(`Tried to add ${file}, but failed: ${error}`);
      }
    }
  }

  return suggestions;
}