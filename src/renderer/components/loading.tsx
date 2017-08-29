import * as React from 'react';

export interface LoadingProps {
  percentage?: number;
  message?: string;
}

export interface LoadingState {}

export class Loading extends React.Component<LoadingProps, LoadingState> {
  constructor() {
    super();
  }

  public render(): JSX.Element {
    const { percentage, message } = this.props;

    if (percentage === 100) {
      return <div />;
    }

    return (
      <div className='Loading'>
          <progress value={percentage!.toString()} max='100' />
          <p>{message}</p>
      </div>
    );
  }
}
