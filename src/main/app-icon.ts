import { app } from 'electron';
import * as path from 'path';
import fs from 'fs-extra';

export const enum ICON_NAMES {
  default = 'sleuth-icon',
  mark = 'sleuth-icon-mark'
}

export function getIconPath(iconName: ICON_NAMES): string | undefined {
  const icon = `${iconName}.${getExtension()}`;
  const iconPath = path.join(app.getAppPath(), 'dist/static/img', icon);

  // Protect against missing icon
  if (!fs.existsSync(icon)) {
    try {
      console.log(fs.readdirSync(path.join(app.getAppPath())));
      console.log(fs.readdirSync(path.join(app.getAppPath(), 'dist')));
      console.log(fs.readdirSync(path.join(app.getAppPath(), 'dist/static/')));
      console.log(fs.readdirSync(path.join(app.getAppPath(), 'dist/static/img')));
    } catch (error) {
      //noop
    }

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
  const destPath = path.join(process.resourcesPath, 'electron.icns');
  const iconPath = getIconPath(iconName);

  if (iconPath) {
    return fs.copyFile(iconPath, destPath);
  }

  return Promise.resolve();
}

function getExtension() {
  if (process.platform === 'win32') return 'ico';
  if (process.platform === 'darwin') return 'icns';
  return 'png';
}
