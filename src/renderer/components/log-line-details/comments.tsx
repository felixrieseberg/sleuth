import * as React from 'react';
import { cooperAuth } from '../../cooper/auth';

export interface LogLineCommentsProps {
  line?: string;
}

export class LogLineComments extends React.Component<LogLineCommentsProps, undefined> {
  constructor() {
    super();
  }

  public componentDidMount() {
    this.hasComments();
  }

  public async hasComments() {
    const isSignedIn = await cooperAuth.getIsSignedIn();
    console.log(`Is signed in: ${isSignedIn}`);
  }

  public render() {
    return (
      <div>
        <p>Hello!</p>
      </div>
    );
  }
}