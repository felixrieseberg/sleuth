import * as React from 'react';
import * as dirtyJSON from 'jsonic';
import JSONTree from 'react-json-tree';

export interface LogLineDataProps {
  raw: string;
}

export interface LogLineDataState { }

export class LogLineData extends React.PureComponent<LogLineDataProps, LogLineDataState> {
  constructor(props: LogLineDataProps) {
    super(props);
  }

  /**
   * Renders pretty JSON
   *
   * @param {string} raw
   * @returns {JSX.Element}
   */
  public renderJSON(raw: string): JSX.Element {
    let data = null;

    try {
      const parsedJSON = dirtyJSON(raw);

      // tslint:disable-next-line:prefer-conditional-expression
      if (parsedJSON) {
        data = <JSONTree data={parsedJSON} theme={this.getTheme()} />;
      } else {
        data = <code>{raw}</code>;
      }
    } catch (e) {
      data = <code>{raw}</code>;
    }

    return (<div className='LogLineData'>{data}</div>);
  }

  /**
   * Takes a string table line and tries to return columns
   *
   * @param {string} line
   * @returns {Array<string>}
   */
  public splitTableLine(line: string): Array<string> {
    return line.split('│').map((column) => {
      const nameMatch = column.match(/^(║| ){1}(.*)( |║){1}$/);

      if (nameMatch && nameMatch.length === 4) {
        return nameMatch[2].trim();
      } else {
        return column;
      }
    });
  }

  /**
   * Renders a ASCII table as a pretty table
   *
   * @param {string} raw
   * @returns {JSX.Element}
   */
  public renderTable(raw: string): JSX.Element {
    let data = null;

    try {
      const splitRaw = raw.split(/\r?\n/).filter((l) => {
        return l && l !== '' && !l.includes('┼');
      });

      // Ensure at least 3 lines
      if (!splitRaw || splitRaw.length < 3) {
        throw new Error('Split lines, but less than 3 - no way this is a table');
      }

      // Ensure beginning and end are as expected
      if (!/^╔(═|╤)*╗$/.test(splitRaw[0]) || !/^╚(═|╧)*╝$/.test(splitRaw[splitRaw.length - 1])) {
        throw new Error('Split lines, but beginning and end not recognized');
      }

      // Let's make a table
      const tableRows = [];

      for (let i = 1; i < splitRaw.length - 2; i++) {
        const line = splitRaw[i];
        const columns = this.splitTableLine(line);
        const elements = columns.map((c) => {
          return i === 1 ? <th>{c}</th> : <td>{c}</td>;
        });

        tableRows.push((<tr>{elements}</tr>));
      }

      return (<table className='ConvertedTable'>{tableRows}</table>);
    } catch (e) {
      data = <code>{raw}</code>;
    }

    return (<div className='LogLineData'>{data}</div>);
  }

  /**
   * Takes a meta string (probably dirty JSON) and attempts to pretty-print it.
   *
   * @returns {(JSX.Element | null)}
   */
  public render(): JSX.Element | null {
    const { raw } = this.props;

    if (!raw) {
      return null;
    } else if (raw && raw.startsWith(`╔══`) && raw.endsWith('═══╝\n')) {
      return this.renderTable(raw);
    } else {
      return this.renderJSON(raw);
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