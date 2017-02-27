import * as React from 'react';

export class MacTitlebar extends React.Component<undefined, undefined> {
  constructor() {
    super();
  }

  public shouldComponentUpdate() {
    return false;
  }

  public render(): JSX.Element | null {
    return (
      <div className="MacTitlebar" />
    );
  }
}
