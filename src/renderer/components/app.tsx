import * as React from 'react';
import { ipcRenderer } from 'electron';
import * as classNames from 'classnames';
import * as fs from 'fs-promise';
import * as path from 'path';

import { UnzippedFile, UnzippedFiles, Unzipper } from '../unzip';
import { Welcome } from './welcome';
import { LogView } from './logview';
import { MacTitlebar } from './mac-titlebar';

export interface AppState {
  unzippedFiles: UnzippedFiles;
}

export class App extends React.Component<undefined, AppState> {
  constructor() {
    super();

    this.state = {
      unzippedFiles: [],
    };

    ipcRenderer.on('file-dropped', (_e, url) => this.openFile(url));
  }

  public openFile(url: string) {
    console.log(`Received open-url for ${url}`);

    const isZipFile = /[\s\S]*\.zip$/.test(url);
    if (isZipFile) {
      return this.openZip(url);
    }

    // Let's look at the url a little closer
    fs.stat(url).then((stats: fs.Stats) => {
      if (stats.isDirectory()) {
        return this.openDirectory(url);
      }
    });
  }

  public openDirectory(url: string) {
    console.log(`Now opening directory ${url}`);

    fs.readdir(url)
      .then((dir) => {
        const unzippedFiles: UnzippedFiles = [];
        const promises: Array<Promise<any>> = [];

        dir.forEach((fileName) => {
          const fullPath = path.join(url, fileName);
          console.log(`Checking out file ${fileName}`);

          const promise = fs.stat(fullPath)
            .then((stats: fs.Stats) => {
              const file: UnzippedFile = { fileName, fullPath, size: stats.size };
              console.log('Found file, adding to result.', file);
              unzippedFiles.push(file);
            });

          promises.push(promise);
        });

        Promise.all(promises).then(() => this.setState({ unzippedFiles }));
      });
  }

  public openZip(url: string) {
    const unzipper = new Unzipper(url);
    unzipper.open()
      .then(() => unzipper.unzip())
      .then((unzippedFiles: UnzippedFiles) => this.setState({unzippedFiles}));
  }

  public render(): JSX.Element | null {
    const { unzippedFiles } = this.state;
    const className = classNames('App', { Darwin: process.platform === 'darwin' });
    const titleBar = process.platform === 'darwin' ? <MacTitlebar /> : '';
    let content: JSX.Element | null = <Welcome />;

    if (unzippedFiles && unzippedFiles.length > 0) {
      content = <LogView unzippedFiles={unzippedFiles} />;
    }

    return (
      <div className={className}>
        {titleBar}
        {content}
      </div>
    );
  }
}
