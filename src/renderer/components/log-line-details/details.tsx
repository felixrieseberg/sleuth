import { observer } from 'mobx-react';
import { sleuthState, SleuthState } from '../../state/sleuth';
import React from 'react';
import classNames from 'classnames';
import { format } from 'date-fns';
import { Card, Button, ButtonGroup, Tag, Elevation } from '@blueprintjs/core';

import { LogEntry } from '../../interfaces';
import { LogLineData } from './data';
import { LogLineComments } from './comments';

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
      const { remote } = require('electron');

      if (defaultEditor) {
        const { exec } = require('child_process');
        const cmd = defaultEditor
          .replace('{filepath}', `"${sourceFile}"`)
          .replace('{line}', line.toString(10));

        debug(`Executing ${cmd}`);
        exec(cmd, (error: Error) => {
          if (!error) return;
          debug(`Tried to open source file, but failed`, error);
          remote.shell.showItemInFolder(sourceFile);
        });
      } else {
        remote.shell.showItemInFolder(sourceFile);
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
    const { level, logType, message, timestamp } = logEntry;
    const type = `${logType.charAt(0).toUpperCase() + logType.slice(1)} Process`;
    const datetime = logEntry.momentValue
      ? format(logEntry.momentValue, 'dddd, MMMM Do YYYY, h:mm:ss a')
      : timestamp;

    return (
      <div className='Details-LogEntry'>
        <div className='MetaInfo'>
          <div className='Details-Moment'>
            <Tag large={true} icon='calendar'>{datetime}</Tag>
          </div>
          <div className='Details-LogType'>
            <Tag large={true} icon='box'>{level}</Tag>
            <Tag large={true} icon='applications'>{type}</Tag>
            <ButtonGroup>
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
        <LogLineData raw={selectedEntry ? selectedEntry.meta : ''} />
        <LogLineComments state={sleuthState} />
      </div>
    );
  }
}
