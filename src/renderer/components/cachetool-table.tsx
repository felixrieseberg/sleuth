import debounce from 'debounce';
import React from 'react';
import classNames from 'classnames';
import { default as keydown, Keys } from 'react-keydown';
import autoBind from 'react-autobind';
import { Table, AutoSizer, Column } from 'react-virtualized';

import { SleuthState } from '../state/sleuth';
import { SORT_DIRECTION, LogTableColumnWidths, SortFilterListOptions, RowClickEvent } from './log-table-constants';
import { getRegExpMaybeSafe } from '../../utils/regexp';

const debug = require('debug')('sleuth:Cachetooltable');
const { DOWN } = Keys;

export interface CachetoolTableProps {
  search?: string;
  state: SleuthState;
  showOnlySearchResults: boolean | undefined;
  searchIndex: number;
  keys?: Array<string>;
}

export interface CachetoolTableState {
  sortedList: Array<string>;
  searchList: Array<number>;
  selectedEntry?: string;
  selectedIndex?: number;
  sortBy?: string;
  sortDirection?: SORT_DIRECTION;
  ignoreSearchIndex: boolean;
  scrollToSelection: boolean;
  columnWidths: LogTableColumnWidths;
  columnOrder: Array<string>;
}

export interface CachetoolKey {
  index: number;
  key: string;
}

export class CachetoolTable extends React.Component<CachetoolTableProps, Partial<CachetoolTableState>> {
  private changeSelectedEntry: any = null;

