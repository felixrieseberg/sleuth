import * as React from 'react';

export interface LoadingProps {
  percentage?: number;
  message?: string;
}

export class Loading extends React.Component<LoadingProps, undefined> {
  constructor() {
    super();
  }

  public render() {
    const { percentage, message } = this.props;

    if (percentage === 100) return null;

    return (
      <div className="Loading">
          <progress value={percentage} max="100" />
          <p>{message}</p>
      </div>
    );
  }
}
