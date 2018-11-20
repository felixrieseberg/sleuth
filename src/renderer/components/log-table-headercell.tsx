import React from 'react';
import { remote } from 'electron';
import { Cell } from 'fixed-data-table-2';

import { SORT_DIRECTION, COLUMN_TITLES } from './log-table-constants';

const debug = require('debug')('sleuth:logtable');

export interface LogTableHeaderCellProps {
  onSortChange: (sortBy: string, sortDirection: string) => void;
  onColumnChange: (columnsToShow: Array<string>) => void;
  sortKey: string;
  sortDirection?: string;
  sortBy?: string;
  columnsToShow: Array<string>;
}

export interface LogTableHeaderCellState {
}

const { Menu } = remote;

export class LogTableHeaderCell extends React.Component<LogTableHeaderCellProps, Partial<LogTableHeaderCellState>> {
  constructor(props: LogTableHeaderCellProps) {
    super(props);

    this.onSortChange = this.onSortChange.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.toggleColumn = this.toggleColumn.bind(this);
    this.resetColumns = this.resetColumns.bind(this);
  }

  public reverseSortDirection(sortDirection: string) {
    return sortDirection === SORT_DIRECTION.DESC ? SORT_DIRECTION.ASC : SORT_DIRECTION.DESC;
  }

  public onContextMenu(e: React.MouseEvent<any>) {
    e.preventDefault();
    debug(`Header cell context menu invoked`);

    const contextMenu = this.createContextMenu();
    contextMenu.popup({});
  }

  public onSortChange(e: React.MouseEvent<any>) {
    e.preventDefault();
    debug(`Header cell context menu: Sorting changed, now passing on`);

    if (this.props.onSortChange) {
      this.props.onSortChange(
        this.props.sortKey,
        this.props.sortDirection ? this.reverseSortDirection(this.props.sortDirection) : SORT_DIRECTION.DESC
      );
    }
  }

  public render() {
    const { sortDirection, children, sortBy, sortKey } = this.props;
    const sortIndicator = sortDirection && sortBy === sortKey ? (sortDirection === SORT_DIRECTION.DESC ? '↓' : '↑') : '';

    return (
      <Cell onContextMenu={this.onContextMenu} onClick={this.onSortChange}>
        <a>
          {children} {sortIndicator}
        </a>
      </Cell>
    );
  }

  /**
   * Toggle an individual column
   *
   * @param {string} key
   */
  private toggleColumn(key: string) {
    const { columnsToShow } = this.props;

    if (columnsToShow.includes(key)) {
      this.props.onColumnChange(columnsToShow.filter((k) => k !== key));
    } else {
      this.props.onColumnChange([ ...columnsToShow, key ]);
    }
  }

  /**
   * Creates the context menu for the header cells
   *
   * @returns {Electron.Menu}
   */
  private createContextMenu(): Electron.Menu {
    const { columnsToShow } = this.props;

    const items: Array<any> = Object.keys(COLUMN_TITLES).map((key) => ({
      label: COLUMN_TITLES[key],
      type: 'checkbox',
      checked: columnsToShow.includes(key),
      click: () => {
        this.toggleColumn(key);
      }
    }));

    items.push({ type: 'separator' });
    items.push({ label: 'Reset Table', click: this.resetColumns });

    return Menu.buildFromTemplate(items);
  }

  /**
   * Resets the columns
   */
  private resetColumns(): void {
    this.props.onColumnChange(Object.keys(COLUMN_TITLES));
  }
}
