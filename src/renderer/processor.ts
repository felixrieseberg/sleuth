import fs from 'fs-extra';
import readline from 'readline';
import path from 'path';

import { logPerformance } from './processor/performance';
import { UnzippedFile, UnzippedFiles } from './unzip';
import { LogEntry, LogType, MatchResult, MergedLogFile, ProcessedLogFile, SortedUnzippedFiles } from './interfaces';

const debug = require('debug')('sleuth:processor');

const DESKTOP_RGX = /^\[([\d\/\,\s\:]{22})\] ([A-Za-z]{0,20})\: (.*)$/g;
const WEBAPP_A_RGX = /^(\w*): (.{3}-\d{1,2} \d{2}:\d{2}:\d{2}.\d{0,3}) (.*)$/;
const WEBAPP_B_RGX = /^(\w*): (\d{4}\/\d{1,2}\/\d{1,2} \d{2}:\d{2}:\d{2}.\d{0,3}) (.*)$/;
const WEBAPP_LITE_RGX = /^(\w{4,8}): (.*)$/;

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
    const worker = new Worker(URL.createObjectURL(new Blob([ code ])));

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
export function mergeLogFiles(
  logFiles: Array<ProcessedLogFile>|Array<MergedLogFile>, logType: LogType | LogType.ALL
): Promise<MergedLogFile> {
  return new Promise((resolve) => {
    let logEntries: Array<LogEntry> = [];
    const start = performance.now();
    const performanceData = {
      type: logType,
      name: `Merged ${logType}`
    };

    // Single file? Cool, shortcut!
    if (logFiles.length === 1) {
      console.timeEnd(`merging-${logType}`);

      const singleResult: MergedLogFile = {
        logFiles: logFiles as Array<ProcessedLogFile>,
        logEntries: logFiles[0].logEntries,
        type: 'MergedLogFile',
        logType
      };

      logPerformance({
        ...performanceData,
        entries: singleResult.logEntries.length,
        lines: 0,
        processingTime: performance.now() - start
      });

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
        const multiResult: MergedLogFile = {
          logFiles: logFiles as Array<ProcessedLogFile>,
          logEntries: sortedLogEntries,
          logType,
          type: 'MergedLogFile'
        };

        logPerformance({
          ...performanceData,
          entries: multiResult.logEntries.length,
          lines: 0,
          processingTime: performance.now() - start
        });

        resolve(multiResult);
      });
  });
}

/**
 * Takes a logfile and returns the file's type (browser/renderer/webapp/preload).
 * @param {UnzippedFile} logFile
 * @returns {LogType}
 */
