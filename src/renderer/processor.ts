import { UnzippedFile, UnzippedFiles } from './unzip';
import { LogEntry, LogType, MatchResult, MergedLogFile, ProcessedLogFile, SortedUnzippedFiles } from './interfaces';
import { ipcRenderer } from 'electron';

import * as fs from 'fs-extra';
import * as readline from 'readline';
import * as moment from 'moment';
import * as path from 'path';

const debug = require('debug')('sleuth:processor');

// It's okay in this file
// tslint:disable:no-console

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
export function sortWithWebWorker(data: Array<any>, sortFn: string): Promise<Array<LogEntry>> {
  return new Promise((resolve) => {
    const code = `onmessage = function (evt) {evt.data.sort(${sortFn}); postMessage(evt.data)}`;

    if (window && (window as any).Worker && window.URL) {
      const worker = new Worker(URL.createObjectURL(new Blob([code])));
      worker.onmessage = (e) => resolve(e.data);
      worker.postMessage(data);
    } else {
      // Lols
      const sortedData = data.sort(new Function(`return ${sortFn}`)());
      resolve(sortedData);
    }
  });
}

/**
 * Takes a bunch of processed log files and merges all the entries into one sorted
 * array.
 *
 * @param {ProcessedLogFiles} logFiles
 */
export function mergeLogFiles(logFiles: Array<ProcessedLogFile>|Array<MergedLogFile>, logType: LogType | 'all'): Promise<MergedLogFile> {
  return new Promise((resolve) => {
    let logEntries: Array<LogEntry> = [];
    const totalEntries = (logFiles as Array<ProcessedLogFile>).map((l) => l.logEntries.length).reduce((t, s) => t + s, 0);

    debug(`Merging ${logFiles.length} log files with ${totalEntries} entries`, logFiles);
    console.time(`merging-${logType}`);

    // Single file? Cool, shortcut!
    if (logFiles.length === 1) {
      console.timeEnd(`merging-${logType}`);

      const singleResult: MergedLogFile = {
        logFiles: logFiles as Array<ProcessedLogFile>,
        logEntries: logFiles[0].logEntries,
        type: 'MergedLogFile',
        logType
      };

      return resolve(singleResult);
    }

    // Alright, let's do this
    (logFiles as Array<ProcessedLogFile>).forEach((logFile) => {
      logEntries = logEntries.concat(logFile.logEntries);
    });

    const sortFn = `function sort(a, b) {
      if (a.momentValue && b.momentValue) {
        return a.momentValue - b.momentValue;
      } else {
        return 1;
      }
    }`;

    sortWithWebWorker(logEntries, sortFn)
      .then((sortedLogEntries) => {
        console.timeEnd(`merging-${logType}`);

        const multiResult: MergedLogFile = {
          logFiles: logFiles as Array<ProcessedLogFile>,
          logEntries: sortedLogEntries,
          logType,
          type: 'MergedLogFile'
        };

        resolve(multiResult);
      });
  });
}

/**
 * Takes a logfile and returns the file's type (browser/renderer/webapp/webview).
 * @param {UnzippedFile} logFile
 * @returns {string}
 */
export function getTypeForFile(logFile: UnzippedFile): string {
  const fileName = path.basename(logFile.fileName);
  let logType: string = '';

  if (fileName.startsWith('browser')) {
    logType = 'browser';
  } else if (fileName.startsWith('renderer')) {
    logType = 'renderer';
  } else if (fileName.startsWith('webapp')) {
    logType = 'webapp';
  } else if (fileName.startsWith('webview')) {
    logType = 'webview';
  } else if (fileName.startsWith('call')) {
    logType = 'call';
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
    call: [] as Array<UnzippedFile>,
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

      if (result[logType]) {
        result[logType].push(logFile);
      } else {
        debug(`File ${logFile.fileName} seems weird - we don't recognize it. Throwing it away.`);
      }
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
  const promises: Array<any> = [];

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

    debug(`Processing file ${logFile.fileName}. Log type: ${logType}.`);
    sendProcStatus(`Processing file ${logFile.fileName}...`);

    console.time(`read-file-${logFile.fileName}`);
    readFile(logFile, logType)
      .then((logEntries) => {
        console.timeEnd(`read-file-${logFile.fileName}`);

        const result = { logFile, logEntries, logType, type: 'ProcessedLogFile'};
        resolve(result as ProcessedLogFile);
      });
  });
}

