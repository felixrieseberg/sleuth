import * as React from 'react';
import { ipcRenderer } from 'electron';

import { Unzipper, UnzippedFiles } from '../unzip';
import { Welcome } from './welcome';

export interface AppState {
  logfiles: UnzippedFiles;
}

export class App extends React.Component<undefined, AppState> {
  constructor() {
    super();

    ipcRenderer.on('file-dropped', (_e, url) => this.openFile(url));
  }

  public openFile(url: string) {
    console.log(`Received open-url for ${url}`);
    const unzipper = new Unzipper(url);
    unzipper.open().then(() => unzipper.unzip());
  }

  public render() {
    return (
      <div className="app">
        <Welcome />
      </div>
    );
  }
}
