import fs from 'fs-extra';

import { showMessageBox } from './ipc';
import { shell } from 'electron';

const debug = require('debug')('sleuth:sentry');

export async function openSentry(installationFilePath?: string): Promise<void> {
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
      shell.openExternal(getSentryHref(id));
    }
  } catch (error) {
    debug(`Failed to read Sentry link`);
  }
}

export function convertInstallation(data: string): string {
  return new Buffer(data, 'base64').toString('ascii');
}

export function getSentryHref(installationId: string) {
  return `https://sentry.io/organizations/tinyspeck/issues/?project=5277886&query=is%3Aunresolved+uuid%3A${installationId}`;
}
