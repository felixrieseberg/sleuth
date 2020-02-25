import { observer } from 'mobx-react';
import React from 'react';
import * as path from 'path';
import classNames from 'classnames';
import * as fs from 'fs-extra';
import autoBind from 'react-autobind';
import { Card, Elevation, Tabs, Tab, Callout, Intent, Button } from '@blueprintjs/core';
import { autorun, IReactionDisposer } from 'mobx';

import { SleuthState } from '../state/sleuth';
import { tmpdir } from 'os';
import { showSaveDialog } from '../ipc';


export interface CachetoolDetailsProps {
  state: SleuthState;
}

export interface CachetoolDetailsState {
  headers?: string;
  dataPath?: string;
}

@observer
export class CachetoolDetails extends React.Component<CachetoolDetailsProps, CachetoolDetailsState> {
  private headerAutorunDispose: IReactionDisposer;
  private dataAutorunDispose: IReactionDisposer;
  private tmpdir: string;

  constructor(props: CachetoolDetailsProps) {
    super(props);

    autoBind(this);

    this.headerAutorunDispose = autorun(async () => {
      const selectedCacheKey = this.props.state.selectedCacheKey;
      const cachePath = this.props.state.cachePath;

      this.setState({
        headers: await this.getHeaders(cachePath, selectedCacheKey)
      });
    });

    this.dataAutorunDispose = autorun(async () => {
      const selectedCacheKey = this.props.state.selectedCacheKey;
      const cachePath = this.props.state.cachePath;

      this.setState({
        dataPath: await this.getData(cachePath, selectedCacheKey)
      });
    });
  }

  public componentWillUnmount() {
    this.headerAutorunDispose();
    this.dataAutorunDispose();
  }

  /**
   * Toggle the whole data view.
   */
  public toggle() {
    this.props.state.isDetailsVisible = !this.props.state.isDetailsVisible;
  }

  /**
   * Renders a single log entry, ensuring that people can scroll around and still now what log entry they're looking at.
   *
   * @param {string} key
   * @returns {(JSX.Element | null)}
   */
  public renderEntry(key: string): JSX.Element | null {
    return (
      <div className='Details-LogEntry'>
        <Card className='Message Monospace' elevation={Elevation.THREE}>{key}</Card>
        <Card elevation={Elevation.TWO}>
          <Tabs>
            <Tab id='headers' title='Headers' panel={this.renderHeaders()} />
            <Tab id='content' title='Content' panel={this.renderContent()} />
          </Tabs>
        </Card>
      </div>
    );
  }

  public renderHeaders() {
    return (
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {this.state.headers || 'Headers loading...'}
      </pre>
    );
  }

  public renderContent() {
    return (
      <>
        <Callout>
          <img src={this.state.dataPath} />
        </Callout>
        <br />
        <Callout intent={Intent.WARNING}>
          <p>
            We're blindly hoping that we're dealing with an image. If we're not, you
            might be able to open the file yourself with another program.
          </p>
          <Button
            text='Save File'
            icon='download'
            onClick={this.download}
          />
        </Callout>
      </>
    );
  }

  public render(): JSX.Element | null {
    const { selectedCacheKey } = this.props.state;
    const { isDetailsVisible } = this.props.state;

    if (!isDetailsVisible) return null;

    const className = classNames('Details', { IsVisible: isDetailsVisible });
    const logEntryInfo = selectedCacheKey ? this.renderEntry(selectedCacheKey) : null;

    return (
      <div className={className}>
        {logEntryInfo}
      </div>
    );
  }

  public async download() {
    const { dataPath } = this.state;
    if (!dataPath) return;

    const filename = this.getFilename(dataPath);
    const { filePath } = await showSaveDialog(filename);

    if (filePath) {
      try {
        await fs.copyFile(dataPath, filePath);
      } catch (error) {
        console.error(`Cachetool download()`, error);
      }
    }
  }

  public async getHeaders(cachePath?: string, key?: string) {
    if (!cachePath || !key) return '';

    try {
      const { getStream } = await import('cachetool');

      return (await getStream({ cachePath, key })).toString();
    } catch (error) {
      return '';
    }
  }

  public async getData(
    cachePath?: string, key?: string
  ): Promise<string | undefined> {
    if (!cachePath || !key) return '';

    try {
      const { getStream } = await import('cachetool');
      const data = await getStream({
        cachePath,
        key,
        index: 1
      });

      if (!this.tmpdir || !fs.existsSync(this.tmpdir)) {
        this.tmpdir = await fs.mkdtemp(path.join(tmpdir(), 'sleuth'));
      }

      const fileName = this.getFilename(key);
      const targetPath = path.join(this.tmpdir, fileName);
      await fs.emptyDir(this.tmpdir);
      await fs.writeFile(targetPath, data);

      return targetPath;
    } catch (error) {
      console.error(`Cachetool getData()`, error);

      return undefined;
    }
  }

  public getFilename(key: string): string {
    return `${path.basename(key)}.${path.extname(key)}`;
  }
}

