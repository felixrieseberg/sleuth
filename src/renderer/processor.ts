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

/**
 * Takes a bunch of processed log files and merges all the entries into one sorted
 * array.
 *
 * @param {Array<ProcessedLogFile>} logFiles
 */
export function mergeLogFiles(logFiles: Array<ProcessedLogFile>, logType: string): MergedLogFile {
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

  return { logFiles, logEntries, logType};
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

export function processLogFile(logFile: UnzippedFile): Promise<ProcessedLogFile> {
  return new Promise((resolve) => {
    const logType = getTypeForFile(logFile);

    console.log(`Processing file ${logFile.fileName}. Log type: ${logType}.`);

    readFile(logFile, logType)
      .then((logEntries) => {
        resolve({ logFile, logEntries, logType} as ProcessedLogFile)
      });
  });
}

export function processLogFiles(logFiles: UnzippedFiles): Promise<Array<ProcessedLogFile>> {
  let promises: Array<any> = [];

  logFiles.forEach((logFile) => {
    promises.push(processLogFile(logFile));
  });

  return Promise.all(promises);
}

export function readFile(logFile: UnzippedFile, logType: string = ''): Promise<Array<LogEntry>> {
  return new Promise((resolve) => {
    const lines: Array<LogEntry> = [];
    const readStream = fs.createReadStream(logFile.fullPath);
    const readInterface = readline.createInterface({ input: readStream, terminal: false });
    const matchLine = /^\[([\d\/\,\s\:]{22})\] ([A-Za-z]{0,20})\: ([\s\S]*)$/;
    logType = logType || getTypeForFile(logFile);

    console.log(`Reading file ${logFile.fileName}.`);

    function getEntry(message: string = '', timestamp: string = '', level: string = '', meta?: any, moment?: moment.Moment): LogEntry {
      return { message, timestamp, level, meta, moment, logType};
    };

    let currentEntry: LogEntry = getEntry();
    let toParse = '';

    readInterface.on('line', function onLine(line) {
      const results = matchLine.exec(line);

      if (results && results.length === 4) {
        // Is there a meta object?
        if (toParse && toParse.length > 0) {
          currentEntry.meta = toParse;
        }

        // Push the last entry
        lines.push(currentEntry);

        // Create new entry
        toParse = '';
        currentEntry = getEntry();
        currentEntry.moment = moment(results[1], 'MM/DD/YY, HH:mm:ss:SSS');
        currentEntry.timestamp = results[1];
        currentEntry.level = results[2];
        currentEntry.message = results[3];
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