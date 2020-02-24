import React from 'react';
import { observer } from 'mobx-react';
import { Card } from '@blueprintjs/core';

import { SleuthState } from '../state/sleuth';

export interface CacheToolState {
  cachePath?: string;
}

export interface CacheToolProps {
  sleuth?: string;
  state: SleuthState;
}

@observer
export class CacheTool extends React.Component<CacheToolProps, Partial<CacheToolState>> {
  public render() {
    return (
      <>
        <Card className='StateTable-Info'>
          <h5>Cachetool</h5>
          <p>This tool allows you to closely examine Slack's cache.</p>
        </Card>
      </>
    );
  }
}
