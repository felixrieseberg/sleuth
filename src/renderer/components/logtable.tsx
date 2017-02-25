import * as React from 'react';
import * as classNames from 'classnames';

import { LevelFilter, LogEntry, MergedLogFile, ProcessedLogFile } from '../interfaces';
import { DataView } from './dataview';
import { Alert } from './alert';
import { Column, Table, AutoSizer, SortIndicator } from 'react-virtualized';

export interface RowClickEvent {
  index: number;
  rowData: any;
}

export interface LogTableProps {
  logFile: ProcessedLogFile | MergedLogFile;
  filter: LevelFilter;
}

export interface LogTableState {
  selectedEntry?: LogEntry;
  isDataViewVisible: boolean;
  sortBy: string;
  sortDirection: string;
}

export class LogTable extends React.Component<LogTableProps, LogTableState> {
  private tableElement: Table;

  constructor(props: LogTableProps) {
    super(props);

    this.state = { isDataViewVisible: false, sortBy: 'index', sortDirection: 'ASC' };

    this.onRowClick = this.onRowClick.bind(this);
    this.messageCellRenderer = this.messageCellRenderer.bind(this);
    this.timestampCellRenderer = this.timestampCellRenderer.bind(this);
    this.toggleDataView = this.toggleDataView.bind(this);
    this.headerRenderer = this.headerRenderer.bind(this);
    this.sort = this.sort.bind(this);
  }

  private readonly refHandlers = {
    table: (ref: Table) => this.tableElement = ref,
  };

  /**
   * Handles a single click onto a row
   *
   * @param {RowClickEvent} { index }
   */
  public onRowClick({ index }: RowClickEvent) {
    const selectedEntry = this.props.logFile.logEntries[index] || null;
    const isDataViewVisible = !!selectedEntry.meta;
    this.setState({ selectedEntry, isDataViewVisible });
  }

  /**
   * Renders the "message" cell
   *
   * @param {any} { cellData, columnData, dataKey, rowData, rowIndex }
   * @returns {(JSX.Element | string)}
   */
  public messageCellRenderer({ cellData, rowData }): JSX.Element | string {
    if (rowData.meta) {
      return (<span><i className='ts_icon ts_icon_all_files_alt HasData'/> {cellData}</span>);
    } else {
      return String(cellData);
    }
  }

  /**
   * Renders a cell, prefixing the log entries type.
   *
   * @param {any} { cellData, columnData, dataKey, rowData, rowIndex }
   * @returns {JSX.Element}
   */
  public timestampCellRenderer(data: any): JSX.Element | String {
    const entry = data.rowData as LogEntry;
    const timestamp = entry.moment ? entry.moment.format('HH:mm:ss (DD/MM)') : entry.timestamp;
    let prefix = <i className='Meta ts_icon ts_icon_question'/>;

    if (entry.logType === 'browser') {
      prefix = <i title='Browser Log' className='Meta Color-Browser ts_icon ts_icon_power_off'/>;
    } else if (entry.logType === 'renderer') {
      prefix = <i title='Renderer Log' className='Meta Color-Renderer ts_icon ts_icon_laptop'/>;
    } else if (entry.logType === 'webapp') {
      prefix = <i title='Webapp Log' className='Meta Color-Webapp ts_icon ts_icon_globe'/>;
    } else if (entry.logType === 'webview') {
      prefix = <i title='Webview Log' className='Meta Color-Webview ts_icon ts_icon_all_files_alt'/>;
    }

    return (<span title={entry.timestamp}>{prefix}{timestamp}</span>);
  }

  /**
   * Toggles the data view
   */
  public toggleDataView() {
    this.setState({ isDataViewVisible: !this.state.isDataViewVisible });
  }

  /**
   * Checks if we're looking at a web app log and returns a warning, so that users know
   * the app didn't all over
   *
   * @returns {(JSX.Element | null)}
   */
  public renderWebAppWarning(): JSX.Element | null {
    const { logFile } = this.props;

    const text = `The web app logs are difficult to parse for a computer - proceed with caution. Sorting is disabled.`;
    return logFile.logType === 'webapp' ? <Alert text={text} level='warning' /> : null;
  }

