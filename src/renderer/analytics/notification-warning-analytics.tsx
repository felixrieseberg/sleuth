import * as React from 'react';

export const warningDescriptionDict = {
  'Quiet Hours': {
    QUIET_HOURS: 'Are Windows Quiet Hours (8 - 10) or Windows Focus Assist (10+) active?',
  },

  'Presentation Mode': {
    PRESENTATION_QUIET_TIME:
      'The current user is in "quiet time", which is the first hour after a \
      new user logs into his or her account for the first time. During this \
      time, most notifications should not be sent or shown. This lets a user \
      become accustomed to a new computer system without those distractions. \n \
      Quiet time also occurs for each user after an operating system upgrade \
      or clean installation.',
    PRESENTATION_D3D_FULL_SCREEN:
      'A full-screen (exclusive mode) Direct3D application is running. This is \
      most likely a game.',
    PRESENTATION_MODE:
      'The user has activated Windows presentation settings to block \
      notifications and pop-up messages. Note that this isn\'t always a manual \
      action, presentation apps usually enable this for the user.',
    PRESENTATION_BUSY:
      'A full-screen application is running or Presentation Settings are applied. \
      Presentation Settings allow a user to put their machine into a state fit \
      for an uninterrupted presentation, such as a set of PowerPoint slides, with \
      a single click. \
      It is not entirely clear how this is different from PRESENTATION_MODE',
  },

  'Action Center': {
    AC_DISABLED_BY_MANIFEST:
      'Will be returned if the user has disabled notifications for Slack in the Windows Settings.',
    AC_DISABLED_BY_GROUP_POLICY: '',
    AC_DISABLED_FOR_USER: '',
    AC_DISABLED_FOR_APPLICATION: '',
  },

  'Slack Preferences': {
    ZERO_MAX: 'Do we have only zero notifications allowed?',
    ZERO_TIMEOUT: 'Is the notifications timeout for notifications very short?',
    UNKNOWN_METHOD: 'Is an unknown notification method set?',
    UNKNOWN_HTML_STYLE: 'Is an unknown html notification style set?',
    NATIVE_PLAYBACK_ENFORCED: 'Is a certain sound playback style enforced?',
    WEBAPP_PLAYBACK_ENFORCED: 'Is a certain sound playback style enforced?',
    FAILOVER_WITHIN_LAST_WEEK: 'Did we just have a failover?',
    FAILOVER_DISABLED: 'Are failovers disabled?',
    GPU_COMPOSITION_UNAVAILABLE: 'Is GPU Composition not available?',
    AERO_GLASS_UNAVAILABLE: 'Is Aero Glass / DWM not available?',
  },
};

export const categoryDescriptionDict = {
  'Quiet Hours': '',
  'Presentation Mode':
    'The following four settings are reasons the Windows Action Center-powering \
    ToastNotifier might not be willing to deliver our notifications. Note that \
    AC_DISABLED_BY_MANIFEST will be returned if the user has disabled \
    notifications for Slack in the Windows Settings.',
  'Action Center': '',
  'Slack Preferences': '',
};

export function getNotifWarningsInfo(data: Array<string>): Array<JSX.Element> {
  const result: Array<JSX.Element> = [];
  result.push(<p>⚠️ The following notification warnings were detected. ⚠️</p>);

  Object.keys(categoryDescriptionDict).forEach((category: string) => {
    const categoryWarnings = intersect(category, data);
    if (categoryWarnings && categoryWarnings.length > 0) {
      const warningList: Array<JSX.Element> = categoryWarnings.map((w: string) => {
        return (<li key={w}>{w}: {warningDescriptionDict[category][w]}</li>);
      });

      result.push(<p><b>{category}</b></p>);
      result.push(<p>{categoryDescriptionDict[category]}</p>);
      result.push(<ul>{warningList}</ul>);
    }
  });

  return result;
}

export function intersect(category: string, data: Array<string>): Array<string> {
  return Object.keys(warningDescriptionDict[category]).filter((value) => -1 !== data.indexOf(value.toString()));
}
