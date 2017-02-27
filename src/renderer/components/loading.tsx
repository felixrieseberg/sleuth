import * as React from 'react';

export interface LoadingProps {
  percentage?: number;
  message?: string;
}

export class Loading extends React.Component<LoadingProps, undefined> {
  constructor() {
    super();
  }

  public render(): JSX.Element | null {
    const { percentage, message } = this.props;

    if (percentage === 100) {
      return null;
    }

    return (
      <div className='Loading'>
          <progress value={percentage!.toString()} max="100" />
          <p>{message}</p>
      </div>
    );
  }
}
