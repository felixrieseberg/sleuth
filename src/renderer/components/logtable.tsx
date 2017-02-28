import * as React from 'react';
import * as classNames from 'classnames';
import { Table, Column, Cell } from 'fixed-data-table';
import { AutoSizer } from 'react-virtualized';

import { LevelFilter, LogEntry, MergedLogFile, ProcessedLogFile } from '../interfaces';
import { didFilterChange } from '../../utils/did-filter-change';
import { DataView } from './dataview';
import { Alert } from './alert';
import { LogTableHeaderCell } from './logtable-headercell';

export const SORT_TYPES = {
  ASC: 'ASC',
  DESC: 'DESC',
};

export interface RowClickEvent {
  index: number;
  rowData: any;
}

export interface LogTableProps {
  logFile: ProcessedLogFile | MergedLogFile;
  filter: LevelFilter;
  search?: string;
}

export interface LogTableState {
  isDataViewVisible: boolean;
  sortedList: Array<LogEntry>;
  selectedEntry?: LogEntry;
  sortBy?: string;
  sortDirection?: string;
}

export class LogTable extends React.Component<LogTableProps, Partial<LogTableState>> {
  private tableElement: Table;
  private readonly refHandlers = {
    table: (ref: Table) => this.tableElement = ref,
  };

  constructor(props: LogTableProps) {
    super(props);

    this.state = {
      isDataViewVisible: false,
      sortedList: [],
      sortBy: 'index',
      sortDirection: 'ASC',
    };

    this.onRowClick = this.onRowClick.bind(this);
    this.renderTable = this.renderTable.bind(this);
    this.messageCellRenderer = this.messageCellRenderer.bind(this);
    this.timestampCellRenderer = this.timestampCellRenderer.bind(this);
    this.toggleDataView = this.toggleDataView.bind(this);
    this.sortFilterList = this.sortFilterList.bind(this);
    this.onSortChange = this.onSortChange.bind(this);
  }

  /**
   * Attempts at being smart about updates
   *
   * @param {LogTableProps} nextProps
   * @param {LogTableState} nextState
   * @returns {boolean}
   */
  public shouldComponentUpdate(nextProps: LogTableProps, nextState: LogTableState): boolean {
    const { filter, logFile } = this.props;
    const { selectedEntry, sortBy, sortDirection, isDataViewVisible, sortedList } = this.state;
    const nextFile = nextProps.logFile;

    const newSort = (nextState.sortBy !== sortBy || nextState.sortDirection !== sortDirection);

    // Sort direction changed
    if (newSort) return true;

    // File changed - and update is in order
    const newFile = ((!nextFile && logFile) || nextFile.logType !== logFile.logType);
    const newEntries = (nextFile && logFile && nextFile.logEntries.length !== logFile.logEntries.length);
    const newResults = ((!sortedList && nextState.sortedList) || sortedList && nextState.sortedList.length !== sortedList.length);
    if (newFile || newEntries || newResults) return true;

    // The data view is open and the selected entry changed
    if (nextState.isDataViewVisible !== isDataViewVisible)  return true;

    // Filter changed
    if (didFilterChange(filter, nextProps.filter)) return true;

    // The selected entry changed _and_ we have the data view open
    if (nextState.isDataViewVisible && nextState.selectedEntry
        && selectedEntry && nextState.selectedEntry.momentValue !== selectedEntry!.momentValue) {
      return true;
    }

    return false;
  }

  public componentWillReceiveProps(nextProps: LogTableProps): void {
    const { filter, search, logFile } = this.props;
    const filterChanged = didFilterChange(filter, nextProps.filter);
    const searchChanged = search !== nextProps.search;
    const fileChanged = ((!logFile && nextProps.logFile) || logFile && logFile.logEntries.length !== nextProps.logFile.logEntries.length || logFile.logType !== nextProps.logFile.logType);

    // Filter or search changed
    if (filterChanged || searchChanged || fileChanged) {
      this.setState({ sortedList: this.sortFilterList(undefined, undefined, nextProps.filter, nextProps.search, nextProps.logFile) });
    }
  }

