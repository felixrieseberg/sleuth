import * as React from 'react';
import { Cell } from 'fixed-data-table-2';

import { SORT_TYPES } from './log-table';

export interface LogTableHeaderCellProps {
  onSortChange: Function;
  sortKey: string;
  sortDirection?: string;
  sortBy?: string;
}

export interface LogTableHeaderCellState {
}

export class LogTableHeaderCell extends React.Component<LogTableHeaderCellProps, Partial<LogTableHeaderCellState>> {
  constructor(props: LogTableHeaderCellProps) {
    super(props);

    this.onSortChange = this.onSortChange.bind(this);
  }

  public reverseSortDirection(sortDirection: string) {
    return sortDirection === SORT_TYPES.DESC ? SORT_TYPES.ASC : SORT_TYPES.DESC;
  }

  public onSortChange(e: React.MouseEvent) {
    e.preventDefault();

    if (this.props.onSortChange) {
      this.props.onSortChange(
        this.props.sortKey,
        this.props.sortDirection ? this.reverseSortDirection(this.props.sortDirection) : SORT_TYPES.DESC
      );
    }
  }

  public render() {
    const { sortDirection, children, sortBy, sortKey } = this.props;
    const sortIndicator = sortDirection && sortBy === sortKey ? (sortDirection === SORT_TYPES.DESC ? '↓' : '↑') : '';

    return (
      <Cell>
        <a onClick={this.onSortChange}>
          {children} {sortIndicator}
        </a>
      </Cell>
    );
  }
}