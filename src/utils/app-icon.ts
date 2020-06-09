import * as path from 'path';
import fs from 'fs-extra';

export const enum ICON_NAMES {
  default = 'sleuth-icon',
  mark = 'sleuth-icon-mark'
}

export function getIconPath(iconName: ICON_NAMES) {
  return path.join(__dirname, 'img', `${iconName}.${getExtension()}`);
}

export async function changeIcon(iconName: ICON_NAMES) {
  if (process.platform === 'darwin') {
    return changeIconDarwin(iconName);
  }

  // No need to do anything on Windows or Linux,
  // we'll create the windows with the appropriate icon.

  return Promise.resolve();
}

function changeIconDarwin(iconName: ICON_NAMES) {
  const destPath = path.join(process.resourcesPath, 'electron.icns');

  return fs.copyFile(getIconPath(iconName), destPath);
}

function getExtension() {
  if (process.platform === 'win32') return 'ico';
  if (process.platform === 'darwin') return 'icns';
  return 'png';
}
