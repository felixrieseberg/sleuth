import * as React from 'react';

export interface MacTitlebarProps {}
export interface MacTitlebarState {}

export class MacTitlebar extends React.Component<MacTitlebarProps, MacTitlebarState> {
  constructor() {
    super();
  }

  public shouldComponentUpdate() {
    return false;
  }

  public render(): JSX.Element {
    return (
      <div className='MacTitlebar' />
    );
  }
}