/**
 * Makes a log entry, ensuring that the required properties exist
 *
 * @export
 * @param {MatchResult} options
 * @param {string} logType
 * @param {number} line
 * @param {string} sourceFile
 * @returns {LogEntry}
 */
export function makeLogEntry(options: MatchResult, logType: string, line: number, sourceFile: string): LogEntry {
  options.message = options.message || '';
  options.timestamp = options.timestamp || '';
  options.level = options.level || '';

  const logEntry = {...options, logType, line, sourceFile };
  return logEntry as LogEntry;
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

    debug(`Reading file ${logFile.fileName}.`);

    let readLines = 0;
    let lastLogged = 0;
    let current: LogEntry | null = null;
    let toParse = '';

    readInterface.on('line', function onLine(line: any) {
      readLines = readLines + 1;
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
        current = makeLogEntry(matched, logType, readLines, logFile.fullPath);
      } else {
        // We couldn't match, let's treat it
        if (logType === 'call' && current) {
          // Call logs sometimes have rando newlines, for like no reason.
          current.message += line;
        } else {
          // This is (hopefully) part of a meta object
          toParse += line + '\n';
        }
      }

      // Update Status
      if (readLines > lastLogged + 999) {
        sendProcStatus(`Processed ${readLines} log lines in ${logFile.fileName}`);
        lastLogged = readLines;
      }
    });

    readInterface.on('close', () => {
      debug(`Finished reading file ${logFile.fileName}. ${lines.length} entries!`);
      resolve(lines);
    });
  });
}

/**
 * Matches a webapp line
 *
 * @export
 * @param {string} line
 * @returns {(MatchResult | undefined)}
 */
export function matchLineWebApp(line: string): MatchResult | undefined {
  // Matcher for the webapp, which is a bit dirty. This beast of a regex
  // matches two possible timestamps:
  // info: 2017/2/22 16:02:37.178 didStartLoading called TSSSB.timeout_tim set for ms:60000
  // info: Mar-19 13:50:41.676 [FOCUS-EVENT] Window focused
  const webappRegex = /^(\w{4,8}): ((?:\d{4}\/\d{1,2}\/\d{1,2}|.{3}-\d{1,2}) \d{2}:\d{2}:\d{2}.\d{0,3}) ([\s\S]*)$/;
  // Matcher for webapp logs that don't have a timestamp, but do have a level 🙄
  // info: ╔═══════════════════════════════════════════════════════════════════════╗
  // Sometimes they just log
  // TS.storage.isUsingMemberBotCache():false
  const webappLiteRegex = /^(\w{4,8}): ([\s\S]*)$/;

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
}

/**
 * Matches an Electron line (Browser, Renderer, WebView)
 *
 * @param {string} line
 * @returns {(MatchResult | undefined)}
 */
export function matchLineElectron(line: string): MatchResult | undefined {
  // Matcher for Slack Desktop, 2.6.0 and onwards!
  // [02/22/17, 16:02:33:371] info: Store: UPDATE_SETTINGS
  const desktopRegex = /^\[([\d\/\,\s\:]{22})\] ([A-Za-z]{0,20})\: ([\s\S]*)$/g;
  // Matcher for Slack Desktop, older versions
  // 2016-10-19T19:19:56.485Z - info: LOAD_PERSISTENT : {
  const desktopOldRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{1,3}.) - (\w{4,8}): ([\s\S]*)$/g;
  const endsWithObjectRegex = /^([\s\S]*) : {$/g;

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
    const momentValue = moment(results[1], 'YYYY-MM-DDTHH:mm:ss.SSSZ').valueOf();

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

/**
 * Matches a Call line
 *
 * @param {string} line
 * @returns {(MatchResult | undefined)}
 */
export function matchLineCall(line: string): MatchResult | undefined {
  // Matcher for calls
  // [YYYY/MM/DD hh:mm:ss uuu* LEVEL FILE->FUNCTION:LINE] message
  const callRegex = /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}\.\d{3})	([A-Z]{0,10}) ([\s\S]*)$/;
  const results = callRegex.exec(line);

  if (results && results.length === 4) {
    const momentValue = moment(results[1], 'YYYY/MM/DD hh:mm:ss.SSS').valueOf();

    return {
      timestamp: results[1],
      level: results[2].toLowerCase(),
      message: results[3],
      momentValue
    };
  }

  return;
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
  if (logType === 'webapp') {
    return matchLineWebApp(line);
  } else if (logType === 'call') {
    return matchLineCall(line);
  } else {
    return matchLineElectron(line);
  }
}

// tslint:enable:no-console
