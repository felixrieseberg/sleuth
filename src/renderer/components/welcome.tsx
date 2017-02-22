import * as React from 'react';

export class Welcome extends React.Component<undefined, undefined> {
  constructor() {
    super();
  }

  public render() {
    return (
      <div className="welcome">
          <h2>👋 Hey there!</h2>
          <h4>Just drop a logs.zip file here.</h4>
      </div>
    );
  }
}
