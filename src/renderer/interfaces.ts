import { UnzippedFile } from './unzip';

export type LogType = 'browser' | 'renderer' | 'call' | 'webapp' | 'webview';

export interface LogEntry {
  index: number;
  timestamp: string;
  message: string;
  level: string;
  logType: LogType;
  meta?: any;
  momentValue?: number;
  repeated?: Array<string>;
}

export interface MatchResult {
  timestamp?: string;
  message?: string;
  level?: string;
  meta?: any;
  toParseHead?: string;
  momentValue?: number;
}

export interface MergedLogFiles {
  all?: MergedLogFile;
  browser?: MergedLogFile;
  renderer?: MergedLogFile;
  webapp?: MergedLogFile;
  webview?: MergedLogFile;
  call?: MergedLogFile;
  type: 'MergedLogFiles';
}

export interface ProcessedLogFile {
  logFile: UnzippedFile;
  logEntries: Array<LogEntry>;
  logType: LogType;
  type: 'ProcessedLogFile';
}

export interface ProcessedLogFiles {
  browser: Array<ProcessedLogFile>;
  renderer: Array<ProcessedLogFile>;
  webview: Array<ProcessedLogFile>;
  webapp: Array<ProcessedLogFile>;
  state: Array<UnzippedFile>;
  call: Array<ProcessedLogFile>;
}

export interface MergedLogFile {
  logFiles: Array<ProcessedLogFile>;
  logEntries: Array<LogEntry>;
  logType: LogType;
  type: 'MergedLogFile';
}

export interface CombinedLogFiles {
  logFiles: Array<ProcessedLogFile>;
  logEntries: Array<LogEntry>;
  logType: LogType;
  type: 'CombinedLogFiles';
}

export interface SortedUnzippedFiles {
  browser: Array<UnzippedFile>;
  renderer: Array<UnzippedFile>;
  webview: Array<UnzippedFile>;
  webapp: Array<UnzippedFile>;
  state: Array<UnzippedFile>;
  call: Array<UnzippedFile>;
}

export interface MergedFilesLoadStatus {
  all: boolean;
  browser: boolean;
  renderer: boolean;
  webview: boolean;
  webapp: boolean;
  call: boolean;
}

export interface LevelFilter {
  error: boolean;
  info: boolean;
  debug: boolean;
  warning: boolean;
}

export interface UserPreferences {
  dateTimeFormat: string;
}

