import { LogTable } from './components/logtable';
import { UnzippedFile, UnzippedFiles } from './unzip';
import * as fs from 'fs-promise';
import * as readline from 'readline';
import * as moment from 'moment';

export interface LogEntry {
  timestamp: string;
  message: string;
  level: string;
  logType: string;
  meta?: any;
  moment?: moment.Moment | string;
}

export interface MatchResult {
  timestamp?: string;
  message?: string;
  level?: string;
  meta?: any;
  moment?: moment.Moment;
}

export interface ProcessedFiles {
  processedLogFiles: ProcessedLogFiles;
  stateFiles: Array<UnzippedFile>;
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

export interface ProcessedLogFiles extends Array<ProcessedLogFile> { }

export interface MergedLogFile {
  logFiles: ProcessedLogFiles;
  logEntries: Array<LogEntry>;
  logType: string;
  type: 'MergedLogFile';
}

export interface CombinedLogFiles {
  logFiles: ProcessedLogFiles;
  logEntries: Array<LogEntry>;
  logType: string;
  type: 'CombinedLogFiles';
}

/**
 * Takes a bunch of processed log files and merges all the entries into one sorted
 * array.
 *
 * @param {ProcessedLogFiles} logFiles
 */
export function mergeLogFiles(logFiles: ProcessedLogFiles, logType: string): MergedLogFile {
  let logEntries: Array<LogEntry> = [];
  const totalEntries = logFiles.map((l) => l.logEntries.length).reduce((t, s) => t + s);

  console.log(`Merging ${logFiles.length} log files with ${totalEntries} entries`, logFiles);

  logFiles.forEach((logFile) => {
    logEntries = logEntries.concat(logFile.logEntries);
  });

  logEntries.sort((a, b) => {
    if (a.moment && b.moment) {
      return (a.moment.valueOf() as number) - (b.moment.valueOf() as number);
    } else {
      return 1;
    }
  });

  return { logFiles, logEntries, logType, type: 'MergedLogFile' };
}

/**
 * Takes a logfile and returns the file's type (browser/renderer/webapp/webview).
 * @param {UnzippedFile} logFile
 * @returns {string}
 */
export function getTypeForFile(logFile: UnzippedFile): string {
  const { fileName } = logFile;
  let logType: string = '';

  if (fileName.startsWith('browser.log')) {
    logType = 'browser';
  } else if (fileName.startsWith('renderer-')) {
    logType = 'renderer';
  } else if (fileName.startsWith('webapp-')) {
    logType = 'webapp';
  } else if (fileName.startsWith('webview-')) {
    logType = 'webview';
  }

  return logType;
}

/**
 * Processes a single log file.
 *
 * @param {UnzippedFile} logFile
 * @returns {Promise<ProcessedLogFile>}
 */
export function processLogFile(logFile: UnzippedFile): Promise<ProcessedLogFile> {
  return new Promise((resolve) => {
    const logType = getTypeForFile(logFile);

    console.log(`Processing file ${logFile.fileName}. Log type: ${logType}.`);

    readFile(logFile, logType)
      .then((logEntries) => {
        resolve({ logFile, logEntries, logType, type: 'ProcessedLogFile'} as ProcessedLogFile)
      });
  });
}

/**
 * Processes an array of unzipped logfiles.
 *
 * @param {UnzippedFiles} logFiles
 * @returns {Promise<ProcessedLogFiles>}
 */
export function processLogFiles(logFiles: UnzippedFiles): Promise<ProcessedLogFiles> {
  let promises: Array<any> = [];

  logFiles.forEach((logFile) => {
    promises.push(processLogFile(logFile));
  });

  return Promise.all(promises);
}

export async function processFiles(files: UnzippedFiles): Promise<ProcessedFiles> {
  // Everything that's state comes out
  const isStateFile = /^slack-[\s\S]*[^\.log]$/;
  const stateFiles: UnzippedFiles = [];
  const logFiles: UnzippedFiles = [];

  files.forEach((file) => {
    if (isStateFile.test(file.fileName)) {
      stateFiles.push(file);
    } else {
      logFiles.push(file);
    }
  });

  const processedLogFiles = await processLogFiles(logFiles);
  return { processedLogFiles, stateFiles };
}

export function makeLogEntry(options: MatchResult, logType: string): LogEntry {
  options.message = options.message || '';
  options.timestamp = options.timestamp || '';
  options.level = options.level || '';

  return {...options, logType } as LogEntry;
}

/**
 * Reads a log file line by line, creating logEntries in a somewhat smart way.
 *
 * @param {UnzippedFile} logFile
 * @param {string} [logType='']
 * @returns {Promise<Array<LogEntry>>}
 */
export function readFile(logFile: UnzippedFile, logType: string = ''): Promise<Array<LogEntry>> {
  return new Promise((resolve) => {
    const lines: Array<LogEntry> = [];
    const readStream = fs.createReadStream(logFile.fullPath);
    const readInterface = readline.createInterface({ input: readStream, terminal: false });
    logType = logType || getTypeForFile(logFile);

    console.log(`Reading file ${logFile.fileName}.`);

    let currentEntry: LogEntry | null = null;
    let toParse = '';

    readInterface.on('line', function onLine(line) {
      if (!line || line.length === 0) {
        return;
      }

      const matched = matchLine(line, logType);

      if (matched) {
        // Is there a meta object?
        if (currentEntry && toParse && toParse.length > 0) {
          currentEntry.meta = toParse;
        }

        // Push the last entry
        if (currentEntry) {
          lines.push(currentEntry);
        }

        // Create new entry
        toParse = '';
        currentEntry = makeLogEntry(matched, logType);
      } else {
        // This is (hopefully) part of a meta object
        toParse += line;
      }
    });

    readInterface.on('close', () => {
      console.log(`Finished reading file ${logFile.fileName}.`);
      resolve(lines);
    });
  });
}

export function matchLine(line: string, logType: string): MatchResult | undefined {
  // Matcher for the webapp, which is a bit dirty
  // info: 2017/2/22 16:02:37.178 didStartLoading called TSSSB.timeout_tim set for ms:60000
  const webappRegex = /^(\w{4,8}): (\d{4}\/\d{1,2}\/\d{1,2} \d{2}:\d{2}:\d{2}.\d{0,3}) ([\s\S]*)$/;
  // Matcher for webapp logs that don't have a timestamp, but do have a level 🙄
  // info: ╔═══════════════════════════════════════════════════════════════════════╗
  // Sometimes they just log
  // TS.storage.isUsingMemberBotCache():false
  const webappLiteRegex = /^(\w{4,8}): ([\s\S]*)$/;
  // Matcher for Slack Desktop, 2.6.0 and onwards!
  const desktopRegex = /^\[([\d\/\,\s\:]{22})\] ([A-Za-z]{0,20})\: ([\s\S]*)$/;
  // Matcher for Slack Desktop, older versions

  if (logType === 'webapp') {
    let results = webappRegex.exec(line);

    // First, try the expected default format
    if (results && results.length === 4) {
      return {
        moment: moment(results[2], 'YYYY/M/D, HH:mm:ss:SSS'),
        timestamp: results[2],
        level: results[1],
        message: results[3]
      };
    } else {
      results = webappLiteRegex.exec(line);

      // Maybe there's a level?
      if (results && results.length === 3) {
        return {
          level: results[1],
          message: results[2]
        };
      }

      // Not even that? We got nothing. Webapp doesn't have clear meta
      // objects though, so make it a line.
      return {
        message: line
      };
    }
  } else {
    // Try the new format first
    let results = desktopRegex.exec(line);

    if (results && results.length === 4) {
      return {
        moment: moment(results[1], 'MM/DD/YY, HH:mm:ss:SSS'),
        timestamp: results[1],
        level: results[2],
        message: results[3]
      };
    }

    // Didn't work? Alright, try the old format
    return;
  }
}
