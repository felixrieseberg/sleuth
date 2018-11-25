import React from 'react';
import { distanceInWords } from 'date-fns';
import { getLanguageNames } from '../../utils/iso639';

export function getSettingsInfo(data: any): Array<JSX.Element> {
  const result: Array<JSX.Element> = [];

  result.push(<p>📋 This user is running Slack <span>{getVersionInfo(data)}</span> on {getOSInfo(data)}.</p>);
  result.push(<p>📡 {getChannelInfo(data)}</p>);
  result.push(<p>📣 {getNotificationsInfo(data)}</p>);
  result.push(<p>🔍 {getZoomInfo(data)}</p>);
  result.push(<p>🌍 {getLocaleInfo(data)}</p>);
  result.push(<p>💻 {getHWInfo(data)}</p>);
  result.push(<p>⏰ {getMinWebInfo(data)}</p>);

  return result;
}

export function getMinWebInfo({ workspaceIdleTimeout }: any): string {
  if (workspaceIdleTimeout === undefined) {
    return `No workspace idle timeout could be found.`;
  }

  if (workspaceIdleTimeout === 'never') {
    return `Workspaces are never considered idle.`;
  }

  const intIdleTimeout = parseInt(workspaceIdleTimeout, 10);
  const humanIdle = intIdleTimeout / 60 / 60 / 1000;
  return `Workspaces are considered idle after ${humanIdle} hours.`;
}

export function getHWInfo({ isAeroGlassEnabled, platform, useHwAcceleration }: any): string {
  let hwInfo = '';

  if (platform === 'win32') {
    if (isAeroGlassEnabled) {
      hwInfo += `Aero Glass (DWM) is enabled, meaning that Slack can display the built-in notifications. `;
    } else {
      hwInfo += `Aero Glass (DWM) is disabled, meaning that Slack cannot display built-in notifications. `;
      hwInfo += `The notifications field manual has information on how to enabled DWM. `;
    }
  }

  if (useHwAcceleration !== undefined) {
    hwInfo += `HW acceleration is ${useHwAcceleration ? 'enabled' : 'disabled'}.`;
  } else {
    hwInfo += `HW acceleration isn't configured, so likely being used. `;
  }

  return hwInfo;
}

export function getNotificationsInfo({ notificationMethod, notificationPlayback }: any): string {
  let notificationsInfo = '';

  if (notificationMethod) {
    const type = notificationMethod
      .replace(`html`, `Slack's built-in notifications (html)`)
      .replace(`winrt`, `default Windows 10 notifications for the Windows Action Center (winrt)`)
      .replace(`window`, `Electron's default for the current operating system (window)`);
    notificationsInfo += `Notifications are set to be delivered via ${type}. `;
  } else {
    notificationsInfo += `Notifications are set to be delivered via the default for the OS. `;
  }

  if (notificationPlayback) {
    const type = notificationPlayback
      .replace('native', 'the operating system (native)')
      .replace('webapp', 'the webapp (webapp)');
    notificationsInfo += `Sound playback for notifications is set to be handled by ${type}. `;
  } else {
    notificationsInfo += `Sound playback for notifications is unchanged, so the default is used. `;
  }

  return notificationsInfo;
}

export function getLocaleInfo({ locale, spellcheckerLanguage }: any): string {
  let localeInfo = '';

  if (locale) {
    const { label } = getLanguageNames(locale);
    localeInfo += `The user's locale is ${label} (${locale}). `;
  } else {
    localeInfo += 'We could not determine a locale setting. ';
  }

  if (spellcheckerLanguage) {
    const { name, label } = getLanguageNames(spellcheckerLanguage);
    localeInfo += `Spellchecking is set to ${name} / ${label} (${spellcheckerLanguage}). `;
  } else {
    localeInfo += 'The spellchecker is set to "automatic detection". ';
  }

  return localeInfo;
}

export function getChannelInfo({ releaseChannel }: any): string {
  return releaseChannel ? ` Updates are coming from the ${releaseChannel} channel.` : '';
}

export function getZoomInfo({ zoomLevel }: any) {
  if (zoomLevel === 0) {
    return ` The app is not zoomed.`;
  } else {
    return zoomLevel ? ` The app is zoomed (level ${zoomLevel})` : '';
  }
}

export function getVersionInfo({ appVersion, versionName }: any): string {
  return appVersion ? `${appVersion} (${versionName || 'no name'})` : '';
}

export function getOSInfo({ platform, platformVersion, pretendNotReallyWindows10 }: any): string {
  const os = platform ? platform.replace('darwin', 'macOS').replace('win32', 'Windows').replace('linux', 'Linux') : null;
  const osVersion = platformVersion && platformVersion.major ? `(${platformVersion.major}.${platformVersion.minor})` : '(unknown version)';
  let windowsInfo = '';

  if (os === 'Windows') {
    const niceName = getWindowsVersion(platformVersion);
    windowsInfo = pretendNotReallyWindows10
      ? ` We're pretending it's an older version, but the user is running on ${niceName}`
      : ` That's ${niceName}`;
  }

  return `${os} ${osVersion}.${windowsInfo}`;
}

/**
 * Takes major, minor, and build number and returns the actual Windows version.
 *
 * @param {number} major
 * @param {number} minor
 * @param {number} build
 * @returns {string}
 */
export function getWindowsVersion({ major, minor, build}: { major: number, minor: number, build: number }): string {
  if (major === 10 && minor === 0) {
    let buildName = '';

    if (build <= 10240) buildName = 'Original Release (RTM), ';
    if (build >= 10586) buildName = 'Threshold 2 (First major round of updates in 2015), ';
    if (build >= 14393) buildName = 'Anniversary Update, ';
    if (build >= 15063) buildName = 'Creators Update, ';
    if (build >= 16299) buildName = 'Fall Creators Update, ';
    if (build >= 17000) buildName = 'April 2018 Update, ';
    if (build >= 17600) buildName = 'October 2018 Update, ';

    return `Windows 10 (${buildName}Build ${build})`;
  }

  // Windows NT 6 and up
  if (major === 6) {
    if (minor === 0) return (`Windows Vista (NT 6.0, Build ${build})`);
    if (minor === 1) return (`Windows 7 (NT 6.1, Build ${build})`);
    if (minor === 2) return (`Windows 8 (NT 6.2, Build ${build})`);
    if (minor === 3) return (`Windows 8.1 (NT 6.3, Build ${build})`);
  }

  return `an unknown Windows version (${major}.${minor}, Build ${build})`;
}
