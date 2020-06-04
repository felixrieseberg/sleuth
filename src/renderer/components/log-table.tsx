import debounce from 'debounce';
import React from 'react';
import classNames from 'classnames';
import { format } from 'date-fns';
import { default as keydown, Keys } from 'react-keydown';
import autoBind from 'react-autobind';
import { Table, AutoSizer, Column, TableCellProps } from 'react-virtualized';
import { Icon } from '@blueprintjs/core';

import { LevelFilter, LogEntry, DateRange } from '../interfaces';
import { didFilterChange } from '../../utils/did-filter-change';
import { isReduxAction } from '../../utils/is-redux-action';
import {
  LogTableProps,
  LogTableState,
  SORT_DIRECTION,
  SortFilterListOptions,
  RowClickEvent
} from './log-table-constants';
import { isMergedLogFile } from '../../utils/is-logfile';
import { getRegExpMaybeSafe } from '../../utils/regexp';
import { between } from '../../utils/is-between';
import { getRangeEntries } from '../../utils/get-range-from-array';

const debug = require('debug')('sleuth:logtable');
const { DOWN } = Keys;

const enum RepeatedLevels {
  NOTIFY = 10,
  WARNING = 100,
  ERROR = 500
}

/**
 * Welcome! This is the biggest class in this application - it's the table that displays logging
 * information. This is also the class that could most easily destroy performance, so be careful
 * here!
 */
export class LogTable extends React.Component<LogTableProps, Partial<LogTableState>> {
  private changeSelectedEntry: any = null;

