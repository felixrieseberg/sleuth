import React from 'react';

export interface MacTitlebarProps {}
export interface MacTitlebarState {}

export class MacTitlebar extends React.Component<MacTitlebarProps, MacTitlebarState> {
  constructor(props: MacTitlebarProps) {
    super(props);
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
