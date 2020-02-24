import React from 'react';
import { observer } from 'mobx-react';
import { Card, Callout, Intent } from '@blueprintjs/core';

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
    const warning = this.renderPlatformWarning();
    const content = warning ? warning : this.renderTool();

    return (
      <div className='cachetool'>
        {content}
      </div>
    );
  }

  private renderTool() {
    return (
      <Card className='StateTable-Info'>
        <h5>Cachetool</h5>
        <p>This tool allows you to closely examine Slack's cache.</p>
      </Card>
    );
  }

  private renderPlatformWarning(): JSX.Element | null {
    if (process.platform !== 'darwin') {
      return (
        <Callout intent={Intent.WARNING}>
          <p>
            Bad news: This tool is currently only supported on macOS.
            It can analze caches from Slack, Electron, or Chrome ran
            on any platform, but the tool itself can only do so when
            running on macOS.
          </p>
        </Callout>
      );
    } else {
      return null;
    }
  }
}
