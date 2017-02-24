import * as React from 'react';
import * as classNames from 'classnames';
import * as dirtyJSON from 'jsonic';
import JSONTree from 'react-json-tree';

import { LogEntry } from '../processor';

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

  public onDoubleClick() {
    this.props.toggle();
  }

  public getPrettyMeta(meta: string): JSX.Element | string {
    if (!meta) {
      return '';
    }

    try {
      console.log(meta);
      const data = dirtyJSON(meta);

      if (data) {
        return <JSONTree data={data} theme={this.getTheme()} />;
      } else {
        return meta;
      }
    } catch (e) {
      return meta;
    }
  }

  public render() {
    const { entry, isVisible, height, logEntry } = this.props;
    const style = { height: `${height || 300}px` };
    const meta = entry ? entry.meta : '';
    const className = classNames('DataView', { IsVisible: isVisible });
    let prettyMeta = this.getPrettyMeta(meta);

    return (
      <div className={className} style={style} onDoubleClick={this.onDoubleClick}>
        <div>
          <JSONTree data={logEntry || {}} theme={this.getTheme()} />
        </div>
        {prettyMeta}
      </div>
    );
  }

  /**
   * A super-cool Base16 theme using Slack's 2016 colors.
   *
   * @returns {Object}
   */
  private getTheme() {
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