export function getTypeForFile(logFile: UnzippedFile): LogType {
  const fileName = path.basename(logFile.fileName);

  if (fileName.startsWith('browser') || fileName === 'epics-browser.log') {
    return LogType.BROWSER;
  } else if (fileName.endsWith('preload.log') || fileName.startsWith('webview')) {
    return LogType.PRELOAD;
  } else if (fileName.startsWith('renderer') || fileName === 'epics-renderer.log') {
    return LogType.RENDERER;
  } else if (fileName.startsWith('webapp')) {
    return LogType.WEBAPP;
  } else if (fileName.startsWith('call')) {
    return LogType.CALL;
  }

  return LogType.UNKNOWN;
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
    preload: [] as Array<UnzippedFile>,
    state: [] as Array<UnzippedFile>
  };

  logFiles.forEach((logFile) => {
    if (isStateFile.test(logFile.fileName) || logFile.fileName.endsWith('.html') || logFile.fileName.endsWith('.json')) {
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
export function processLogFiles(
  logFiles: UnzippedFiles,
  progressCb?: (status: string) => void
): Promise<Array<ProcessedLogFile>> {
  const promises: Array<any> = [];

  logFiles.forEach((logFile) => {
    promises.push(processLogFile(logFile, progressCb));
  });

  return Promise.all(promises);
}

/**
 * Processes a single log file.
 *
 * @param {UnzippedFile} logFile
 * @returns {Promise<ProcessedLogFile>}
 */
export async function processLogFile(
  logFile: UnzippedFile,
  progressCb?: (status: string) => void
): Promise<ProcessedLogFile> {
  const logType = getTypeForFile(logFile);

  if (progressCb) progressCb(`Processing file ${logFile.fileName}...`);

  const timeStart = performance.now();
  const { entries, lines, levelCounts } = await readFile(logFile, logType, progressCb);
  const result = { logFile, logEntries: entries, logType, type: 'ProcessedLogFile', levelCounts };

  logPerformance({
    name: logFile.fileName,
    type: logType,
    lines,
    entries: entries.length,
    processingTime: performance.now() - timeStart
  });

  return result as ProcessedLogFile;
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
export function makeLogEntry(
  options: MatchResult, logType: string, line: number, sourceFile: string
): LogEntry {
  options.message = options.message || '';
  options.timestamp = options.timestamp || '';
  options.level = options.level || '';

  const logEntry = {...options, logType, line, sourceFile };
  return logEntry as LogEntry;
}

export interface ReadFileResult {
  entries: Array<LogEntry>;
  lines: number;
  levelCounts: Record<string, number>;
}

/**
 * Reads a log file line by line, creating logEntries in a somewhat smart way.
 *
 * @param {UnzippedFile} logFile
 * @param {string} [logType='']
 * @returns {Promise<Array<LogEntry>>}
 */
export function readFile(
  logFile: UnzippedFile,
  logType?: LogType,
  progressCb?: (status: string) => void
): Promise<ReadFileResult> {
  return new Promise(async (resolve) => {
    const entries: Array<LogEntry> = [];
    const readStream = fs.createReadStream(logFile.fullPath);
    const readInterface = readline.createInterface({ input: readStream, terminal: false });
    const parsedlogType = logType || getTypeForFile(logFile);
    const matchFn = getMatchFunction(parsedlogType);
    const isCall = logType === 'call';

    let lines = 0;
    let lastLogged = 0;
    let current: LogEntry | null = null;
    let toParse = '';

    const levelCounts = {};

    function readLine(line: string) {
      lines = lines + 1;

      if (!line || line.length === 0) {
        return;
      }

      const matched = matchFn(line);

      if (matched) {
        // Is there a meta object?
        if (current && toParse && toParse.length > 0) {
          current.meta = toParse;
        }

        // Push the last entry
        if (current) {
          // If this a repeated line, save as repeated
          const lastIndex = entries.length - 1;
          const previous = entries.length > 0 ? entries[lastIndex] : null;

          if (previous && previous.message === current.message && previous.meta === current.meta) {
            entries[lastIndex].repeated = entries[lastIndex].repeated || [];
            entries[lastIndex].repeated!.push(current.timestamp);
          } else {
            current.index = entries.length;

            if (current.level) {
              levelCounts[current.level] = (levelCounts[current.level] || 0)  + 1;
            }

            entries.push(current);
          }
        }

        // Create new entry
        toParse = matched.toParseHead || '';
        current = makeLogEntry(matched, parsedlogType, lines, logFile.fullPath);
      } else {
        // We couldn't match, let's treat it
        if (isCall && current) {
          // Call logs sometimes have rando newlines, for like no reason.
          current.message += line;
        } else {
          // This is (hopefully) part of a meta object
          toParse += line + '\n';
        }
      }

      // Update Status
      if (progressCb && lines > lastLogged + 1999) {
        progressCb(`Processed ${lines} log lines in ${logFile.fileName}`);
        lastLogged = lines;
      }
    }

    readInterface.on('line', readLine);
    readInterface.on('close', () => resolve({ entries, lines, levelCounts }));
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
  // Matcher for webapp logs that don't have a timestamp, but do have a level 🙄
  // info: ╔═══════════════════════════════════════════════════════════════════════╗
  // Sometimes they just log
  // TS.storage.isUsingMemberBotCache():false

  WEBAPP_A_RGX.lastIndex = 0;
  let results = WEBAPP_A_RGX.exec(line);

  // First, try the expected default format
  if (results && results.length === 4) {
    return {
      timestamp: results[2],
      level: results[1],
      message: results[3]
    };
  }

  // Let's try a different timestamp
  WEBAPP_B_RGX.lastIndex = 0;
  results = WEBAPP_B_RGX.exec(line);

  if (results && results.length === 4) {
    return {
      timestamp: results[2],
      level: results[1],
      message: results[3]
    };
  }

  // Maybe there's a level?
  WEBAPP_LITE_RGX.lastIndex = 0;
  results = WEBAPP_LITE_RGX.exec(line);

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
 * Matches an Electron line (Browser, Renderer, Preload)
 *
 * @param {string} line
 * @returns {(MatchResult | undefined)}
 */
export function matchLineElectron(line: string): MatchResult | undefined {
  // If the line starts with a `{`, we're taking a shortcut and are expecting data.
  if (line[0] === '{') return;

  // Matcher for Slack Desktop, 2.6.0 and onwards!
  // [02/22/17, 16:02:33:371] info: Store: UPDATE_SETTINGS
  DESKTOP_RGX.lastIndex = 0;
  const results = DESKTOP_RGX.exec(line);

  if (results && results.length === 4) {
    // Expected format: MM/DD/YY, HH:mm:ss:SSS'
    const momentValue = new Date(results[1]).valueOf();

    return {
      timestamp: results[1],
      level: results[2],
      message: results[3],
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
    // Expected format: YYYY/MM/DD hh:mm:ss.SSS
    const momentValue = new Date(results[1]).valueOf();

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
 * Returns the correct match line function for a given log type.
 *
 * @export
 * @param {LogType} logType
 * @returns {((line: string) => MatchResult | undefined)}
 */
export function getMatchFunction(logType: LogType): (line: string) => MatchResult | undefined {
  if (logType === 'webapp') {
    return matchLineWebApp;
  } else if (logType === 'call') {
    return matchLineCall;
  } else {
    return matchLineElectron;
  }
}
