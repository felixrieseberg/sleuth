import React from 'react';
import { getLanguageNames } from '../../utils/iso639';

export function getSettingsInfo(data: any): Array<JSX.Element> {
  const result: Array<JSX.Element> = [];
  result.push(<p>📣 {getNotificationsInfo(data)}</p>);
  result.push(<p>🔍 {getZoomInfo(data)}</p>);
  result.push(<p>🌍 {getLocaleInfo(data)}</p>);
  result.push(<p>💻 {getHWInfo(data)}</p>);

  return result;
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
  return releaseChannel
    ? ` Updates are coming from the ${releaseChannel} channel.`
    : ' No channel is specified.';
}

export function getZoomInfo({ zoomLevel }: any) {
  if (zoomLevel === 0) {
    return ` The app is not zoomed.`;
  } else {
    return zoomLevel ? ` The app is zoomed (level ${zoomLevel})` : '';
  }
}
