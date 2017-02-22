import * as React from 'react';
import { ipcRenderer } from 'electron';
import * as classNames from 'classnames';

import { Unzipper, UnzippedFiles } from '../unzip';
import { Welcome } from './welcome';
import { LogView } from './logview';
import { MacTitlebar } from './mac-titlebar';

export interface AppState {
  logFiles: UnzippedFiles;
}

export class App extends React.Component<undefined, AppState> {
  constructor() {
    super();

    this.state = {
      logFiles: []
    };

    ipcRenderer.on('file-dropped', (_e, url) => this.openFile(url));
  }

  public openFile(url: string) {
    console.log(`Received open-url for ${url}`);
    const unzipper = new Unzipper(url);
    unzipper.open()
      .then(() => unzipper.unzip())
      .then((logFiles: UnzippedFiles) => this.setState({logFiles}));
  }

  public render(): JSX.Element | null {
    const { logFiles } = this.state;
    const className = classNames('App', { Darwin: process.platform === 'darwin' });
    const titleBar = process.platform === 'darwin' ? <MacTitlebar /> : '';
    let content: JSX.Element | null = <Welcome />;

    if (logFiles && logFiles.length > 0) {
      content = <LogView logFiles={logFiles} />;
    }

    return (
      <div className={className}>
        {titleBar}
        {content}
      </div>
    );
  }
}
