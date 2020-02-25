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

export interface CachetoolState {
  tableHeight: number;
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
      tableHeight: 600
    };

    autoBind(this);
  }

  public render() {
    const { cachePath, isLoadingCacheKeys } = this.props.state;
    const warning = this.renderPlatformWarning();
    let content: JSX.Element;

    if (false) {
      content = warning;
    } else if (!cachePath) {
      content = this.renderIntroduction();
    } else if (isLoadingCacheKeys) {
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
          This tool allows you to closely examine Slack's cache. It will accept the <code>Cache</code> folder
          found in the user's "app data" directory from Slack, Chrome, or any other Electron application.
          By default, it can be found in the following locations:
        </p>
        <ul>
          <li><strong>Windows:</strong> <code>%APPDATA%\Slack\Cache</code></li>
          <li><strong>macOS:</strong> <code>~/Libary/Application Support/Slack/Cache</code></li>
          <li><strong>Linux:</strong> <code>~/.config/Slack/Cache</code></li>
        </ul>
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
        <Callout intent={Intent.WARNING} style={{ margin: '2.2rem', width: 'unset' }}>
          <p>
            Bad news: This feature is currently <strong>only supported on macOS.</strong>
            It can analyze caches from Slack, Electron, or Chrome ran
            on any platform, but the tool itself can only do so when
            running on macOS.
          </p>
          <p>
            Once Chromium offers a <code>cachetool.cc</code> version for Windows,
            Sleuth will be able to offer this feature on Windows, too.
          </p>
        </Callout>
      );
    } else {
      return null;
    }
  }
}
