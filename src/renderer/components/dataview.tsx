import * as React from 'react';
import * as classNames from 'classnames';
import * as dirtyJSON from 'jsonic';
import JSONTree from 'react-json-tree';
import * as moment from 'moment';

import { LogEntry } from '../interfaces';

export interface DataViewProps {
  isVisible: boolean;
  entry?: LogEntry;
  height?: number;
  toggle: Function;
  logEntry?: LogEntry;
}

export interface DataViewState {

}

export class DataView extends React.Component<DataViewProps, DataViewState> {
  constructor(props: DataViewProps) {
    super(props);

    this.onDoubleClick = this.onDoubleClick.bind(this);
  }

  /**
   * Toggle the whole data view.
   */
  public onDoubleClick() {
    this.props.toggle();
  }

  /**
   * Takes a meta string (probably dirty JSON) and attempts to pretty-print it.
   *
   * @param {string} meta
   * @returns {(JSX.Element | null)}
   */
  public renderMeta(meta: string): JSX.Element | null {
    if (!meta) {
      return null;
    }

    try {
      const data = dirtyJSON(meta);

      if (data) {
        return <JSONTree data={data} theme={this.getTheme()} />;
      } else {
        return <code>{meta}</code>;
      }
    } catch (e) {
      return <code>{meta}</code>;
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
    const datetime = logEntry.moment ? moment(logEntry.moment).format("dddd, MMMM Do YYYY, h:mm:ss a") : timestamp;

    return (
      <div className='DataView-LogEntry'>
        <div className='DataView-MetaInfo'>
          <div className='DataView-Moment'>{datetime}</div>
          <div className='DataView-LogType'>
            	<i className="ts_icon ts_icon_volume_medium"></i>{level}
              <i className="ts_icon ts_icon_volume_medium"></i>{type}
          </div>
        </div>
        <div className='DataView-Message'>{message}</div>
      </div>
    )
  }

  public render(): JSX.Element | null {
    const { entry, isVisible, height, logEntry } = this.props;
    const style = { height: `${height || 300}px` };
    const meta = entry ? entry.meta : '';
    const className = classNames('DataView', { IsVisible: isVisible });
    const logEntryInfo = logEntry ? this.renderLogEntry(logEntry) : null;
    const prettyMeta = this.renderMeta(meta);

    return (
      <div className={className} style={style} onDoubleClick={this.onDoubleClick}>
        {logEntryInfo}
        {prettyMeta}
      </div>
    );
  }

  /**
   * A super-cool Base16 theme using Slack's 2016 colors.
   *
   * @returns {Object}
   */
  public getTheme() {
    return {
      base00: '#2C2D30',
      base01: '#555459',
      base02: '#8B898F',
      base03: '#88919B',
      base04: '#9e9ea6',
      base05: '#FBFBFA',
      base06: '#F9F9F9',
      base07: '#ffffff',
      base08: '#e32072',
      base09: '#F96A38',
      base0A: '#FFA940',
      base0B: '#257337',
      base0C: '#3971ED',
      base0D: '#3971ED',
      base0E: '#71105F',
      base0F: '#4d6dc3'
    };
  }
}