  public componentDidMount() {
    this.setState({ sortedList: this.sortFilterList() });
  }

  /**
   * Handles a single click onto a row
   *
   * @param {RowClickEvent} { index }
   */
  public onRowClick(_e: Event, index: number) {
    // Todo: This is incorrect!
    const selectedEntry = this.props.logFile.logEntries[index] || null;
    const isDataViewVisible = !!selectedEntry.meta;
    this.setState({ selectedEntry, isDataViewVisible });
  }

  /**
   * Toggles the data view
   */
  public toggleDataView() {
    this.setState({ isDataViewVisible: !this.state.isDataViewVisible });
  }

  /**
   * Handles the change of sorting direction. This method is passed to the LogTableHeaderCell
   * components, who call it once the user changes sorting.
   *
   * @param {string} sortBy
   * @param {string} sortDirection
   */
  public onSortChange(sortBy: string, sortDirection: string) {
    const currentState = this.state;
    const newSort = (currentState.sortBy !== sortBy || currentState.sortDirection !== sortDirection);

    if (newSort) {
      this.setState({ sortBy, sortDirection, sortedList: this.sortFilterList(sortBy, sortDirection) });
    }
  }

  /**
   * Checks whether or not the table should filter
   *
   * @returns {boolean}
   */
  public shouldFilter(filter?: LevelFilter): boolean {
    filter = filter || this.props.filter;

    if (!filter) return false;
    const allEnabled = Object.keys(filter).every((k) => filter![k]);
    const allDisabled = Object.keys(filter).every((k) => !filter![k]);

    return !(allEnabled || allDisabled);
  }

