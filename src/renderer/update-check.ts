import * as semver from 'semver';

const debug = require('debug')('sleuth:unzip');

const packageInfo = require('../../package.json');
const { version } = packageInfo;
const platformModifier = process.platform === 'win32' ? 'windows': 'mac';

export const checkUpdateUrl = `https://downloads.slack-edge.com/sleuth_${platformModifier}/latest-version.json`;

export const downloadUpdateUrl = `https://downloads.slack-edge.com/sleuth_${platformModifier}/latest.zip`;

export interface LatestInfo {
  latest: string;
};

/**
 * Checks if there's a new version available, and if so, returns the version number.
 *
 * @export
 * @returns {(Promise<boolean | string>)}
 */
export function getUpdateAvailable(): Promise<{}> {
  return new Promise((resolve) => {
    fetch(checkUpdateUrl)
      .then((result) => result.json())
      .then((result: any) => {
        if (result && result.latest) {
          resolve(semver.gt(result.latest, version) ? result.latest : false);
        }

        resolve(false);
      })
      .catch((err) => debug('Couuld not check for update', err));
  });
}
