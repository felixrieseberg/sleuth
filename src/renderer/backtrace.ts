import fs from 'fs-extra';

import { showMessageBox } from './ipc';
import { shell } from 'electron';

const debug = require('debug')('sleuth:backtrace');

export async function openBacktrace(installationFilePath?: string): Promise<void> {
  // No file? Do nothing
  if (!installationFilePath) {
    showMessageBox({
      title: 'No installation id found',
      message: 'We did not find an installation id in this set of logs and can therefore not look for crashes for this user.',
    });

    return;
  }

  // Read the data
  try {
    const data = await fs.readFile(installationFilePath, 'utf8');
    const id = convertInstallation(data);

    if (id) {
      shell.openExternal(getBacktraceHref(id));
    }
  } catch (error) {
    debug(`Failed to read backtrace link`);
  }
}

export function convertInstallation(data: string): string {
  return new Buffer(data, 'base64').toString('ascii');
}

export function getBacktraceHref(installationId: string) {
  const base = `https://backtrace.tinyspeck.com/p/desktop/list?aperture=`;
  const query = `[[%22relative%22,[%22floating%22,%22all%22]],[[%22instanceUid%22,[%22equal%22,%22${installationId}%22]]]]`;

  return `${base}${query}`;
}
