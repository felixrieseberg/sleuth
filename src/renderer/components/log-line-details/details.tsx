import { observer } from 'mobx-react';
import { sleuthState, SleuthState } from '../../state/sleuth';
import * as React from 'react';
import * as classNames from 'classnames';
import * as moment from 'moment';

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
    const datetime = logEntry.momentValue ? moment(logEntry.momentValue).format('dddd, MMMM Do YYYY, h:mm:ss a') : timestamp;

    return (
      <div className='Details-LogEntry'>
        <div className='MetaInfo'>
          <div className='Details-Moment'>{datetime}</div>
          <div className='Details-LogType'>
              Level <span className='level'>{level}</span> Type <span className='type'>{type}</span>
              <span> <a className='source' onClick={this.openSource}>Open Source</a></span>
              <span> <a className='close' onClick={this.toggle}>Close</a></span>
          </div>
        </div>
        <div className='Message'>{message}</div>
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
        <div className='Background'><div /></div>
      </div>
    );
  }
}
