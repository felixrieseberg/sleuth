import { sleuthState } from '../../state/sleuth';
import * as React from 'react';
import * as classNames from 'classnames';
import * as moment from 'moment';

import { LogEntry } from '../../interfaces';
import { LogLineMeta } from "./meta";
import { LogLineComments } from "./comments";

export interface LogLineDetailsProps {
  isVisible: boolean;
  entry?: LogEntry;
  height?: number;
  toggle: Function;
  logEntry?: LogEntry;
}

export class LogLineDetails extends React.Component<LogLineDetailsProps, undefined> {
  constructor(props: LogLineDetailsProps) {
    super(props);

    this.toggle = this.toggle.bind(this);
  }

  /**
   * Toggle the whole data view.
   */
  public toggle() {
    this.props.toggle();
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
              <span> <a className='close' onClick={this.toggle}>Close</a></span>
          </div>
        </div>
        <div className='Message'>{message}</div>
      </div>
    )
  }

  public render(): JSX.Element {
    const { entry, isVisible, height, logEntry } = this.props;
    const style = { height: `${height || 300}px` };
    const className = classNames('Details', { IsVisible: isVisible });
    const logEntryInfo = logEntry ? this.renderLogEntry(logEntry) : null;

    return (
      <div className={className} style={style} onDoubleClick={this.toggle}>
        {logEntryInfo}
        <LogLineMeta raw={entry ? entry.meta : ''} />
        <LogLineComments state={sleuthState} line={logEntry ? logEntry.message : undefined} />
      </div>
    );
  }
}
