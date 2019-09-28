import semver from 'semver';

const debug = require('debug')('sleuth:update-check');

const packageInfo = require('../../package.json');
const { version } = packageInfo;
const platformModifier = process.platform === 'win32' ? 'windows' : 'macos';
const fetch = window.fetch || require('node-fetch');

export interface LatestInfo {
  latest: string;
}

export interface UpdateUrls {
  checkUpdate: string;
  downloadUpdate: string;
}

export const host = 'https://desktop-sleuth-updates.herokuapp.com';

export const defaultUrls: UpdateUrls = {
  checkUpdate: `${host}/${platformModifier}/latest-version.json`,
  downloadUpdate: `${host}/${platformModifier}/latest.zip`
};

/**
 * Checks if there's a new version available, and if so, returns the version number.
 *
 * @export
 * @returns {(Promise<boolean | string>)}
 */
export function getUpdateAvailable(urls: UpdateUrls = defaultUrls, v: string = version): Promise<{}> {
  return new Promise((resolve) => {
    fetch(urls.checkUpdate)
      .then((result) => result.json())
      .then((result: any) => {
        if (result && result.latest) {
          resolve(semver.gt(result.latest, v) ? result.latest : false);
        }

        resolve(false);
      })
      .catch((err) => debug('Could not check for update', err));
  });
}