  public sort({ sortBy, sortDirection }) {
    this.setState({ sortBy, sortDirection });
  }

  public headerRenderer({ dataKey, disableSort, label, sortBy, sortDirection }) {
    return (
      <div>
        {label}
        {sortBy === dataKey && <SortIndicator sortDirection={sortDirection} />}
      </div>
    )
  }

  /**
   * Checks whether or not the table should filter
   *
   * @returns {boolean}
   */
  public shouldFilter(): boolean {
    const { filter } = this.props;

    if (!filter) {
      return false;
    }

    const allEnabled = Object.keys(filter).every((k) => filter[k]);
    const allDisabled = Object.keys(filter).every((k) => !filter[k]);

    return !(allEnabled || allDisabled);
  }

  public render(): JSX.Element {
    const { logFile, filter } = this.props;
    const { isDataViewVisible, selectedEntry, sortBy, sortDirection } = this.state;
    const { logEntries } = logFile;
    const typeClassName = logFile.type === 'MergedLogFile' ? 'Merged' : 'Single';
    const className = classNames('LogTable', typeClassName, { Collapsed: isDataViewVisible });
    const warning = this.renderWebAppWarning();
    const disableSort = !!(logFile.logType === 'webapp');
    let sortedList: Array<LogEntry> = [];

    // Named definition here allows V8 to go craaaaaazy, speed-wise.
    function doSortByIndex(a: LogEntry, b: LogEntry) { return a.index - b.index; };
    function doSortByTimestamp(a: LogEntry, b: LogEntry) { return a.momentValue - b.momentValue; };
    function doSortByMessage(a: LogEntry, b: LogEntry) { return a.message.localeCompare(b.message); };
    function doSortByLevel(a: LogEntry, b: LogEntry) { return a.level.localeCompare(b.level); };
    function doFilter(a: LogEntry) { return (a.level && filter[a.level]); };

    // Filter
    if (this.shouldFilter()) {
      sortedList = logEntries.filter(doFilter);
    } else {
      sortedList = logEntries;
    }

    // Sort
    if (sortBy === 'index') {
      console.log('Sorting by index');
      sortedList = sortedList.sort(doSortByIndex);
    } else if (sortBy === 'timestamp') {
      console.log('Sorting by timestamp');
      sortedList = sortedList.sort(doSortByTimestamp);
    } else if (sortBy === 'message') {
      console.log('Sorting by message');
      sortedList = sortedList.sort(doSortByMessage);
    } else if (sortBy === 'level') {
      console.log('Sorting by level');
      sortedList = sortedList.sort(doSortByLevel);
    }

    if (sortDirection === 'DESC') {
      sortedList.reverse();
    }

    const tableOptions = {
      headerHeight: 20,
      rowHeight: 30,
      rowGetter: (r: any) => sortedList[r.index],
      rowCount: sortedList.length,
      onRowClick: (event: RowClickEvent) => this.onRowClick(event),
      ref: this.refHandlers.table,
      overscanRowCount: 500,
      sort: this.sort,
      sortBy: sortBy,
      sortDirection: sortDirection
    };
    const indexColumn = (logFile.type !== 'MergedLogFile') ? <Column label='#' dataKey='index' width={100} headerRenderer={this.headerRenderer} /> : null;

    return (
      <div>
        <div className={className}>
          {warning}
          <div className={classNames('Sizer', { HasWarning: !!warning })}>
            <AutoSizer>
              {({ width, height }) => (
                <Table {...tableOptions} height={height} width={width}>
                  {indexColumn}
                  <Column width={190} label='Timestamp' dataKey='timestamp' cellRenderer={this.timestampCellRenderer} disableSort={disableSort} />
                  <Column width={70} label='Level' dataKey='level' disableSort={disableSort} />
                  <Column width={200} label='Message' dataKey='message' flexGrow={1} cellRenderer={this.messageCellRenderer} disableSort={disableSort} />
                </Table>
              )}
            </AutoSizer>
          </div>
        </div>
        <DataView isVisible={isDataViewVisible} entry={selectedEntry} toggle={this.toggleDataView} logEntry={selectedEntry} />
      </div>
    );
  }
}
