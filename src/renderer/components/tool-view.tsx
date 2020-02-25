import { observer } from 'mobx-react';
import React from 'react';

import { SleuthState } from '../state/sleuth';
import { Tool } from '../interfaces';
import { Cachetool } from './cachetool';

export interface ToolViewState {
  sleuth: string;
}

export interface ToolViewProps {
  sleuth?: string;
  state: SleuthState;
}

@observer
export class ToolView extends React.Component<ToolViewProps, Partial<ToolViewState>> {
  public render() {
    const { state } = this.props;

    if (state.selectedLogFile === Tool.cache) {
      return <Cachetool state={state} />;
    }

    return null;
  }
}
