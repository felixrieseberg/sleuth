import * as debounce from 'debounce';
import * as React from 'react';
import * as classNames from 'classnames';
import * as moment from 'moment';
import { Table, Column, Cell } from 'fixed-data-table-2';
import { AutoSizer } from 'react-virtualized';
import { default as keydown, Keys } from 'react-keydown';
import * as autoBind from 'react-autobind';

import { LevelFilter, LogEntry } from '../interfaces';
import { sleuthState } from '../state/sleuth';
import { didFilterChange } from '../../utils/did-filter-change';
import { Alert } from './alert';
import { LogTableHeaderCell } from './log-table-headercell';
import { isReduxAction } from '../../utils/is-redux-action';
import { LogTableProps, LogTableState, COLUMN_WIDTHS, SORT_DIRECTION, SortFilterListOptions, COLUMN_TITLES } from './log-table-constants';

const debug = require('debug')('sleuth:logtable');
const { DOWN } = Keys;

/**
 * Welcome! This is the biggest class in this application - it's the table that displays logging
 * information. This is also the class that could most easily destroy performance, so be careful
 * here!
 */

export class LogTable extends React.Component<LogTableProps, Partial<LogTableState>> {
  private tableElement: any;
  private readonly refHandlers = {
    table: (ref: any) => this.tableElement = ref,
  };
  private changeSelectedEntry: any = null;

  constructor(props: LogTableProps) {
    super(props);

    this.state = {
      sortedList: [],
      sortBy: 'index',
      sortDirection: SORT_DIRECTION.DESC,
      searchList: [],
      ignoreSearchIndex: false,
      columnWidths: COLUMN_WIDTHS,
      columnOrder: Object.keys(COLUMN_TITLES)
    };

    autoBind(this);
  }

  /**
   * Attempts at being smart about updates
   *
   * @param {LogTableProps} nextProps
   * @param {LogTableState} nextState
   * @returns {boolean}
   */
  public shouldComponentUpdate(nextProps: LogTableProps, nextState: LogTableState): boolean {
    const { dateTimeFormat, levelFilter, logFile, searchIndex } = this.props;
    const { sortBy, sortDirection, sortedList, searchList, selectedIndex, columnWidths, columnOrder } = this.state;

    // Selected row changed
    if (selectedIndex !== nextState.selectedIndex) return true;

    // DateTimeFormat changed
    if (dateTimeFormat !== nextProps.dateTimeFormat) return true;

    // Sort direction changed
    const newSort = (nextState.sortBy !== sortBy || nextState.sortDirection !== sortDirection);
    if (newSort) return true;

    // Column widths changed
    if (columnWidths !== nextState.columnWidths) return true;

    // Column order changed
    if (columnOrder !== nextState.columnOrder) return true;

    // File changed - and update is in order
    const nextFile = nextProps.logFile;
    const newFile = ((!nextFile && logFile)
      || nextFile && logFile && nextFile.logType !== logFile.logType);
    const newEntries = (nextFile && logFile
      && nextFile.logEntries.length !== logFile.logEntries.length);
    const newResults = ((!sortedList && nextState.sortedList)
      || sortedList && nextState.sortedList.length !== sortedList.length);
    if (newFile || newEntries || newResults) return true;

    // Filter changed
    if (didFilterChange(levelFilter, nextProps.levelFilter)) return true;

    // Search changed
    if (searchList !== nextState.searchList || searchIndex !== nextProps.searchIndex) return true;

    return false;
  }

