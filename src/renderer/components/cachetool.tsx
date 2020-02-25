import React from 'react';
import { observer } from 'mobx-react';
import { Card, Callout, Intent, Button } from '@blueprintjs/core';
import autoBind from 'react-autobind';

import { SleuthState } from '../state/sleuth';
import { showOpenDialog } from '../ipc';
import { Loading } from './loading';
import { CachetoolTable } from './cachetool-table';
import { CachetoolDetails } from './cachetool-details';
import { Scrubber } from './scrubber';
import { getFontForCSS } from './preferences-font';
import { IReactionDisposer, autorun } from 'mobx';

export interface CachetoolState {
  isLoadingKeys?: boolean;
  tableHeight: number;
}

export interface CachetoolProps {
  sleuth?: string;
  state: SleuthState;
}

@observer
export class Cachetool extends React.Component<CachetoolProps, Partial<CachetoolState>> {
  private getKeysAutorunDispose: IReactionDisposer;

  constructor(props: CachetoolProps) {
    super(props);

    this.state = {
      tableHeight: 600
    };

    autoBind(this);
  }

  public componentWillMount() {
    this.getKeysAutorunDispose = autorun(this.getKeys);
  }

  public componentWillUnmount() {
    this.getKeysAutorunDispose();
  }

  public render() {
    const { isLoadingKeys } = this.state;
    const { cachePath } = this.props.state;
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
      this.props.state.cachePath = filePaths[0];
    }
  }

  public resizeHandler(height: number) {
    if (height < 100 || height > (window.innerHeight - 100)) return;
    this.setState({ tableHeight: height });
  }

  private renderData() {
    const { search, searchIndex, showOnlySearchResults, isDetailsVisible, font, cacheKeys } = this.props.state;
    const scrubber = <Scrubber elementSelector='LogTableContainer' onResizeHandler={this.resizeHandler} />;
    const tableStyle = isDetailsVisible ? { height: this.state.tableHeight } : { flexGrow: 1 };

    return (
      <div className='LogContent' style={{ fontFamily: getFontForCSS(font) }}>
        <div id='LogTableContainer' style={tableStyle}>
          <CachetoolTable
            state={this.props.state}
            keys={cacheKeys}
            showOnlySearchResults={showOnlySearchResults}
            searchIndex={searchIndex}
            search={search}
          />
        </div>
        {isDetailsVisible ? scrubber : null}
        <CachetoolDetails state={this.props.state} />
      </div>
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

    const { cachePath } = this.props.state;
    if (!cachePath) return [];

    const { listKeys } = await import('cachetool');
    this.props.state.cacheKeys = await listKeys({ cachePath });
    this.setState({ isLoadingKeys: false });
  }
}
