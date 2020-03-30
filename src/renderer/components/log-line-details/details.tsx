import { observer } from 'mobx-react';
import { SleuthState } from '../../state/sleuth';
import React from 'react';
import classNames from 'classnames';
import { Card, Button, ButtonGroup, Tag, Elevation } from '@blueprintjs/core';

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

  /**
   * Renders a single log entry, ensuring that people can scroll around and still now what log entry they're looking at.
   *
   * @param {LogEntry} logEntry
   * @returns {(JSX.Element | null)}
   */
  public renderLogEntry(logEntry: LogEntry): JSX.Element | null {
    const { level, logType, message, timestamp, momentValue } = logEntry;
    const type = `${logType.charAt(0).toUpperCase() + logType.slice(1)} Process`;

    return (
      <div className='Details-LogEntry'>
        <div className='MetaInfo'>
          <div className='Details-Moment'>
            <Timestamp timestamp={timestamp} momentValue={momentValue} />
          </div>
          <div className='Details-LogType'>
            <Tag large={true} icon='box'>{level}</Tag>
            <Tag large={true} icon='applications'>{type}</Tag>
            <ButtonGroup>
              <Button icon='star' active={getIsBookmark(this.props.state)} onClick={() => toggleBookmark(this.props.state)} />
              <Button icon='document-open' onClick={this.openSource} text='Open Source' />
              <Button icon='cross' onClick={this.toggle} text='Close' />
            </ButtonGroup>
          </div>
        </div>
        <Card className='Message Monospace' elevation={Elevation.THREE}>{message}</Card>
      </div>
    );
  }

  public render(): JSX.Element | null {
    const { selectedEntry } = this.props.state;
    const { isDetailsVisible } = this.props.state;

    if (!isDetailsVisible) return null;

    const className = classNames('Details', { IsVisible: isDetailsVisible });
    const logEntryInfo = selectedEntry ? this.renderLogEntry(selectedEntry) : null;

    return (
      <div className={className}>
        {logEntryInfo}
        <LogLineData state={this.props.state} raw={selectedEntry ? selectedEntry.meta : ''} />
        <LogLineComments state={this.props.state} />
      </div>
    );
  }
}