  /**
   * Sorts the list
   */
  public sortFilterList(sortBy?: string, sortDirection?: string, filter?: LevelFilter, search?: string, logFile?: ProcessedLogFile | MergedLogFile): Array<LogEntry> {
    logFile = logFile || this.props.logFile;
    filter = filter || this.props.filter;
    search = search !== undefined ? search : this.props.search;
    sortBy = sortBy || this.state.sortBy;
    sortDirection = sortDirection || this.state.sortDirection;

    const shouldFilter = this.shouldFilter(filter);
    const searchRegex = new RegExp(search || '', 'i');
    const noSort = (!sortBy || sortBy === 'index') && (!sortDirection || sortDirection === SORT_TYPES.ASC);

    // Check if we can bail early and just use the naked logEntries array
    if (noSort && !shouldFilter && !search) return logFile.logEntries;

    let sortedList = logFile.logEntries!.concat();

    // Named definition here allows V8 to go craaaaaazy, speed-wise.
    function doSortByMessage(a: LogEntry, b: LogEntry) { return a.message.localeCompare(b.message); };
    function doSortByLevel(a: LogEntry, b: LogEntry) { return a.level.localeCompare(b.level); };
    function doFilter(a: LogEntry) { return (a.level && filter![a.level]); };
    function doSearch(a: LogEntry) { return (!search || searchRegex.test(a.message)); };

    // Filter
    if (shouldFilter) {
      sortedList = sortedList.filter(doFilter);
    }

    // Search
    if (search) {
      sortedList = sortedList.filter(doSearch);
    }

    // Sort
    if (sortBy === 'index' || sortBy === 'timestamp') {
      console.log(`Sorting by ${sortBy} (aka doing nothing)`);
    } else if (sortBy === 'message') {
      console.log('Sorting by message');
      sortedList = sortedList.sort(doSortByMessage);
    } else if (sortBy === 'level') {
      console.log('Sorting by level');
      sortedList = sortedList.sort(doSortByLevel);
    }

    if (sortDirection === SORT_TYPES.DESC) {
      console.log('Reversing');
      sortedList.reverse();
    }

    return sortedList;
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

  /**
   * Renders the "message" cell
   *
   * @param {any} { cellData, columnData, dataKey, rowData, rowIndex }
   * @returns {(JSX.Element | string)}
   */
  public messageCellRenderer(entry: LogEntry): JSX.Element | string {
    if (entry && entry.meta) {
      return (<span><i className='ts_icon ts_icon_all_files_alt HasData'/> {entry.message}</span>);
    } else if (entry && entry.repeated) {
      return `(Repeated ${entry.repeated.length} times) ${entry.message}`;
    } else {
      return entry.message;
    }
  }

  /**
   * Renders a cell, prefixing the log entries type.
   *
   * @param {any} { cellData, columnData, dataKey, rowData, rowIndex }
   * @returns {JSX.Element}
   */
  public timestampCellRenderer(entry: LogEntry): JSX.Element | String {
    // Todo: This could be cool, but it's expensive af
    // const timestamp = entry.moment ? entry.moment.format('HH:mm:ss (DD/MM)') : entry.timestamp;
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

    return (<span title={entry.timestamp}>{prefix}{entry.timestamp}</span>);
  }

  /**
   * Renders the table
   *
   * @param {*} options
   * @param {Array<LogEntry>} sortedList
   * @returns {JSX.Element}
   */
  public renderTable(options: any): JSX.Element {
    const { sortedList, sortDirection, sortBy } = this.state;
    const self = this;
    const timestampHeaderOptions = { sortKey: 'timestamp', onSortChange: this.onSortChange, sortDirection, sortBy };
    const timestampHeader = <LogTableHeaderCell {...timestampHeaderOptions}>Timestamp</LogTableHeaderCell>;
    const indexHeaderOptions = { sortKey: 'index', onSortChange: this.onSortChange, sortDirection, sortBy };
    const indexHeader = <LogTableHeaderCell {...indexHeaderOptions}>#</LogTableHeaderCell>;
    const levelHeaderOptions = { sortKey: 'level', onSortChange: this.onSortChange, sortDirection, sortBy };
    const levelHeader = <LogTableHeaderCell {...levelHeaderOptions}>Level</LogTableHeaderCell>;
    const messageHeaderOptions = { sortKey: 'message', onSortChange: this.onSortChange, sortDirection, sortBy };
    const messageHeader = <LogTableHeaderCell {...messageHeaderOptions}>Message</LogTableHeaderCell>;

    const tableOptions = {
      ...options,
      rowHeight: 30,
      rowsCount: sortedList!.length,
      onRowClick: this.onRowClick,
      ref: this.refHandlers.table,
      headerHeight: 30
    };

    function renderIndex(props: any) {
      return <Cell {...props}>{sortedList![props.rowIndex].index}</Cell>;
    }
    function renderTimestamp(props: any) {
      return <Cell {...props}>{self.timestampCellRenderer(sortedList![props.rowIndex])}</Cell>;
    }
    function renderMessageCell(props: any) {
      return <Cell {...props}>{self.messageCellRenderer(sortedList![props.rowIndex])}</Cell>;
    }
    function renderLevel(props: any) {
      return <Cell {...props}>{sortedList![props.rowIndex].level}</Cell>;
    }

    return (
      <Table {...tableOptions}>
        <Column header={indexHeader} cell={renderIndex} width={100}  />
        <Column header={timestampHeader} cell={renderTimestamp} width={220}  />
        <Column header={levelHeader} cell={renderLevel} width={70}  />
        <Column header={messageHeader} flexGrow={1} cell={renderMessageCell} width={300} />
      </Table>);
  }

  public render(): JSX.Element {
    const { logFile } = this.props;
    const { isDataViewVisible, selectedEntry } = this.state;
    const typeClassName = logFile.type === 'MergedLogFile' ? 'Merged' : 'Single';
    const className = classNames('LogTable', typeClassName, { Collapsed: isDataViewVisible });
    const warning = this.renderWebAppWarning();

    return (
      <div>
        <div className={className}>
          {warning}
          <div className={classNames('Sizer', { HasWarning: !!warning })}>
            <AutoSizer>{(options: any) => this.renderTable(options)}</AutoSizer>
          </div>
        </div>
        <DataView isVisible={isDataViewVisible!} entry={selectedEntry} toggle={this.toggleDataView} logEntry={selectedEntry} />
      </div>
    );
  }
}
