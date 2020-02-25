import React from 'react';
import { observer } from 'mobx-react';
import { Card, Callout, Intent, Button } from '@blueprintjs/core';
import autoBind from 'react-autobind';

import { SleuthState } from '../state/sleuth';
import { showOpenDialog } from '../ipc';
import { Loading } from './loading';
import { CachetoolTable } from './cachetool-table';

export interface CachetoolState {
  cachePath?: string;
  isLoadingKeys?: boolean;
  keys: Array<string>;
}

export interface CachetoolProps {
  sleuth?: string;
  state: SleuthState;
}

@observer
export class Cachetool extends React.Component<CachetoolProps, Partial<CachetoolState>> {
  constructor(props: CachetoolProps) {
    super(props);

    this.state = {
      keys: []
    };

    autoBind(this);
  }

  public render() {
    const { cachePath, isLoadingKeys } = this.state;
    const warning = this.renderPlatformWarning();
    let content: JSX.Element;

    if (warning) {
      content = warning;
    } else if (!cachePath) {
      content = this.renderIntroduction();
    } else if (isLoadingKeys) {
      content = this.renderLoading();
    } else {
      content = this.renderData();
    }

    return (
      <div className='cachetool'>
        {content}
      </div>
    );
  }

  private async onOpenFolder() {
    const { filePaths } = await showOpenDialog();

    if (filePaths && filePaths.length > 0) {
      this.setState({
        cachePath: filePaths[0]
      });
    }

    this.getKeys();
  }

  private renderData() {
    const { search, searchIndex, showOnlySearchResults } = this.props.state;

    return (
      <CachetoolTable
        state={this.props.state}
        keys={this.state.keys}
        showOnlySearchResults={showOnlySearchResults}
        searchIndex={searchIndex}
        search={search}
      />
    );
  }

  private renderLoading() {
    return (
      <Card>
        <Loading
          message={'Loading cache keys...'}
          animate={true}
        />
      </Card>
    );
  }

  private renderIntroduction() {
    return (
      <Card>
        <h2>Cachetool</h2>
        <p>
          This tool allows you to closely examine Slack's cache.
        </p>
        <Button
          text='Open Cache Folder'
          icon='folder-open'
          onClick={this.onOpenFolder}
        />
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

  private async getKeys() {
    this.setState({ isLoadingKeys: true });

    const { listKeys } = await import('cachetool');
    const { cachePath } = this.state;

    if (!cachePath) return [];

    const keys = await listKeys({ cachePath });

    console.log(keys);

    this.setState({ isLoadingKeys: false, keys });

    return keys;
  }
}