  constructor(props: LogTableProps) {
    super(props);

    this.state = {
      sortedList: [],
      sortBy: 'index',
      sortDirection: props.state.defaultSort || SORT_DIRECTION.DESC,
      searchList: [],
      ignoreSearchIndex: false
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
    const { dateTimeFormat, levelFilter, logFile, searchIndex, dateRange } = this.props;
    const { sortBy, sortDirection, sortedList, searchList, selectedIndex, selectedRangeIndex } = this.state;

    // Selected row changed
    if (selectedIndex !== nextState.selectedIndex) return true;
    if (selectedRangeIndex !== nextState.selectedRangeIndex) return true;

    // DateTimeFormat changed
    if (dateTimeFormat !== nextProps.dateTimeFormat) return true;

    // Sort direction changed
    const newSort = (nextState.sortBy !== sortBy || nextState.sortDirection !== sortDirection);
    if (newSort) return true;

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

    // DateRange changed
    if (dateRange !== nextProps.dateRange) return true;

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
    const {
      levelFilter,
      search,
      logFile,
      showOnlySearchResults,
      searchIndex,
      dateRange
    } = this.props;

    // Next props
    const nextShowOnlySearchResults = nextProps.showOnlySearchResults;
    const nextFile = nextProps.logFile;
    const nextLevelFilter = nextProps.levelFilter;
    const nextSearch = nextProps.search;
    const nextEntry = nextProps.selectedEntry;

    // Filter or search changed
    const entryChanged = nextEntry !== this.state.selectedEntry;
    const filterChanged = didFilterChange(levelFilter, nextLevelFilter);
    const searchChanged = search !== nextProps.search || showOnlySearchResults !== nextShowOnlySearchResults;
    const fileChanged = ((!logFile && nextFile)
      || logFile && nextFile && logFile.logEntries.length !== nextFile.logEntries.length
      || logFile && nextFile && logFile.logType !== nextFile.logType);

    // Date range changed
    const rangeChanged = dateRange !== nextProps.dateRange;
    const nextRange = nextProps.dateRange;

    // This should only happen if a bookmark was activated
    if (entryChanged) {
      this.setState({
        selectedEntry: this.props.state.selectedEntry,
        scrollToSelection: true
      });
    }

    if (filterChanged || searchChanged || fileChanged || rangeChanged || entryChanged) {
      const sortOptions: SortFilterListOptions = {
        showOnlySearchResults: nextShowOnlySearchResults,
        filter: nextLevelFilter,
        search: nextSearch,
        logFile: nextFile,
        dateRange: nextRange
      };
      const sortedList = this.sortFilterList(sortOptions);
      let searchList: Array<number> = [];

      // Should we create a search list?
      if (!nextShowOnlySearchResults && nextSearch) {
        debug(`showOnlySearchResults is false, making search list`);
        searchList = this.doSearchIndex(nextSearch, sortedList);
      }

      // Get correct selected index
      const selectedIndex = this.findIndexForSelectedEntry(sortedList);

      this.setState({
        sortedList,
        searchList,
        selectedIndex,
        scrollToSelection: !!selectedIndex
      });
    }

    if (fileChanged) {
      this.setState({ selectedRangeIndex: undefined });
    }

    if (isMergedLogFile(nextFile) && this.state.sortBy === 'index') {
      this.setState({ sortBy: 'momentValue' });
    }

    if (searchIndex !== nextProps.searchIndex) {
      this.setState({ ignoreSearchIndex: false });
    }
  }

  /**
   * React's componentDidMount
   */
  public componentDidMount() {
    const sortedList = this.sortFilterList();
    const { selectedEntry, selectedIndex } = this.props.state;
    const update: Partial<LogTableState> = {
      sortedList
    };

    if (selectedEntry) {
      update.selectedIndex = selectedIndex;
      update.selectedEntry = selectedEntry;
      update.scrollToSelection = true;
    }

    this.setState(update);
  }

  /**
   * Enables keyboard navigation of the table
   *
   * @param {React.KeyboardEvent<any>} { which }
   */
  @keydown('down', 'up')
  public onKeyboardNavigate(e: React.KeyboardEvent<any>) {
    e.preventDefault();
    this.changeSelection(e.which === DOWN ? 1 : -1);
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
    const className = classNames('LogTable', 'bp3-text-muted', typeClassName);

    return (
      <div className={className}>
        <div className='Sizer'>
          <AutoSizer>{(options: any) => this.renderTable(options)}</AutoSizer>
        </div>
      </div>
    );
  }

  private findIndexForSelectedEntry(
    sortedList: Array<LogEntry> | undefined
  ): number {
    const { selectedEntry } = this.props.state;

    if (selectedEntry && sortedList) {
      const foundIndex = sortedList.findIndex((v) => {
        return v.line === selectedEntry.line;
      });

      return foundIndex;
    }

    return -1;
  }

  /**
   * Handles a single click onto a row
   *
   * @param {RowClickEvent} { index }
   */
  private onRowClick({ index, event }: RowClickEvent) {
    const { sortedList } = this.state;

    // If the user held shift, we want to do a "from-to" selection
    const isFromToSelection = !!(event as any).shiftKey;

    const selectedIndex = isFromToSelection
      ? this.props.state.selectedIndex
      : index;
    const selectedRangeIndex = isFromToSelection
      ? index
      : undefined;
    const selectedRange = isFromToSelection
      && selectedIndex !== undefined && selectedRangeIndex !== undefined
        ? getRangeEntries(selectedRangeIndex, selectedIndex, sortedList!)
        : undefined;
    const selectedEntry = sortedList![selectedIndex!] || null;

    this.props.state.selectedRangeEntries = selectedRange;
    this.props.state.selectedEntry = selectedEntry;
    this.props.state.selectedIndex = selectedIndex;
    this.props.state.selectedRangeIndex = selectedRangeIndex;
    this.props.state.isDetailsVisible = true;

    this.setState({
      selectedIndex,
      selectedRangeIndex,
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
  private onSortChange(
    { sortBy, sortDirection }: { sortBy: string, sortDirection: SORT_DIRECTION }
  ) {
    const currentState = this.state;
    const newSort = (currentState.sortBy !== sortBy || currentState.sortDirection !== sortDirection);

    if (newSort) {
      this.setState({ sortBy, sortDirection, sortedList: this.sortFilterList({ sortBy, sortDirection }) });
    }
  }

  /**
   * Changes the current selection in the table
   *
   * @param {number} change
   */
  private changeSelection(change: number) {
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
          this.props.state.selectedIndex = nextIndex;
        }, 100);
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
  private shouldFilter(filter?: LevelFilter): boolean {
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
  private doSearchFilter(search: string, list: Array<LogEntry>): Array<LogEntry> {
    let searchRegex = getRegExpMaybeSafe(search || '');

    function doSearch(a: LogEntry) { return (!search || searchRegex.test(a.message)); }
    function doExclude(a: LogEntry) { return (!search || !searchRegex.test(a.message)); }
    const searchParams = search.split(' ');

    searchParams.forEach((param) => {
      if (param.startsWith('!') && param.length > 1) {
        debug(`Filter-Excluding ${param.slice(1)}`);
        searchRegex = getRegExpMaybeSafe(param.slice(1) || '');
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
  private doSearchIndex(search: string, list: Array<LogEntry>): Array<number> {
    let searchRegex = getRegExpMaybeSafe(search);

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
        searchRegex = getRegExpMaybeSafe(param.slice(1));
        list.forEach(doExclude);
      } else {
        debug(`Index-Searching for ${param}`);
        list.forEach(doSearch);
      }
    });

    return foundIndices;
  }

  private doRangeFilter({ from, to }: DateRange, list: Array<LogEntry>): Array<LogEntry> {
    if (!from || !to) return list;

    const fromTs = from.getTime();
    const toTs = to.getTime();

    return list.filter((e) => {
      const ts = e.momentValue || 0;
      return ts >= fromTs && ts <= toTs;
    });
  }

  /**
   * Sorts the list
   */
  private sortFilterList(options: SortFilterListOptions = {}): Array<LogEntry> {
    const logFile = options.logFile || this.props.logFile;
    const filter = options.filter || this.props.levelFilter;
    const search = options.search !== undefined ? options.search : this.props.search;
    const sortBy = options.sortBy || this.state.sortBy;
    const dateRange = options.dateRange || this.props.dateRange;
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
    function doSortByTimestamp(a: LogEntry, b: LogEntry) {
      if (a.momentValue === b.momentValue) return 0;
      return (a.momentValue || 0) > (b.momentValue || 0) ? 1 : -1;
    }
    function doFilter(a: LogEntry) { return (a.level && filter![a.level]); }

    // Filter
    if (shouldFilter) {
      sortedList = sortedList.filter(doFilter);
    }

    // Search
    if (search && showOnlySearchResults) {
      sortedList = this.doSearchFilter(search, sortedList);
    }

    // DateRange
    if (dateRange) {
      debug(`Performing date range filter (from: ${dateRange.from}, to: ${dateRange.to})`);
      sortedList = this.doRangeFilter(dateRange, sortedList);
    }

    // Sort
    debug(`Sorting by ${sortBy}`);
    if (sortBy === 'message') {
      sortedList = sortedList.sort(doSortByMessage);
    } else if (sortBy === 'level') {
      sortedList = sortedList.sort(doSortByLevel);
    } else if (sortBy === 'line') {
      sortedList = sortedList.sort(doSortByLine);
    } else if (sortBy === 'momentValue') {
      sortedList = sortedList.sort(doSortByTimestamp);
    }

    if (sortDirection === SORT_DIRECTION.DESC) {
      debug('Reversing');
      sortedList.reverse();
    }

    return sortedList;
  }

  /**
   * Renders the "message" cell
   *
   * @param {any} { cellData, columnData, dataKey, rowData, rowIndex }
   * @returns {(JSX.Element | string)}
   */
  private messageCellRenderer({ rowData: entry }: TableCellProps): JSX.Element | string {
    if (entry && entry.meta) {
      const icon = isReduxAction(entry.message)
        ? <Icon icon='diagram-tree' />
        : <Icon icon='paperclip' />;

      return (
        <span title={entry.message}>
          {icon} {entry.message}
        </span>
      );
    } else if (entry && entry.repeated) {
      const count = entry.repeated.length;
      let emoji = '';

      if (count > RepeatedLevels.NOTIFY) {
        emoji = '🛑 ';
      } else if (count > RepeatedLevels.WARNING) {
        emoji = '🌶 ';
      } else if (count > RepeatedLevels.ERROR) {
        emoji = '🔥 ';
      }

      return `(${emoji}Repeated ${entry.repeated.length} times) ${entry.message}`;
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
  private timestampCellRenderer({ rowData: entry }: TableCellProps): JSX.Element | string {
    const { dateTimeFormat } = this.props;
    const timestamp = entry.momentValue
      ? format(entry.momentValue, dateTimeFormat)
      : entry.timestamp;
    let prefix = <i className='Meta ts_icon ts_icon_question'/>;

    if (entry.logType === 'browser') {
      prefix = <i title='Browser Log' className='Meta Color-Browser ts_icon ts_icon_power_off'/>;
    } else if (entry.logType === 'renderer') {
      prefix = <i title='Renderer Log' className='Meta Color-Renderer ts_icon ts_icon_laptop'/>;
    } else if (entry.logType === 'webapp') {
      prefix = <i title='Webapp Log' className='Meta Color-Webapp ts_icon ts_icon_globe'/>;
    } else if (entry.logType === 'preload') {
      prefix = <i title='Preload Log' className='Meta Color-Preload ts_icon ts_icon_all_files_alt'/>;
    } else if (entry.logType === 'call') {
      prefix = <i title='Call Log' className='Meta Color-Call ts_icon ts_icon_phone'/>;
    }

    return (<span title={entry.timestamp}>{prefix}{timestamp}</span>);
  }

  /**
   * Get the row data for the table
   *
   * @param {{ index: number }} { index }
   * @returns
   * @memberof LogTable
   */
  private rowGetter({ index }: { index: number }): LogEntry {
    return this.state.sortedList![index];
  }

  /**
   * Renders the table
   *
   * @param {*} options
   * @param {Array<LogEntry>} sortedList
   * @returns {JSX.Element}
   */
  private renderTable(options: any): JSX.Element {
    const { sortedList, selectedIndex, searchList, ignoreSearchIndex, scrollToSelection } = this.state;
    const { searchIndex } = this.props;

    const tableOptions = {
      ...options,
      rowHeight: 30,
      rowGetter: this.rowGetter,
      rowCount: sortedList!.length,
      onRowClick: this.onRowClick,
      rowClassName: this.rowClassNameGetter,
      headerHeight: 30,
      sort: this.onSortChange,
      sortBy: this.state.sortBy,
      sortDirection: this.state.sortDirection,
    };

    if (!ignoreSearchIndex) tableOptions.scrollToIndex = searchList![searchIndex] || 0;
    if (scrollToSelection) tableOptions.scrollToIndex = selectedIndex || 0;

    return (
      <Table {...tableOptions}>
        <Column
          label='Index'
          dataKey='index'
          width={100}
          flexGrow={0}
          flexShrink={1}
        />
        <Column
          label='Line'
          dataKey='line'
          width={100}
        />
        <Column
          label='Timestamp'
          cellRenderer={this.timestampCellRenderer}
          dataKey='momentValue'
          width={200}
          flexGrow={2}
        />
        <Column
          label='Level'
          dataKey='level'
          width={100}
        />
        <Column
          label='Message'
          dataKey='message'
          cellRenderer={this.messageCellRenderer}
          width={options.width - 300}
          flexGrow={2}
        />
      </Table>
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
  private rowClassNameGetter(input: { index: number }): string {
    const { index } = input;
    const { searchList, selectedIndex, selectedRangeIndex, ignoreSearchIndex } = this.state;
    const isSearchIndex = !ignoreSearchIndex
      && index === (searchList || [])[this.props.searchIndex];
    const isRangeActive = selectedIndex !== undefined && selectedRangeIndex !== undefined
      && between(index, selectedIndex, selectedRangeIndex);

    if (isSearchIndex || selectedIndex === index || isRangeActive) {
      return 'ActiveRow';
    }

    if (searchList && searchList.includes(index)) {
      return 'HighlightRow';
    }

    const row = this.rowGetter(input);
    if (row?.level === 'error' || (row?.repeated?.length || 0) > RepeatedLevels.ERROR) {
      return 'ErrorRow';
    } else if (row?.level === 'warn' || (row?.repeated?.length || 0) > RepeatedLevels.WARNING) {
      return 'WarnRow';
    }

    return '';
  }
}