  /**
   * React's componentWillReceiveProps
   *
   * @param {LogTableProps} nextProps
   */
  public componentWillReceiveProps(nextProps: LogTableProps): void {
    const { levelFilter, search, logFile, showOnlySearchResults, searchIndex } = this.props;
    const searchChanged = search !== nextProps.search || showOnlySearchResults !== nextProps.showOnlySearchResults;
    const nextFile = nextProps.logFile;
    const fileChanged = ((!logFile && nextFile)
      || logFile && nextFile && logFile.logEntries.length !== nextFile.logEntries.length
      || logFile && nextFile && logFile.logType !== nextFile.logType);

    // Filter or search changed
    const nextLevelFilter = nextProps.levelFilter;
    const filterChanged = didFilterChange(levelFilter, nextLevelFilter);
    const nextSearch = nextProps.search;

    if (filterChanged || searchChanged || fileChanged) {
      const sortOptions: SortFilterListOptions = {
        showOnlySearchResults: nextProps.showOnlySearchResults,
        filter: nextLevelFilter,
        search: nextSearch,
        logFile: nextFile
      };
      const sortedList = this.sortFilterList(sortOptions);
      let searchList: Array<number> = [];

      // Should we create a search list?
      if (!nextProps.showOnlySearchResults && nextSearch) {
        debug(`showOnlySearchResults is false, making search list`);
        searchList = this.doSearchIndex(nextSearch, sortedList);
      }

      this.setState({ sortedList, searchList });
    }

    if (searchIndex !== nextProps.searchIndex) {
      this.setState({ ignoreSearchIndex: false });
    }
  }

  /**
   * React's componentDidMount
   */
  public componentDidMount() {
    this.setState({ sortedList: this.sortFilterList() });
  }

  /**
   * Enables keyboard navigation of the table
   *
   * @param {React.KeyboardEvent<any>} { which }
   */
  @keydown('down', 'up')
  public onKeyboardNavigate({ which }: React.KeyboardEvent<any>) {
    this.changeSelection(which === DOWN ? 1 : -1);
  }

  /**
   * Handles a single click onto a row
   *
   * @param {RowClickEvent} { index }
   */
  public onRowClick(_e: any, index: number) {
    const selectedEntry = this.state.sortedList![index] || null;

    this.props.state.selectedEntry = selectedEntry;
    this.props.state.isDetailsVisible = true;
    this.setState({
      selectedIndex: index,
      ignoreSearchIndex: true,
      scrollToSelection: false
    });
  }

  /**
   * Handles the change of sorting direction. This method is passed to the LogTableHeaderCell
   * components, who call it once the user changes sorting.
   *
   * @param {string} sortBy
   * @param {string} sortDirection
   */
  public onSortChange(sortBy: string, sortDirection: SORT_DIRECTION) {
    const currentState = this.state;
    const newSort = (currentState.sortBy !== sortBy || currentState.sortDirection !== sortDirection);

    if (newSort) {
      this.setState({ sortBy, sortDirection, sortedList: this.sortFilterList({ sortBy, sortDirection }) });
    }
  }

  /**
   * Change the column order
   *
   * @param {string} columnKey
   */
  public onColumnChange(newColumnOrder: Array<string>): void {
    debug(`Updating column order: ${newColumnOrder.join(', ')}`);
    this.setState({ columnOrder: newColumnOrder });
  }

  /**
   * Changes the current selection in the table
   *
   * @param {number} change
   */
  public changeSelection(change: number) {
    const { selectedIndex } = this.state;

    if (selectedIndex || selectedIndex === 0) {
      const nextIndex = selectedIndex + change;
      const nextEntry = this.state.sortedList![nextIndex] || null;

      if (nextEntry) {
        // Schedule an app-state update. This ensures
        // that we don't update the selection at a high
        // frequency
        if (this.changeSelectedEntry) {
          this.changeSelectedEntry.clear();
        }
        this.changeSelectedEntry = debounce(() => {
          this.props.state.selectedEntry = nextEntry;
        }, 500);
        this.changeSelectedEntry();

        this.setState({
          selectedIndex: nextIndex,
          ignoreSearchIndex: false,
          scrollToSelection: true
        });
      }
    }
  }

  /**
   * Checks whether or not the table should filter
   *
   * @returns {boolean}
   */
  public shouldFilter(filter?: LevelFilter): boolean {
    filter = filter || this.props.levelFilter;

    if (!filter) return false;
    const allEnabled = Object.keys(filter).every((k) => filter![k]);
    const allDisabled = Object.keys(filter).every((k) => !filter![k]);

    return !(allEnabled || allDisabled);
  }

