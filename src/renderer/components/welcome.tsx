import * as React from 'react';
import * as fs from 'fs-promise';
import * as path from 'path';

import { remote } from 'electron';
import { getSleuth } from '../sleuth';

const debug = require('debug')('sleuth:welcome');

export interface WelcomeState {
  sleuth: string;
  suggestions: Array<string>;
}

export interface WelcomeProps {
  openFile: Function;
}

export class Welcome extends React.Component<WelcomeProps, Partial<WelcomeState>> {
  constructor() {
    super();

    this.state = {
      sleuth: getSleuth()
    };
  }

  public componentDidMount() {
    this.getItemsInDownloadFolder();
  }

  public getItemsInDownloadFolder(): void {
    const dir = remote.app.getPath('downloads');

    fs.readdir(dir)
      .then((contents) => {
        let suggestions: Array<string> = [];

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

  public render() {
    const { suggestions, sleuth } = this.state;
    const { openFile } = this.props;
    let suggestion = null;

    if (suggestions && suggestions.length > 0) {
      suggestion = (
        <div className='Suggestions'>
          <h5>From your Downloads folder, may we suggest:</h5>
          {suggestions.map((file) => <a key={file} className="small" onClick={() => openFile(file)}>{path.basename(file)}</a>)}
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
        </div>
        {suggestion}
      </div>
    );
  }
}
