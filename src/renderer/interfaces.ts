import fs from 'fs-extra';

// Anything that's valid as a "selected" log file. We started with just
// actual files  and have since added the "Tool" enum for, well, tools.
export type SelectableLogFile = LogFile | Tool | UnzippedFile;

export type LogFile = MergedLogFile | ProcessedLogFile;

export type RepeatedCounts = Record<string, number>;

export const enum LogType {
  BROWSER = 'browser',
  RENDERER = 'renderer',
  CALL = 'call',
  WEBAPP = 'webapp',
  PRELOAD = 'preload',
  NETLOG = 'netlog',
  INSTALLER = 'installer',
  ALL = 'all',
  UNKNOWN = ''
}

export const ALL_LOG_TYPES = [
  LogType.BROWSER,
  LogType.RENDERER,
  LogType.CALL,
  LogType.WEBAPP,
  LogType.PRELOAD,
  LogType.NETLOG,
  LogType.INSTALLER,
  LogType.ALL
];

export const LOG_TYPES_TO_PROCESS = [
  LogType.BROWSER,
  LogType.RENDERER,
  LogType.WEBAPP,
  LogType.PRELOAD,
  LogType.CALL,
  LogType.INSTALLER
];

export interface Bookmark {
  logEntry: LogEntry;
  logFile: LogFile;
}

export interface SerializedBookmark {
  logEntry: {
    line: number;
    index: number;
  };
  logFile: {
    id: string;
    type: 'ProcessedLogFile' | 'MergedLogFile';
  };
}

// [ logEntry.line, logEntry.index, logFile.id, logFile.type ]
export type CompressedBookmark = [ number, number, string, number ];

export interface ProcessorPerformanceInfo {
  name: string;
  type: LogType;
  lines: number;
  entries: number;
  processingTime: number;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface LogEntry {
  index: number;
  timestamp: string;
  message: string;
  level: string;
  logType: LogType;
  line: number;
  sourceFile: string;
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

export interface BaseFile {
  id: string;
  type: string;
}

export interface UnzippedFile extends BaseFile {
  fileName: string;
  size: number;
  fullPath: string;
  type: 'UnzippedFile';
}

export interface UnzippedFiles extends Array<UnzippedFile> { }

export interface MergedLogFiles {
  all: MergedLogFile;
  browser: MergedLogFile;
  renderer: MergedLogFile;
  webapp: MergedLogFile;
  preload: MergedLogFile;
  call: MergedLogFile;
  type: 'MergedLogFiles';
}

export interface ProcessedLogFile extends BaseFile {
  levelCounts: Record<string, number>;
  repeatedCounts: RepeatedCounts;
  logEntries: Array<LogEntry>;
  logFile: UnzippedFile;
  logType: LogType;
  type: 'ProcessedLogFile';
}

export interface ProcessedLogFiles {
  browser: Array<ProcessedLogFile>;
  renderer: Array<ProcessedLogFile>;
  preload: Array<ProcessedLogFile>;
  webapp: Array<ProcessedLogFile>;
  state: Array<UnzippedFile>;
  call: Array<ProcessedLogFile>;
  netlog: Array<UnzippedFile>;
  installer: Array<UnzippedFile>;
}

export interface MergedLogFile extends BaseFile {
  logFiles: Array<ProcessedLogFile>;
  logEntries: Array<LogEntry>;
  logType: LogType;
  type: 'MergedLogFile';
}

export interface SortedUnzippedFiles {
  browser: Array<UnzippedFile>;
  renderer: Array<UnzippedFile>;
  preload: Array<UnzippedFile>;
  webapp: Array<UnzippedFile>;
  state: Array<UnzippedFile>;
  call: Array<UnzippedFile>;
  netlog: Array<UnzippedFile>;
  installer: Array<UnzippedFile>;
}

export interface MergedFilesLoadStatus {
  all: boolean;
  browser: boolean;
  renderer: boolean;
  preload: boolean;
  webapp: boolean;
  call: boolean;
}

export interface LevelFilter {
  error: boolean;
  info: boolean;
  debug: boolean;
  warn: boolean;
}

export interface Suggestion extends fs.Stats {
  age: string;
  filePath: string;
  birthtimeMs: number;
}

export type Suggestions = Array<Suggestion>;

export enum Tool {
  cache = 'cache'
}
