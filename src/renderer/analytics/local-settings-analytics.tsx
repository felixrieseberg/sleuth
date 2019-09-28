import React from 'react';
import { shell } from 'electron';

export function getLocalSettingsInfo(data: any): Array<JSX.Element> {
  const result: Array<JSX.Element> = [];
  result.push(<p>📋 Electron version: {getElectronLink(data)} </p>);
  return result;
}

function getElectronLink({ lastElectronVersionLaunched }: any): JSX.Element {
    const electronVersion = lastElectronVersionLaunched as string;


  if (electronVersion) {
      const link = electronVersion.match(/beta/) ? `https://electronjs.org/releases/beta#${electronVersion}` :
        `https://electronjs.org/releases/stable#${electronVersion}`;

    return (<a onClick={() => shell.openExternal(link)}>{link}</a>);
  } else {
    return (<p>Unknown</p>);
  }
}