  /**
   * Performs a search operation
   *
   * @param {string} search
   * @param {Array<LogEntry>} list
   * @returns Array<LogEntry>
   */
  public doSearchFilter(search: string, list: Array<LogEntry>): Array<LogEntry> {
    let searchRegex = new RegExp(search || '', 'i');

    function doSearch(a: LogEntry) { return (!search || searchRegex.test(a.message)); }
    function doExclude(a: LogEntry) { return (!search || !searchRegex.test(a.message)); }
    const searchParams = search.split(' ');

    searchParams.forEach((param) => {
      if (param.startsWith('!') && param.length > 1) {
        debug(`Filter-Excluding ${param.slice(1)}`);
        searchRegex = new RegExp(param.slice(1) || '', 'i');
        list = list.filter(doExclude);
      } else {
        debug(`Filter-Searching for ${param}`);
        list = list.filter(doSearch);
      }
    });

    return list;
  }

  /**
   * Performs a search operation
   *
   * @param {string} search
   * @param {Array<LogEntry>} list
   * @returns Array<number>
   */
  public doSearchIndex(search: string, list: Array<LogEntry>): Array<number> {
    let searchRegex = new RegExp(search || '', 'i');
    const foundIndices: Array<number> = [];

    function doSearch(a: LogEntry, i: number) {
      if (!search || searchRegex.test(a.message)) foundIndices.push(i);
    }

    function doExclude(a: LogEntry, i: number) {
      if (!search || !searchRegex.test(a.message)) foundIndices.push(i);
    }

    const searchParams = search.split(' ');

    searchParams.forEach((param) => {
      if (param.startsWith('!') && param.length > 1) {
        debug(`Index-Excluding ${param.slice(1)}`);
        searchRegex = new RegExp(param.slice(1) || '', 'i');
        list.forEach(doExclude);
      } else {
        debug(`Index-Searching for ${param}`);
        list.forEach(doSearch);
      }
    });

    return foundIndices;
  }

  /**
   * Sorts the list
   */
  public sortFilterList(options: SortFilterListOptions = {}): Array<LogEntry> {
    const logFile = options.logFile || this.props.logFile;
    const filter = options.filter || this.props.levelFilter;
    const search = options.search !== undefined ? options.search : this.props.search;
    const sortBy = options.sortBy || this.state.sortBy;
    const showOnlySearchResults = options.showOnlySearchResults !== undefined ? options.showOnlySearchResults : this.props.showOnlySearchResults;
    const sortDirection = options.sortDirection || this.state.sortDirection;

    debug(`Starting filter`);
    if (!logFile) return [];

    const shouldFilter = this.shouldFilter(filter);
    const noSort = (!sortBy || sortBy === 'index') && (!sortDirection || sortDirection === SORT_DIRECTION.ASC);

    // Check if we can bail early and just use the naked logEntries array
    if (noSort && !shouldFilter && !search) return logFile.logEntries;

    let sortedList = logFile.logEntries!.concat();

    // Named definition here allows V8 to go craaaaaazy, speed-wise.
    function doSortByMessage(a: LogEntry, b: LogEntry) { return a.message.localeCompare(b.message); }
    function doSortByLevel(a: LogEntry, b: LogEntry) { return a.level.localeCompare(b.level); }
    function doSortByLine(a: LogEntry, b: LogEntry) { return a.line > b.line ? 1 : -1; }
    function doFilter(a: LogEntry) { return (a.level && filter![a.level]); }

    // Filter
    if (shouldFilter) {
      sortedList = sortedList.filter(doFilter);
    }

    // Search
    if (search && showOnlySearchResults) {
      sortedList = this.doSearchFilter(search, sortedList);
    }

    // Sort
    if (sortBy === 'index' || sortBy === 'timestamp') {
      debug(`Sorting by ${sortBy} (aka doing nothing)`);
    } else if (sortBy === 'message') {
      debug('Sorting by message');
      sortedList = sortedList.sort(doSortByMessage);
    } else if (sortBy === 'level') {
      debug('Sorting by level');
      sortedList = sortedList.sort(doSortByLevel);
    } else if (sortBy === 'line') {
      debug('Sorting by line');
      sortedList = sortedList.sort(doSortByLine);
    }

    if (sortDirection === SORT_DIRECTION.DESC) {
      debug('Reversing');
      sortedList.reverse();
    }

    return sortedList;
  }

  /**
   * Handles resizing the columns
   *
   * @param {number} newColumnWidth
   * @param {string} columnKey
   */
  public onColumnResizeEndCallback(newColumnWidth: number, columnKey: string) {
    this.setState(({ columnWidths }) => ({
      columnWidths: {
        ...columnWidths!,
        [columnKey]: newColumnWidth,
      }
    }));
  }

