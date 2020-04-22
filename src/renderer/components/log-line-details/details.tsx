import { observer } from 'mobx-react';
import { SleuthState } from '../../state/sleuth';
import React from 'react';
import classNames from 'classnames';
import { Card, Button, ButtonGroup, Tag, Elevation } from '@blueprintjs/core';
import { uniq, capitalize } from 'lodash';

import { LogEntry } from '../../interfaces';
import { LogLineData } from './data';
import { LogLineComments } from './comments';
import { Timestamp } from './timestamp';
import { shell } from 'electron';
import { getIsBookmark, toggleBookmark } from '../../state/bookmarks';

const debug = require('debug')('sleuth:details');

export interface LogLineDetailsProps {
  state: SleuthState;
}

export interface LogLineDetailsState {}

@observer
export class LogLineDetails extends React.Component<LogLineDetailsProps, LogLineDetailsState> {
  constructor(props: LogLineDetailsProps) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.openSource = this.openSource.bind(this);
    this.renderLogEntry = this.renderLogEntry.bind(this);

    if (process.platform !== 'win32') {
      process.env.PATH = process.env.PATH + ':/usr/local/bin';
    }
  }

  /**
   * Toggle the whole data view.
   */
  public toggle() {
    this.props.state.isDetailsVisible = !this.props.state.isDetailsVisible;
  }

  /**
   * Opens the file in the default editor (or tries, at least)
   */
  public openSource() {
    const { selectedEntry, defaultEditor } = this.props.state;

    if (selectedEntry && selectedEntry.sourceFile) {
      const { sourceFile, line } = selectedEntry;

      if (defaultEditor) {
        const { exec } = require('child_process');
        const cmd = defaultEditor
          .replace('{filepath}', `"${sourceFile}"`)
          .replace('{line}', line.toString(10));

        debug(`Executing ${cmd}`);
        exec(cmd, (error: Error) => {
          if (!error) return;
          debug(`Tried to open source file, but failed`, error);
          shell.showItemInFolder(sourceFile);
        });
      } else {
        shell.showItemInFolder(sourceFile);
      }
    }
  }

  public render(): JSX.Element | null {
    const { isDetailsVisible } = this.props.state;

    if (!isDetailsVisible) return null;

    const className = classNames('Details', { IsVisible: isDetailsVisible });

    return (
      <div className={className}>
        {this.renderLogEntry()}
        {this.renderLogLineData()}
        <LogLineComments state={this.props.state} />
      </div>
    );
  }

  /**
   * Renders a single log entry, ensuring that people can scroll around and still now what log entry they're looking at.
   *
   * @returns {(JSX.Element | null)}
   */
  private renderLogEntry(): JSX.Element | null {
    const { selectedEntry } = this.props.state;
    if (!selectedEntry) return null;

    return (
      <div className='Details-LogEntry'>
        <div className='MetaInfo'>
          <div className='Details-Moment'>
            <Timestamp
              timestamps={this.getProperties('timestamp')}
              momentValues={this.getProperties('momentValue')}
            />
          </div>
          <div className='Details-LogType'>
            {this.renderLevel()}
            {this.renderType()}
            <ButtonGroup>
              <Button icon='star' active={getIsBookmark(this.props.state)} onClick={() => toggleBookmark(this.props.state)} />
              <Button icon='document-open' onClick={this.openSource} text='Open Source' />
              <Button icon='cross' onClick={this.toggle} text='Close' />
            </ButtonGroup>
          </div>
        </div>
        {this.renderMessage()}
      </div>
    );
  }

  private renderLogLineData(): JSX.Element | null {
    const { selectedEntry, selectedRangeEntries } = this.props.state;
    if (!selectedEntry) return null;

    // Don't show data for multiple entries
    if (selectedRangeEntries && selectedRangeEntries.length > 1) {
      return null;
    }

    return (
      <LogLineData state={this.props.state} raw={selectedEntry?.meta || ''} />
    );
  }

  private renderMessage(): JSX.Element {
    const message = this.getProperties('message').join('\n');

    return (
      <Card className='Message Monospace' elevation={Elevation.THREE}>{message}</Card>
    );
  }

  private renderLevel(): JSX.Element {
    const levels = uniq(this.getProperties('level')).join(', ');

    return (
      <Tag large={true} icon='box'>{levels}</Tag>
    );
  }

  private renderType(): JSX.Element {
    const logTypes = uniq(this.getProperties('logType')).map(capitalize);
    const type = `${logTypes.join(', ')} Process${logTypes.length > 1 ? 'es' : ''}`;

    return (
      <Tag large={true} icon='applications'>{type}</Tag>
    );
  }

  /**
   * Get an array of all the details for the currently selected entries.
   *
   * @param {keyof LogEntry} key
   * @memberof LogLineDetails
   */
  private getProperties<T>(key: keyof LogEntry): Array<T> {
    const { selectedEntry, selectedRangeEntries } = this.props.state;

    if (selectedRangeEntries && selectedRangeEntries.length > 0) {
      return selectedRangeEntries.map((v) => v[key]);
    } else  if (selectedEntry) {
      return [ selectedEntry[key] ];
    }

    return [];
  }
}
