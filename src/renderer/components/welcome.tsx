import React from 'react';
import path from 'path';

import { ControlGroup, Button, InputGroup } from '@blueprintjs/core';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { observer } from 'mobx-react';

import { getSleuth } from '../sleuth';
import { getUpdateAvailable, defaultUrls } from '../update-check';
import { deleteSuggestion, deleteSuggestions } from '../suggestions';
import { SleuthState } from '../state/sleuth';
import { isBefore } from 'date-fns';

export interface WelcomeState {
  sleuth: string;
  isUpdateAvailable: boolean | string;
}

export interface WelcomeProps {
  sleuth?: string;
  state: SleuthState;
}

@observer
export class Welcome extends React.Component<WelcomeProps, Partial<WelcomeState>> {
  constructor(props: WelcomeProps) {
    super(props);

    this.state = {
      sleuth: props.sleuth || getSleuth(),
      isUpdateAvailable: false,
    };

    getUpdateAvailable().then((isUpdateAvailable: boolean | string) => {
      return this.setState({ isUpdateAvailable });
    });
  }

  public async deleteSuggestion(filePath: string) {
    await deleteSuggestion(filePath);
    await this.props.state.getSuggestions();
  }

  public async deleteSuggestions(filePaths: Array<string>) {
    await deleteSuggestions(filePaths);
    await this.props.state.getSuggestions();
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
    const { openFile } = this.props.state;
    const suggestions = this.props.state.suggestions || {};
    const elements = suggestions
      .map((file) => {
        const stats = file;
        const basename = path.basename(file.filePath);
        const deleteElement = (
          <Button
            icon='trash'
            minimal={true}
            onClick={() => this.deleteSuggestion(file.filePath)}
          />
        );

        return (
          <ControlGroup className='Suggestion' fill={true} key={basename}>
            <Button
              className='OpenButton'
              alignText='left'
              onClick={() => openFile(file.filePath)}
              icon='document'
            >
              {basename}
            </Button>
            <InputGroup
              leftIcon='time'
              defaultValue={`${stats.age} old`}
              readOnly={true}
              rightElement={deleteElement}
            />
          </ControlGroup>
        );
      });

    if (elements.length > 0) {
      return (
        <div className='Suggestions'>
          <ul>{elements}</ul>
          {this.renderDeleteAll()}
        </div>
      );
    }

    return <div />;
  }

  public renderDeleteAll(): JSX.Element | null {
    const suggestions = this.props.state.suggestions || {};

    // Do we have any files older than 48 hours?
    const twoDaysAgo = Date.now() - 172800000;
    const toDeleteAll: Array<string> = [];

    Object.keys(suggestions).forEach((key) => {
      const item = suggestions[key];
      if (isBefore(item.atimeMs, twoDaysAgo)) {
        toDeleteAll.push(key);
      }
    });

    if (toDeleteAll.length > 0) {
      return (
        <Button
          icon='trash'
          onClick={() => this.deleteSuggestions(toDeleteAll)}
        >
          Delete files older than 2 days
        </Button>
      );
    }

    return null;
  }

  public render() {
    const { sleuth } = this.state;
    const scrollStyle = { height: '100%',  };
    scrollStyle['overflow-y'] = 'auto';
    scrollStyle['margin-bottom'] = '50px';

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
        <h5>From your Downloads folder, may we suggest:</h5>
        <div style={scrollStyle}>
          {this.renderSuggestions()}
        </div>
      </div>
    );
  }
}
