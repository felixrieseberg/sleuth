import * as React from 'react';
import  * as os from 'os';

export interface WelcomeState {
  sleuth: string;
}


export class Welcome extends React.Component<undefined, WelcomeState> {
  constructor() {
    super();

    this.state = {
      sleuth: this.getSleuth()
    };
  }

  public getSleuth() {
    const sleuths = ['🕵', '🕵️‍♀️', '🕵🏻', '🕵🏼', '🕵🏽', '🕵🏾', '🕵🏿', '🕵🏻‍♀️', '🕵🏼‍♀️', '🕵🏽‍♀️', '🕵🏾‍♀️', '🕵🏿‍♀️'];

    if (process.platform === 'darwin' || (process.platform === 'win32' && os.release().startsWith('10'))) {
      return sleuths[Math.floor(Math.random() * 12) + 1];
    } else {
      return sleuths[Math.round(Math.random())];
    }
  }

  public render() {
    return (
      <div className='Welcome'>
          <h1 className='Emoji'>{this.state.sleuth}</h1>
          <h2>Hey there!</h2>
          <h4>Just drop a logs file or folder here.</h4>
      </div>
    );
  }
}
