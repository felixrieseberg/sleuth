import { app } from 'electron';
import * as path from 'path';
import fs from 'fs-extra';

import { ICON_NAMES } from '../shared-constants';

export function getIconPath(iconName: ICON_NAMES): string | undefined {
  const icon = `${iconName}.${getExtension()}`;
  const iconPath = path.join(app.getAppPath(), 'dist/static/img', icon);

  // Protect against missing icon
  if (!fs.existsSync(iconPath)) {
    console.error(`Could not find icon in path ${iconPath}`);
    return undefined;
  }

  return iconPath;
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
//  const destPath = path.join(process.resourcesPath, 'electron.icns');
  const iconPath = getIconPath(iconName);

  if (iconPath) {
    console.log(`Setting icon to ${iconPath}`);
    app.dock.setIcon(iconPath);  
  }

  return Promise.resolve();
}

function getExtension() {
  if (process.platform === 'win32') return 'ico';
  if (process.platform === 'darwin') return 'png';
  return 'png';
}
