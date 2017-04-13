import * as React from 'react';
import * as dirtyJSON from 'jsonic';
import JSONTree from 'react-json-tree';

export interface LogLineMetaProps {
  raw: string;
}

export class LogLineMeta extends React.Component<LogLineMetaProps, undefined> {
  constructor(props: LogLineMetaProps) {
    super(props);
  }

  /**
   * Takes a meta string (probably dirty JSON) and attempts to pretty-print it.
   *
   * @returns {(JSX.Element | null)}
   */
  public render(): JSX.Element | null {
    const { raw } = this.props;

    if (!raw) return null;

    try {
      const data = dirtyJSON(raw);

      if (data) {
        return <JSONTree data={data} theme={this.getTheme()} />;
      } else {
        return <code>{raw}</code>;
      }
    } catch (e) {
      return <code>{raw}</code>;
    }
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