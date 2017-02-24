import { UnzippedFile } from './unzip';

import * as moment from 'moment';

export interface LogEntry {
  timestamp: string;
  message: string;
  level: string;
  logType: string;
  meta?: any;
  moment?: moment.Moment;
}

export interface MatchResult {
  timestamp?: string;
  message?: string;
  level?: string;
  meta?: any;
  moment?: moment.Moment;
  toParseHead?: string;
}

export interface MergedLogFiles {
  all?: Array<LogEntry>;
  browser?: Array<LogEntry>;
  renderer?: Array<LogEntry>;
  webapp?: Array<LogEntry>;
  webview?: Array<LogEntry>;
  type: 'MergedLogFiles';
}

export interface ProcessedLogFile {
  logFile: UnzippedFile;
  logEntries: Array<LogEntry>;
  logType: string;
  type: 'ProcessedLogFile';
}

export interface ProcessedLogFiles {
  browser: Array<ProcessedLogFile>;
  renderer: Array<ProcessedLogFile>;
  webview: Array<ProcessedLogFile>;
  webapp: Array<ProcessedLogFile>;
  state: Array<UnzippedFile>;
}

export interface MergedLogFile {
  logFiles: Array<ProcessedLogFile>;
  logEntries: Array<LogEntry>;
  logType: string;
  type: 'MergedLogFile';
}

export interface CombinedLogFiles {
  logFiles: Array<ProcessedLogFile>;
  logEntries: Array<LogEntry>;
  logType: string;
  type: 'CombinedLogFiles';
}

export interface SortedUnzippedFiles {
  browser: Array<UnzippedFile>;
  renderer: Array<UnzippedFile>;
  webview: Array<UnzippedFile>;
  webapp: Array<UnzippedFile>;
  state: Array<UnzippedFile>;
}
