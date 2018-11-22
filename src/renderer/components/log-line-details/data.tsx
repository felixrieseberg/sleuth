import React from 'react';
import { JSONView } from '../json-view';
import { sleuthState } from '../../state/sleuth';

const debug = require('debug')('sleuth:data');

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
    return (
      <div className='LogLineData'>
        <JSONView raw={raw} state={sleuthState} />
      </div>
    );
  }

  /**
   * Renders a ASCII table as a pretty table
   *
   * @param {string} raw
   * @returns {JSX.Element}
   */
  public renderTable(raw: string): JSX.Element {
    const headerRgx = /^(\+|\|)-[+-]*-\+\s*$/;
    const contentRgx = /^\|.*\|$/;
    let data = null;

    try {
      const splitRaw = raw.split(/\r?\n/).filter((l) => {
        return l && l !== '' && !headerRgx.test(l);
      });

      // Ensure at least 3 lines
      if (!splitRaw || splitRaw.length < 3) {
        throw new Error('Split lines, but less than 3 - no way this is a table');
      }

      // Ensure beginning and end are as expected
      if (!contentRgx.test(splitRaw[0]) || !contentRgx.test(splitRaw[splitRaw.length - 1])) {
        throw new Error('Split lines, but beginning and end not recognized');
      }

      // Let's make a table
      const tableRows = splitRaw.map((line, i) => {
        const columns = line.split('|').map((v) => (v || '').trim());
        const elements = columns.map((c) => i === 0 ? <th>{c}</th> : <td>{c}</td>);
        return (<tr key={`${i}-${line}`}>{elements}</tr>);
      });

      return (<table className='ConvertedTable'>{tableRows}</table>);
    } catch (e) {
      debug(`Tried to render table, but failed`, e);
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
    } else if (raw && raw.startsWith(`+----`) && raw.endsWith('----+\n')) {
      return this.renderTable(raw);
    } else {
      return this.renderJSON(raw);
    }
  }
}