  constructor(props: CachetoolTableProps) {
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
   * @param {CachetoolTableProps} nextProps
   * @param {CachetoolTableState} nextState
   * @returns {boolean}
   */
  public shouldComponentUpdate(nextProps: CachetoolTableProps, nextState: CachetoolTableState): boolean {
    const { searchIndex } = this.props;
    const { sortBy, sortDirection, searchList, selectedIndex } = this.state;

    // Selected row changed
    if (selectedIndex !== nextState.selectedIndex) return true;

    // Sort direction changed
    const newSort = (nextState.sortBy !== sortBy || nextState.sortDirection !== sortDirection);
    if (newSort) return true;

    // Search changed
    if (searchList !== nextState.searchList || searchIndex !== nextProps.searchIndex) return true;

    return true;
  }

  /**
   * React's componentWillReceiveProps
   *
   * @param {CachetoolTableProps} nextProps
   */
  public componentWillReceiveProps(nextProps: CachetoolTableProps): void {
    const {
      search,
      showOnlySearchResults,
      searchIndex,
    } = this.props;

    // Next props
    const nextshowOnlySearchResults = nextProps.showOnlySearchResults;
    const nextSearch = nextProps.search;

    // Search changed
    const searchChanged = search !== nextProps.search || showOnlySearchResults !== nextshowOnlySearchResults;

    if (searchChanged) {
      const sortOptions: SortFilterListOptions = {
        showOnlySearchResults: nextshowOnlySearchResults,
        search: nextSearch,
      };

      const sortedList = this.sortList(sortOptions);
      let searchList: Array<number> = [];

      // Should we create a search list?
      if (!nextshowOnlySearchResults && nextSearch) {
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

    if (searchIndex !== nextProps.searchIndex) {
      this.setState({ ignoreSearchIndex: false });
    }
  }

  /**
   * React's componentDidMount
   */
  public componentDidMount() {
    this.setState({ sortedList: this.sortList() });
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
   * @memberof CachetoolTable
   */
  public render(): JSX.Element | null {
    const className = classNames('LogTable', 'bp3-text-muted');

    return (
      <div className={className}>
        <div className='Sizer'>
          <AutoSizer>{(options: any) => this.renderTable(options)}</AutoSizer>
        </div>
      </div>
    );
  }

  private findIndexForSelectedEntry(
    sortedList: Array<string> | undefined
  ): number {
    const { selectedCacheKey } = this.props.state;

    if (selectedCacheKey && sortedList) {
      const foundIndex = sortedList.findIndex((v) => v === selectedCacheKey);
      return foundIndex;
    }

    return -1;
  }

  /**
   * Handles a single click onto a row
   *
   * @param {RowClickEvent} { index }
   */
  private onRowClick({ index }: RowClickEvent) {
    const selectedCacheKey = this.state.sortedList![index] || undefined;

    console.debug(selectedCacheKey);

    this.props.state.selectedCacheKey = selectedCacheKey;
    this.props.state.isDetailsVisible = true;
    this.setState({
      selectedIndex: index,
      ignoreSearchIndex: true,
      scrollToSelection: false
    });
  }

  /**
   * Handles the change of sorting direction. This method is passed to the CachetoolTableHeaderCell
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
      this.setState({ sortBy, sortDirection, sortedList: this.sortList({ sortBy, sortDirection }) });
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
          this.props.state.selectedCacheKey = nextEntry;
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
   * Performs a search operation
   *
   * @param {string} search
   * @param {Array<string>} list
   * @returns Array<string>
   */
  private doSearchFilter(search: string, list: Array<string>): Array<string> {
    let searchRegex = getRegExpMaybeSafe(search || '');

    function doSearch(a: string) { return (!search || searchRegex.test(a)); }
    function doExclude(a: string) { return (!search || !searchRegex.test(a)); }
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
   * @param {Array<string>} list
   * @returns Array<number>
   */
  private doSearchIndex(search: string, list: Array<string>): Array<number> {
    let searchRegex = getRegExpMaybeSafe(search);

    const foundIndices: Array<number> = [];

    function doSearch(a: string, i: number) {
      if (!search || searchRegex.test(a)) foundIndices.push(i);
    }

    function doExclude(a: string, i: number) {
      if (!search || !searchRegex.test(a)) foundIndices.push(i);
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

  /**
   * Sorts the list
   */
  private sortList(options: SortFilterListOptions = {}): Array<string> {
    const search = options.search !== undefined ? options.search : this.props.search;
    const sortBy = options.sortBy || this.state.sortBy;
    const showOnlySearchResults = options.showOnlySearchResults !== undefined ? options.showOnlySearchResults : this.props.showOnlySearchResults;
    const sortDirection = options.sortDirection || this.state.sortDirection;

    debug(`Starting filter`);
    if (!this.props.keys || this.props.keys.length === 0) return [];

    const noSort = (!sortBy || sortBy === 'index') && (!sortDirection || sortDirection === SORT_DIRECTION.ASC);

    // Check if we can bail early and just use the naked logEntries array
    if (noSort && !search) return this.props.keys;

    let sortedList = this.props.keys.concat();

    // Named definition here allows V8 to go craaaaaazy, speed-wise.
    function doSortByMessage(a: string, b: string) { return a.localeCompare(b); }

    // Search
    if (search && showOnlySearchResults) {
      sortedList = this.doSearchFilter(search, sortedList);
    }

    // Sort
    debug(`Sorting by ${sortBy}`);
    if (sortBy === 'message') {
      sortedList = sortedList.sort(doSortByMessage);
    }

    if (sortDirection === SORT_DIRECTION.DESC) {
      debug('Reversing');
      sortedList.reverse();
    }

    debug(`sortList: Returning ${sortedList.length} entries`);

    return sortedList;
  }

  /**
   * Get the row data for the table
   *
   * @param {{ index: number }} { index }
   * @returns
   */
  private rowGetter({ index }: { index: number }): CachetoolKey {
    const key = this.state.sortedList![index];

    return {
      index: this.props.state.cacheKeys.indexOf(key),
      key
    };
  }

  /**
   * Renders the table
   *
   * @param {*} options
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
          label='Key'
          dataKey='key'
          width={options.width - 100}
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
  private rowClassNameGetter({ index }: { index: number }): string {
    const { searchList, selectedIndex, ignoreSearchIndex } = this.state;
    const isSearchIndex = !ignoreSearchIndex
      && index === (searchList || [])[this.props.searchIndex];

    if (isSearchIndex || selectedIndex === index) {
      return 'ActiveRow';
    }

    if (searchList && searchList.includes(index)) {
      return 'HighlightRow';
    }

    return '';
  }
}
