import { UnzippedFile, UnzippedFiles } from './unzip';
import { LogEntry, MatchResult, MergedLogFile, ProcessedLogFile, SortedUnzippedFiles } from './interfaces';
import { ipcRenderer } from 'electron';

import * as fs from 'fs-promise';
import * as readline from 'readline';
import * as moment from 'moment';

/**
 * Sends a status update via IPC. Using IPC allows us to possible use other
 * BrowserWindows, too.
 *
 * @param {*} status
 */
export function sendProcStatus(status: any): void {
  ipcRenderer.send('processing-status', status);
}

/**
 * Sort an array, but do it on a different thread
 *
 * @export
 * @param {Array<any>} data
 * @param {string} sortFn
 */
export function sortWithWebWorker(data: Array<any>, sortFn: string) {
  return new Promise((resolve) => {
    const code = `onmessage = function (evt) {evt.data.sort(${sortFn}); postMessage(evt.data)}`;
    const worker = new Worker(URL.createObjectURL(new Blob([code])));
    worker.onmessage = (e) => resolve(e.data);
    worker.postMessage(data);
  });
}

/**
 * Takes a bunch of processed log files and merges all the entries into one sorted
 * array.
 *
 * @param {ProcessedLogFiles} logFiles
 */
export function mergeLogFiles(logFiles: Array<ProcessedLogFile>|Array<MergedLogFile>, logType: string): Promise<MergedLogFile> {
  return new Promise((resolve) => {
    let logEntries: Array<LogEntry> = [];
    const totalEntries = logFiles.map((l) => l.logEntries.length).reduce((t, s) => t + s);

    console.log(`Merging ${logFiles.length} log files with ${totalEntries} entries`, logFiles);
    console.time(`merging-${logType}`);

    // Single file? Cool, shortcut!
    if (logFiles.length === 1) {
      console.timeEnd(`merging-${logType}`);
      return resolve({
        logEntries: logFiles[0].logEntries,
        type: 'MergedLogFile',
        logType,
        logFiles
      });
    }

    // Alright, let's do this
    logFiles.forEach((logFile) => {
      logEntries = logEntries.concat(logFile.logEntries);
    });

    const sortFn = `function sort(a, b) {
      if (a.momentValue && b.momentValueOf) {
        return a.momentValue - b.momentValueOf;
      } else {
        return 1;
      }
    }`;

    sortWithWebWorker(logEntries, sortFn)
      .then((sortedLogEntries) => {
        console.timeEnd(`merging-${logType}`);
        resolve({ logFiles, logEntries: sortedLogEntries, logType, type: 'MergedLogFile' });
      });
  });
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
 * Takes a bunch of unzipped log files and returns a neatly sorted object.
 *
 * @param {UnzippedFiles} logFiles
 * @returns {SortedUnzippedFiles}
 */
export function getTypesForFiles(logFiles: UnzippedFiles): SortedUnzippedFiles {
  const isStateFile = /^slack-[\s\S]*$/;

  const result = {
    browser: [] as Array<UnzippedFile>,
    renderer: [] as Array<UnzippedFile>,
    webapp: [] as Array<UnzippedFile>,
    webview: [] as Array<UnzippedFile>,
    state: [] as Array<UnzippedFile>
  };

  logFiles.forEach((logFile) => {
    if (isStateFile.test(logFile.fileName)) {
      result.state.push(logFile);
    } else {
      const logType = getTypeForFile(logFile);
      result[logType].push(logFile);
    }
  });

  return result;
}

/**
 * Processes an array of unzipped logfiles.
 *
 * @param {UnzippedFiles} logFiles
 * @returns {Promise<ProcessedLogFiles>}
 */
export function processLogFiles(logFiles: UnzippedFiles): Promise<Array<ProcessedLogFile>> {
  let promises: Array<any> = [];

  logFiles.forEach((logFile) => {
    promises.push(processLogFile(logFile));
  });

  return Promise.all(promises);
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
    sendProcStatus(`Processing file ${logFile.fileName}...`);

    console.time(`read-file-${logFile.fileName}`);
    readFile(logFile, logType)
      .then((logEntries) => {
        console.timeEnd(`read-file-${logFile.fileName}`);
        resolve({ logFile, logEntries, logType, type: 'ProcessedLogFile'} as ProcessedLogFile)
      });
  });
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

    let readLines = 0;
    let lastLogged = 0;
    let current: LogEntry | null = null;
    let toParse = '';
    let lastPushed = 0;

    readInterface.on('line', function onLine(line) {
      if (!line || line.length === 0) {
        return;
      }

      const matched = matchLine(line, logType);

      if (matched) {
        // Is there a meta object?
        if (current && toParse && toParse.length > 0) {
          current.meta = toParse;
        }

        // Push the last entry
        if (current) {
          // If this a repeated line, save as repeated
          const lastIndex = lines.length - 1;
          const previous = lines.length > 0 ? lines[lastIndex] : null;
          if (previous && previous.message === current.message && previous.meta === current.meta) {
            lines[lastIndex].repeated = lines[lastIndex].repeated || [];
            lines[lastIndex].repeated!.push(current.timestamp);
          } else {
            current.index = lines.length;
            lines.push(current);
          }
        }

        // Create new entry
        toParse = matched.toParseHead || '';
        current = makeLogEntry(matched, logType);
      } else {
        // This is (hopefully) part of a meta object
        toParse += line;
      }

      // Update Status
      readLines = readLines + 1;
      if (readLines > lastLogged + 999) {
        sendProcStatus(`Processed ${readLines} log lines in ${logFile.fileName}`);
        lastLogged = readLines;
      }
    });

    readInterface.on('close', () => {
      console.log(`Finished reading file ${logFile.fileName}. ${lines.length} entries!`);
      resolve(lines);
    });
  });
}

/**
 * The heart of the operation - matches a single line against regexes to understand what's
 * happening inside a logline.
 *
 * @param {string} line
 * @param {string} logType
 * @returns {(MatchResult | undefined)}
 */
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
  // 2016-10-19T19:19:56.485Z - info: LOAD_PERSISTENT : {
  const desktopOldRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{1,3}.) - (\w{4,8}): ([\s\S]*)$/;
  const endsWithObjectRegex = /^([\s\S]*) : {$/;


  if (logType === 'webapp') {
    let results = webappRegex.exec(line);

    // First, try the expected default format
    if (results && results.length === 4) {
      return {
        timestamp: results[2],
        level: results[1],
        message: results[3]
      };
    }

    // Maybe there's a level?
    results = webappLiteRegex.exec(line);

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
  } else {
    // Try the new format first
    let results = desktopRegex.exec(line);

    if (results && results.length === 4) {
      const momentValue = moment(results[1], 'MM/DD/YY, HH:mm:ss:SSS').valueOf();

      return {
        timestamp: results[1],
        level: results[2],
        message: results[3],
        momentValue
      };
    }

    // Didn't work? Alright, try the old format
    results = desktopOldRegex.exec(line);

    if (results && results.length === 4) {
      // Check if it ends with an object
      const endsWithObject = endsWithObjectRegex.exec(results[3]);
      const message = (endsWithObject && endsWithObject.length === 2) ? endsWithObject[1] : results[3];
      const toParseHead = (endsWithObject && endsWithObject.length === 2) ? '{' : undefined;
      const momentValue = moment(results[1], 'MM/DD/YY, HH:mm:ss:SSS').valueOf();

      return {
        timestamp: results[1],
        level: results[2],
        message,
        toParseHead,
        momentValue
      };
    }

    return;
  }
}
