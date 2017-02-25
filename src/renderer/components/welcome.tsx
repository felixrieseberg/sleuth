import * as React from 'react';
import * as os from 'os';
import * as fs from 'fs-promise';
import * as path from 'path';

import { remote } from 'electron';

export interface WelcomeState {
  sleuth: string;
  suggestions: Array<string>;
}

export class Welcome extends React.Component<undefined, Partial<WelcomeState>> {
  constructor() {
    super();

    this.state = {
      sleuth: this.getSleuth()
    };
  }

  componentDidMount() {
    this.getItemsInDownloadFolder();
  }

  public getSleuth() {
    const sleuths = ['🕵', '🕵️‍♀️', '🕵🏻', '🕵🏼', '🕵🏽', '🕵🏾', '🕵🏿', '🕵🏻‍♀️', '🕵🏼‍♀️', '🕵🏽‍♀️', '🕵🏾‍♀️', '🕵🏿‍♀️'];

    if (process.platform === 'darwin' || (process.platform === 'win32' && os.release().startsWith('10'))) {
      return sleuths[Math.floor(Math.random() * 11) + 1];
    } else {
      return sleuths[Math.round(Math.random())];
    }
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
        console.log(error);
      });
  }

  public render() {
    const { suggestions, sleuth } = this.state;
    let suggestion = null;

    if (suggestions && suggestions.length > 0) {
      suggestion = (
        <div className='Suggestions'>
          <h5>From your Downloads folder, may we suggest:</h5>
          {suggestions.map((file) => <a className="small" href={file}>{path.basename(file)}</a>)}
        </div>
      );
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
