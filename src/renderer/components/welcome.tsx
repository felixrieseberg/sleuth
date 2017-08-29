import * as React from 'react';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import { remote } from 'electron';
import { getSleuth } from '../sleuth';
import { getUpdateAvailable, defaultUrls } from '../update-check';

const debug = require('debug')('sleuth:welcome');

export interface WelcomeState {
  sleuth: string;
  suggestions: Array<string>;
  isUpdateAvailable: boolean | string;
}

export interface WelcomeProps {
  openFile: (filePath: string) => void;
}

export class Welcome extends React.Component<WelcomeProps, Partial<WelcomeState>> {
  constructor() {
    super();

    this.state = {
      sleuth: getSleuth(),
      isUpdateAvailable: false
    };

    getUpdateAvailable().then((isUpdateAvailable: boolean | string) => {
      return this.setState({ isUpdateAvailable });
    });
  }

  public componentDidMount() {
    this.getItemsInDownloadFolder();
  }

  public getItemsInDownloadFolder(): void {
    const dir = remote.app.getPath('downloads');

    fs.readdir(dir)
      .then((contents) => {
        const suggestions: Array<string> = [];

        contents.forEach((file) => {
          if (file.startsWith('logs')) {
            suggestions.push(path.join(dir, file));
          }
        });

        this.setState({ suggestions });
      })
      .catch((error) => {
        debug(error);
      });
  }

  public renderUpdateAvailable() {
    const { isUpdateAvailable } = this.state;

    if (isUpdateAvailable) {
      return (
        <ReactCSSTransitionGroup
          transitionName='filter'
          transitionEnterTimeout={250}
          transitionLeaveTimeout={250}>
          <p className='UpdateAvailable'>
            <a href={defaultUrls.downloadUpdate}>By the way, a new version is available!</a>
          </p>
        </ReactCSSTransitionGroup>
      );
    } else {
      return null;
    }
  }

  public render() {
    const { suggestions, sleuth } = this.state;
    const { openFile } = this.props;
    let suggestion = null;

    if (suggestions && suggestions.length > 0) {
      suggestion = (
        <div className='Suggestions'>
          <h5>From your Downloads folder, may we suggest:</h5>
          {suggestions.map((file) => <a key={file} className='small' onClick={() => openFile(file)}>{path.basename(file)}</a>)}
        </div>
      );
    } else {
      suggestion = (<div />);
    }

    return (
      <div className='Welcome'>
        <i />
        <div>
          <h1 className='Emoji'>{sleuth}</h1>
          <h2>Hey there!</h2>
          <h4>Just drop a logs file or folder here.</h4>
          {this.renderUpdateAvailable()}
        </div>
        {suggestion}
      </div>
    );
  }
}
