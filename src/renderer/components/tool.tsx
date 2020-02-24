import { observer } from 'mobx-react';
import React from 'react';

import { SleuthState } from '../state/sleuth';

export interface ToolState {
  sleuth: string;
}

export interface ToolProps {
  sleuth?: string;
  state: SleuthState;
}

@observer
export class Tool extends React.Component<ToolProps, Partial<ToolState>> {
  public render() {
    return (
      <div>Tool</div>
    );
  }
}
