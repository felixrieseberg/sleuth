import React from 'react';
import * as path from 'path';
import { SleuthState } from '../state/sleuth';

interface TitlebarProps {
  state: SleuthState;
}

export class MacTitlebar extends React.Component<TitlebarProps> {
  constructor(props: TitlebarProps) {
    super(props);
  }

  render () {
    const { source } = this.props.state;
    const title = source
    ? `${path.basename(source)} - Sleuth`
    : `Sleuth`;
    return <div className='MacTitlebar'><span>{title}</span></div>;
  }
}
