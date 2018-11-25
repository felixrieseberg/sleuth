import React from 'react';
import { ProgressBar } from '@blueprintjs/core';

export interface LoadingProps {
  percentage?: number;
  message?: string;
}

export interface LoadingState {}

export class Loading extends React.Component<LoadingProps, LoadingState> {
  constructor(props: LoadingProps) {
    super(props);
  }

  public render(): JSX.Element {
    const { percentage, message } = this.props;

    if (percentage === 100) {
      return <div />;
    }

    return (
      <div className='Loading'>
        <ProgressBar animate={false} value={percentage! / 100} />
        <br />
        <p>{message}</p>
      </div>
    );
  }
}
