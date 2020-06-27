import React from 'react';
import { ipcRenderer } from 'electron';
import classNames from 'classnames';
import fs from 'fs-extra';
import path from 'path';

import { Unzipper } from '../unzip';
import { Welcome } from './welcome';
import { CoreApplication } from './app-core';
import { MacTitlebar } from './mac-titlebar';
import { Preferences } from './preferences';
import { sendWindowReady } from '../ipc';
import { openBacktrace } from '../backtrace';
import { SleuthState } from '../state/sleuth';
import { shouldIgnoreFile } from '../../utils/should-ignore-file';
import { isCacheDir } from '../../utils/is-cache';
import { UnzippedFiles, UnzippedFile } from '../../interfaces';

const debug = require('debug')('sleuth:app');

export interface AppState {
  unzippedFiles: UnzippedFiles;
  openEmpty?: boolean;
}

export class App extends React.Component<{}, Partial<AppState>> {
  public readonly sleuthState: SleuthState;

  constructor(props: {}) {
    super(props);

    this.state = {
      unzippedFiles: []
    };

    localStorage.debug = 'sleuth*';

    this.openFile = this.openFile.bind(this);
    this.openDirectory = this.openDirectory.bind(this);
    this.resetApp = this.resetApp.bind(this);

    this.sleuthState = new SleuthState(this.openFile, this.resetApp);
  }

  /**
   * Alright, time to show the window!
   */
  public componentDidMount() {
    sendWindowReady();

    this.setupFileDrop();
    this.setupBusyResponse();
    this.setupOpenBacktrace();
  }

  /**
   * Takes a rando string, quickly checks if it's a zip or not,
   * and either tries to open it as a file or as a folder. If
   * it's neither, we'll do nothing.
   *
   * @param {string} url
   * @returns {Promise<void>}
   */
  public async openFile(url: string): Promise<void> {
    debug(`Received open-url for ${url}`);
    this.resetApp();

    const isZipFile = /[\s\S]*\.zip$/.test(url);
    if (isZipFile) {
      return this.openZip(url);
    }

    // Let's look at the url a little closer
    const stats = await fs.stat(url);
    if (stats.isDirectory()) {
      return this.openDirectory(url);
    }

    // This is probably a file then
    if (stats.isFile()) {
      return this.openSingleFile(url);
    }
  }


  /**
   * We were handed a single log file. We'll pretend it's an imaginary folder
   * with a single file in it.
   *
   * @param {string} url
   * @returns {Promise<void>}
   */
  public async openSingleFile(url: string): Promise<void> {
    debug(`Now opening single file ${url}`);
    this.resetApp();

    console.groupCollapsed(`Open single file`);

    const stats = fs.statSync(url);
    const file: UnzippedFile = {
      fileName: path.basename(url),
      fullPath: url,
      size: stats.size,
      id: url,
      type: 'UnzippedFile'
    };

    this.sleuthState.setSource(url);
    this.setState({ unzippedFiles: [ file ] });

    console.groupEnd();
  }

  /**
   * Takes a folder url as a string and opens it.
   *
   * @param {string} url
   * @returns {Promise<void>}
   */
  public async openDirectory(url: string): Promise<void> {
    debug(`Now opening directory ${url}`);
    this.resetApp();

    const dir = await fs.readdir(url);
    const unzippedFiles: UnzippedFiles = [];

    console.groupCollapsed(`Open directory`);

    if (isCacheDir(dir)) {
      console.log(`${url} is a cache directory`);
      this.sleuthState.cachePath = url;
      this.setState({ openEmpty: true });
    } else {
      // Not a cache?
      for (const fileName of dir) {
        if (!shouldIgnoreFile(fileName)) {
          const fullPath = path.join(url, fileName);
          const stats = fs.statSync(fullPath);
          const file: UnzippedFile = { fileName, fullPath, size: stats.size, id: fullPath, type: 'UnzippedFile' };

          debug('Found file, adding to result.', file);
          unzippedFiles.push(file);
        }
      }
    }

    this.sleuthState.setSource(url);
    this.setState({ unzippedFiles });

    console.groupEnd();
  }

  /**
   * Takes a zip file url as a string and opens it.
   *
   * @param {string} url
   */
  public async openZip(url: string): Promise<void> {
    const unzipper = new Unzipper(url);
    await unzipper.open();

    const unzippedFiles = await unzipper.unzip();

    this.sleuthState.setSource(url);
    this.setState({ unzippedFiles });
  }

  public resetApp() {
    this.setState({ unzippedFiles: [], openEmpty: false });

    if (this.sleuthState.opened > 0) {
      this.sleuthState.reset(false);
    }

    this.sleuthState.opened = this.sleuthState.opened + 1;
    this.sleuthState.getSuggestions();
  }

  /**
   * Let's render this!
   *
   * @returns {JSX.Element}
   */
  public render(): JSX.Element {
    const { unzippedFiles, openEmpty } = this.state;
    const className = classNames('App', { Darwin: process.platform === 'darwin' });
    const titleBar = process.platform === 'darwin' ? <MacTitlebar /> : '';
    const content = unzippedFiles && (unzippedFiles.length || openEmpty)
      ? <CoreApplication state={this.sleuthState} unzippedFiles={unzippedFiles} />
      : <Welcome state={this.sleuthState} />;

    return (
      <div className={className}>
        <Preferences state={this.sleuthState} />
        {titleBar}
        {content}
      </div>
    );
  }

  /**
   * Whenever a file is dropped into the window, we'll try to open it
   */
  private setupFileDrop() {
    document.ondragover = document.ondrop = (event) => event.preventDefault();
    document.body.ondrop = (event) => {
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        let url = event.dataTransfer.files[0].path;
        url = url.replace('file:///', '/');
        this.openFile(url);
      }

      event.preventDefault();
    };

    ipcRenderer.on('file-dropped', (_event: any, url: string) => this.openFile(url));
  }

  private setupOpenBacktrace() {
    ipcRenderer.on('open-backtrace', () => {
      // Get the file path to the installation file. Only app-* classes know.
      const installationFile = this.state.unzippedFiles?.find((file) => {
        return (file.fileName === 'installation');
      });

      // Then, let the utility handle the details
      openBacktrace(installationFile?.fullPath);
    });
  }

  /**
   * Sometimes, the main process wants to know whether or not this window is currently
   * handling a set of logfiles.
   */
  private setupBusyResponse() {
    ipcRenderer.on('are-you-busy', (event) => {
      const { unzippedFiles } = this.state;

      event.returnValue = !(!unzippedFiles || unzippedFiles.length === 0);
    });
  }
}
