import { UnzippedFile } from './unzip';
import fs from 'fs-extra';

export type LogFile = UnzippedFile | MergedLogFile | ProcessedLogFile;

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
  index: number;
}

export interface ProcessorPerformanceInfo {
  name: string;
  type: LogType;
  lines: number;
  entries: number;
  processingTime: number;
}

export interface DateRange {
  from?: Date;
  to?: Date;
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

export interface MergedLogFiles {
  all: MergedLogFile;
  browser: MergedLogFile;
  renderer: MergedLogFile;
  webapp: MergedLogFile;
  preload: MergedLogFile;
  call: MergedLogFile;
  type: 'MergedLogFiles';
}

export interface ProcessedLogFile {
  levelCounts: Record<string, number>;
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

export interface MergedLogFile {
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

export type SelectLogFileFn = (logFile: ProcessedLogFile | UnzippedFile | null, logType?: string) => void;

export enum Tool {
  cache = 'cache'
}