  /**
   * Handles reodering the columns
   */
  public onColumnReorderEndCallback(event: any) {
    if (!this.state.columnOrder) return;

    const columnOrder = this.state.columnOrder.filter((columnKey) => columnKey !== event.reorderColumn);

    if (event.columnAfter) {
      const index = columnOrder.indexOf(event.columnAfter);
      columnOrder.splice(index, 0, event.reorderColumn);
    } else {
      columnOrder.push(event.reorderColumn);
    }

    this.setState({ columnOrder });
  }

  /**
   * Checks if we're looking at a web app log and returns a warning, so that users know
   * the app didn't all over
   *
   * @returns {(JSX.Element | null)}
   */
  public renderWebAppWarning(): JSX.Element | null {
    const { logFile } = this.props;

    const text = `The web app logs are difficult to parse for a computer - proceed with caution. Combined view is disabled. Click to dismiss.`;
    return logFile.logType === 'webapp' ? <Alert state={sleuthState} text={text} level='warning' /> : null;
  }

  /**
   * Renders the "message" cell
   *
   * @param {any} { cellData, columnData, dataKey, rowData, rowIndex }
   * @returns {(JSX.Element | string)}
   */
  public messageCellRenderer(entry: LogEntry): JSX.Element | string {
    if (entry && entry.meta) {
      const icon = isReduxAction(entry.message)
        ? <img className='ReduxIcon' src='./img/redux.png' alt='Redux Action' />
        : <i className='ts_icon ts_icon_all_files_alt HasData'/>;

      return (
        <span title={entry.message}>
          {icon} {entry.message}
        </span>
      );
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
  public timestampCellRenderer(entry: LogEntry): JSX.Element | string {
    // Todo: This could be cool, but it's expensive af
    const { dateTimeFormat } = this.props;
    const timestamp = entry.momentValue ? moment(entry.momentValue).format(dateTimeFormat) : entry.timestamp;
    let prefix = <i className='Meta ts_icon ts_icon_question'/>;

    if (entry.logType === 'browser') {
      prefix = <i title='Browser Log' className='Meta Color-Browser ts_icon ts_icon_power_off'/>;
    } else if (entry.logType === 'renderer') {
      prefix = <i title='Renderer Log' className='Meta Color-Renderer ts_icon ts_icon_laptop'/>;
    } else if (entry.logType === 'webapp') {
      prefix = <i title='Webapp Log' className='Meta Color-Webapp ts_icon ts_icon_globe'/>;
    } else if (entry.logType === 'webview') {
      prefix = <i title='Webview Log' className='Meta Color-Webview ts_icon ts_icon_all_files_alt'/>;
    } else if (entry.logType === 'call') {
      prefix = <i title='Call Log' className='Meta Color-Call ts_icon ts_icon_phone'/>;
    }

    return (<span title={entry.timestamp}>{prefix}{timestamp}</span>);
  }

  /**
   * Render the headers for the columns
   */
  public renderHeaders() {
    const { sortDirection, sortBy, columnOrder } = this.state;

    const commonOptions = {
      columnsToShow: columnOrder!,
      onColumnChange: this.onColumnChange,
      onSortChange: this.onSortChange,
      sortDirection,
      sortBy };
    const timestampHeaderOptions = { sortKey: 'timestamp', ...commonOptions };
    const timestampHeader = <LogTableHeaderCell {...timestampHeaderOptions}>Timestamp</LogTableHeaderCell>;
    const indexHeaderOptions = { sortKey: 'index', ...commonOptions };
    const indexHeader = <LogTableHeaderCell {...indexHeaderOptions}>#</LogTableHeaderCell>;
    const levelHeaderOptions = { sortKey: 'level', ...commonOptions };
    const levelHeader = <LogTableHeaderCell {...levelHeaderOptions}>Level</LogTableHeaderCell>;
    const messageHeaderOptions = { sortKey: 'message', ...commonOptions };
    const messageHeader = <LogTableHeaderCell {...messageHeaderOptions}>Message</LogTableHeaderCell>;
    const lineHeaderOptions = { sortKey: 'line', ...commonOptions };
    const lineHeader = <LogTableHeaderCell {...lineHeaderOptions}>Line</LogTableHeaderCell>;

    return {
      index: indexHeader,
      line: lineHeader,
      timestamp: timestampHeader,
      level: levelHeader,
      message: messageHeader
    };
  }

  /**
   * Render the individual columns for the table
   *
   * @returns {Array<JSX.Element>}
   */
  public renderColumns(): Array<JSX.Element> {
    const { sortedList, columnWidths, columnOrder } = this.state;
    const headers = this.renderHeaders();
    // tslint:disable-next-line:no-this-assignment
    const self = this;

    if (!columnOrder || !columnWidths || !sortedList) return [];

    function renderIndex(props: any) {
      return <Cell {...props}>{sortedList![props.rowIndex].index}</Cell>;
    }
    function renderTimestamp(props: any) {
      return <Cell {...props}>{self.timestampCellRenderer(sortedList![props.rowIndex])}</Cell>;
    }
    function renderMessage(props: any) {
      return <Cell {...props}>{self.messageCellRenderer(sortedList![props.rowIndex])}</Cell>;
    }
    function renderLevel(props: any) {
      return <Cell {...props}>{sortedList![props.rowIndex].level}</Cell>;
    }
    function renderLine(props: any) {
      return <Cell {...props}>{sortedList![props.rowIndex].line}</Cell>;
    }

    const cellRenderers = {
      index: renderIndex,
      line: renderLine,
      timestamp: renderTimestamp,
      level: renderLevel,
      message: renderMessage
    };

    return columnOrder.map((key, i) => {
      const flexGrow = i + 1 === columnOrder.length ? 1 : 0;

      return (
        <Column
          key={key}
          columnKey={key}
          header={headers[key]}
          cell={cellRenderers[key]}
          width={columnWidths[key]}
          isResizable={true}
          isReorderable={true}
          flexGrow={flexGrow}
        />
      );
    });
  }

  /**
   * Renders the table
   *
   * @param {*} options
   * @param {Array<LogEntry>} sortedList
   * @returns {JSX.Element}
   */
  public renderTable(options: any): JSX.Element {
    const { sortedList, selectedIndex, searchList, ignoreSearchIndex, scrollToSelection } = this.state;
    const { searchIndex } = this.props;
    const columns = this.renderColumns();

    const tableOptions = {
      ...options,
      rowHeight: 30,
      rowsCount: sortedList!.length,
      onRowClick: this.onRowClick,
      rowClassNameGetter: this.rowClassNameGetter,
      ref: this.refHandlers.table,
      headerHeight: 30,
      onColumnResizeEndCallback: this.onColumnResizeEndCallback,
      onColumnReorderEndCallback: this.onColumnReorderEndCallback,
      isColumnResizing: false,
      isColumnReordering: false
    };

    if (!ignoreSearchIndex) tableOptions.scrollToRow = searchList![searchIndex] || 0;
    if (scrollToSelection) tableOptions.scrollToRow = selectedIndex || 0;

    return <Table {...tableOptions}>{columns}</Table>;
  }

  /**
   * The main render method
   *
   * @returns {(JSX.Element | null)}
   * @memberof LogTable
   */
  public render(): JSX.Element | null {
    const { logFile } = this.props;

    const typeClassName = logFile.type === 'MergedLogFile' ? 'Merged' : 'Single';
    const className = classNames('LogTable', typeClassName);
    const warning = this.renderWebAppWarning();

    return (
      <div className={className}>
        {warning}
        <div className={classNames('Sizer', { HasWarning: !!warning })}>
          <AutoSizer>{(options: any) => this.renderTable(options)}</AutoSizer>
        </div>
      </div>
    );
  }

  /**
   * Used by the table to get the className for a given row.
   * Called for each row.
   *
   * @private
   * @param {number} rowIndex
   * @returns {string}
   */
  private rowClassNameGetter(rowIndex: number): string {
    const { searchList, selectedIndex, ignoreSearchIndex } = this.state;
    const isSearchIndex = !ignoreSearchIndex && rowIndex === (searchList || [])[this.props.searchIndex];

    if (isSearchIndex || selectedIndex === rowIndex) {
      return 'ActiveRow';
    }

    if (searchList && searchList.includes(rowIndex)) {
      return 'HighlightRow';
    }

    return '';
  }
}
