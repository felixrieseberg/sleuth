import React from 'react';
import fs from 'fs-extra';
import { remote, shell } from 'electron';
import path from 'path';
import { ControlGroup, Button, InputGroup } from '@blueprintjs/core';
import { distanceInWordsToNow } from 'date-fns';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import { getSleuth } from '../sleuth';
import { getUpdateAvailable, defaultUrls } from '../update-check';

const debug = require('debug')('sleuth:welcome');

export interface WelcomeState {
  sleuth: string;
  suggestions: Record<string, fs.Stats>;
  isUpdateAvailable: boolean | string;
}

export interface WelcomeProps {
  sleuth?: string;
  openFile: (filePath: string) => void;
}

export class Welcome extends React.Component<WelcomeProps, Partial<WelcomeState>> {
  constructor(props: WelcomeProps) {
    super(props);

    this.state = {
      sleuth: props.sleuth || getSleuth(),
      isUpdateAvailable: false,
      suggestions: {}
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
        const suggestions = {};

        contents.forEach((file) => {
          if (file.startsWith('logs') || file.startsWith('slack-logs')) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            suggestions[filePath] = stats;
          }
        });

        this.setState({ suggestions });
      })
      .catch((error) => {
        debug(error);
      });
  }

  public deleteSuggestion(filePath: string) {
    const trashName = process.platform === 'darwin'
      ? 'trash'
      : 'recycle bin';

    remote.dialog.showMessageBox({
      title: 'Delete File?',
      message: `Do you want to move ${filePath} to the ${trashName}?`,
      type: 'question',
      buttons: [ 'Cancel', `Move to ${trashName}` ],
      cancelId: 0
    }, (result) => {
      if (result) {
        shell.moveItemToTrash(filePath);
        this.getItemsInDownloadFolder();
      }
    });
  }

  public renderUpdateAvailable() {
    const { isUpdateAvailable } = this.state;

    if (isUpdateAvailable) {
      return (
        <ReactCSSTransitionGroup
          transitionName='filter'
          transitionEnterTimeout={250}
          transitionLeaveTimeout={250}
        >
          <p className='UpdateAvailable'>
            <a href={defaultUrls.downloadUpdate}>By the way, a new version is available!</a>
          </p>
        </ReactCSSTransitionGroup>
      );
    } else {
      return null;
    }
  }

  public renderSuggestions(): JSX.Element | null {

    const { openFile } = this.props;
    const suggestions = this.state.suggestions || {};
    const elements = Object.keys(suggestions)
      .map((filePath) => {
        const stats = suggestions[filePath];
        const basename = path.basename(filePath);
        const age = distanceInWordsToNow(stats.mtimeMs);
        const deleteElement = (
          <Button
            icon='trash'
            minimal={true}
            onClick={() => this.deleteSuggestion(filePath)}
          />
        );

        return (
          <ControlGroup className='Suggestion' fill={true} key={basename}>
            <Button
              className='OpenButton'
              alignText='left'
              onClick={() => openFile(filePath)}
              icon='document'
            >
              {basename}
            </Button>
            <InputGroup
              leftIcon='time'
              defaultValue={`${age} old`}
              readOnly={true}
              rightElement={deleteElement}
            />
          </ControlGroup>
        );
      });

    if (elements.length > 0) {
      return (
        <div className='Suggestions'>
          <h5>From your Downloads folder, may we suggest:</h5>
          <ul>{elements}</ul>
        </div>
      );
    }

    return <div />;
  }

  public render() {
    const { sleuth } = this.state;
    const suggestions = this.renderSuggestions();

    return (
      <div className='Welcome'>
        <i />
        <div>
          <h1 className='Title'>
            <span className='Emoji'>{sleuth}</span>
            <span>Sleuth</span>
          </h1>
          <h4>Drop a logs zip file or folder anywhere on this window to open it.</h4>
          {this.renderUpdateAvailable()}
        </div>
        {suggestions}
      </div>
    );
  }
}
