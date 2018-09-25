import { LevelFilter, ProcessedLogFile, MergedLogFile, LogEntry, DateRange } from '../interfaces';
import { SleuthState } from '../state/sleuth';

export enum SORT_DIRECTION {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface RowClickEvent {
  index: number;
  rowData: any;
}

export interface LogTableColumnWidths {
  index: number;
  line: number;
  timestamp: number;
  level: number;
  message: number;
}

export interface LogTableProps {
  logFile: ProcessedLogFile | MergedLogFile;
  levelFilter: LevelFilter;
  search?: string;
  dateTimeFormat: string;
  state: SleuthState;
  showOnlySearchResults: boolean;
  searchIndex: number;
  dateRange?: DateRange;
}

export interface LogTableState {
  sortedList: Array<LogEntry>;
  searchList: Array<number>;
  selectedEntry?: LogEntry;
  selectedIndex?: number;
  sortBy?: string;
  sortDirection?: SORT_DIRECTION;
  ignoreSearchIndex: boolean;
  scrollToSelection: boolean;
  columnWidths: LogTableColumnWidths;
  columnOrder: Array<string>;
}

export interface SortFilterListOptions {
  sortBy?: string;
  sortDirection?: string;
  filter?: LevelFilter;
  search?: string;
  logFile?: ProcessedLogFile | MergedLogFile;
  showOnlySearchResults?: boolean;
  dateRange?: DateRange;
}

export const COLUMN_TITLES = {
  index: '#',
  line: 'Line',
  timestamp: 'Timestamp',
  level: 'Level',
  message: 'Message'
};

export const COLUMN_WIDTHS = {
  index: 70,
  level: 70,
  timestamp: 220,
  line: 70,
  message: 300
};
