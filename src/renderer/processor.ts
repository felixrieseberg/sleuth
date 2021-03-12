import fs from 'fs-extra';
import readline from 'readline';
import path from 'path';

import { logPerformance } from './processor/performance';
import { LogEntry, LogType, MatchResult, MergedLogFile, ProcessedLogFile, SortedUnzippedFiles, UnzippedFile, UnzippedFiles } from '../interfaces';
import { getIdForLogFiles } from '../utils/id-for-logfiles';

const debug = require('debug')('sleuth:processor');

const DESKTOP_RGX = /^\s*\[([\d\/\,\s\:]{22,24})\] ([A-Za-z]{0,20})\:?(.*)$/g;

const WEBAPP_A_RGX = /^(\w*): (.{3}-\d{1,2} \d{2}:\d{2}:\d{2}.\d{0,3}) (.*)$/;
const WEBAPP_B_RGX = /^(\w*): (\d{4}\/\d{1,2}\/\d{1,2} \d{2}:\d{2}:\d{2}.\d{0,3}) (.*)$/;

const IOS_RGX = /^\s*\[((?:[0-9]{1,4}(?:\/|\-)?){3}, [0-9]{1,2}:[0-9]{2}:[0-9]{2}\s?(?:AM|PM)?)\] (-|.{0,2}<\w+>)(.+)$/;
const ANDROID_RGX = /^\s*([0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}:[0-9]{3}) (.+)$/;

const CONSOLE_A_RGX = /(\S*:1)?(?:[\u200B\t ]?)([A-Za-z]{3}-[0-9]{1,2} [0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}) (.+)/g;
const CONSOLE_B_RGX = /^(\S*:1) (.+)/g;
const CONSOLE_C_RGX = /^([0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}) (\S*:1)? ?(?:\u200B )?(.+)/g;

// Mar-26 09:29:38.460 []
const WEBAPP_NEW_TIMESTAMP_RGX = /^ ?\w{3}-\d{1,2} \d{1,2}:\d{2}:\d{2}\.\d{3}/g;

// 2019-01-08 08:29:56.504 ShipIt[4680:172321] Beginning installation
const SHIPIT_MAC_RGX = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) (.*)$/;
// 2019-01-30 21:08:25> Program: Starting install, writing to C:\Users\felix\AppData\Local\SquirrelTemp
const SQUIRREL_RGX = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})> (.*)$/;

/**
 * Sort an array, but do it on a different thread
 *
 * @export
 * @param {Array<any>} data
 * @param {string} sortFn
 */
export function sortWithWebWorker(data: Array<any>, sortFn: string): Promise<Array<LogEntry>> {
  return new Promise((resolve) => {
    // For test cases only
    if (!(window as any).Worker) {
      // tslint:disable-next-line:function-constructor
      const sortedData = data.sort(new Function(`return ${sortFn}`)());
      resolve(sortedData);
      return;
    }

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
      const singleResult: MergedLogFile = {
        logFiles: logFiles as Array<ProcessedLogFile>,
        logEntries: logFiles[0].logEntries,
        type: 'MergedLogFile',
        logType,
        // The id just needs to be unique
        id: (logFiles as Array<ProcessedLogFile>).map(({ id }) => id).join(',')
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
          type: 'MergedLogFile',
          id: getIdForLogFiles(logFiles)
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
 * Takes a logfile and returns the file's type (browser/renderer/webapp/preload/mobile).
 *
 * @param {UnzippedFile} logFile
 * @returns {LogType}
 */
export function getTypeForFile(logFile: UnzippedFile): LogType {
  const fileName = path.basename(logFile.fileName);

  if (fileName.startsWith('browser') || fileName === 'epics-browser.log') {
    return LogType.BROWSER;
  } else if (fileName.endsWith('preload.log') || fileName.startsWith('webview')) {
    return LogType.PRELOAD;
  } else if (fileName.startsWith('renderer')
    || fileName === 'epics-renderer.log'
    || fileName.startsWith('google')
    || fileName.startsWith('onedrive')
    || fileName.startsWith('box')
    || fileName.startsWith('dropbox')
    || fileName.startsWith('unknown')
    || fileName.endsWith('window-console.log')) {
    return LogType.RENDERER;
  } else if (fileName.startsWith('webapp') || fileName.startsWith('app.slack') || fileName.startsWith('console-export')) {
    return LogType.WEBAPP;
  } else if (fileName.startsWith('call')) {
    return LogType.CALL;
  } else if (fileName.startsWith('net') && !fileName.includes('net-log-window-console')) {
    return LogType.NETLOG;
  } else if (fileName.startsWith('ShipIt') || fileName.includes('SquirrelSetup')) {
    return LogType.INSTALLER;
  } else if (fileName.includes('Default_logs') || fileName.startsWith('attachment') || /\w{9,}_\w{9,}_\d{16,}\.txt/.test(fileName)) {
    return LogType.MOBILE;
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
  const isStateFile = (name: string) => {
    return /^slack-[\s\S]*$/.test(name) || name.endsWith('.html') || name.endsWith('.json') || name === 'installation';
  };

  const result: SortedUnzippedFiles = {
    browser: [],
    call: [],
    renderer: [],
    webapp: [],
    preload: [],
    state: [],
    installer: [],
    netlog: [],
    mobile: []
  };

  logFiles.forEach((logFile) => {
    const logType = getTypeForFile(logFile);

    if (result[logType]) {
      result[logType].push(logFile);
    } else if (isStateFile(logFile.fileName)) {
      result.state.push(logFile);
    } else {
      debug(`File ${logFile.fileName} seems weird - we don't recognize it. Throwing it away.`);
    }
  });

  return result;
}

/**
 * Checks the filename to see if we should process a log file.
 * Does not check if we shouldn't process the whole log type,
 * this is currently only used for those log categories that
 * contain _some_ files that shouldn't be processed (installer).
 *
 * @param {UnzippedFile} logFile
 * @returns {boolean}
 */
function getShouldProcessFile(logFile: UnzippedFile): boolean {
  const name = logFile && logFile.fileName
    ? logFile.fileName.toLowerCase()
    : '';

  if (name.includes('shipit') && name.endsWith('plist')) {
    return false;
  }

  return true;
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
): Promise<Array<ProcessedLogFile | UnzippedFile>> {
  const promises: Array<any> = [];

  logFiles.forEach((logFile) => {
    if (getShouldProcessFile(logFile)) {
      promises.push(processLogFile(logFile, progressCb));
    } else {
      promises.push(logFile);
    }
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
  const { entries, lines, levelCounts, repeatedCounts } = await readFile(logFile, logType, progressCb);
  const result: ProcessedLogFile = {
    logFile,
    logEntries: entries,
    logType,
    type: 'ProcessedLogFile',
    levelCounts,
    repeatedCounts,
    id: logFile.fileName
  };

  logPerformance({
    name: logFile.fileName,
    type: logType,
    lines,
    entries: entries.length,
    processingTime: performance.now() - timeStart
  });

  return result;
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
  repeatedCounts: Record<string, number>;
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
    const matchFn = getMatchFunction(parsedlogType, logFile);
    const isCall = logType === 'call';

    let lines = 0;
    let lastLogged = 0;
    let current: LogEntry | null = null;
    let toParse = '';

    const levelCounts = {};
    const repeatedCounts = {};

    function pushEntry(entry: LogEntry | null) {
      if (entry) {
        // If this a repeated line, save as repeated
        const lastIndex = entries.length - 1;
        const previous = entries.length > 0 ? entries[lastIndex] : null;

        if (previous && previous.message === entry.message && previous.meta === entry.meta) {
          entries[lastIndex].repeated = entries[lastIndex].repeated || [];
          entries[lastIndex].repeated!.push(entry.timestamp);

          repeatedCounts[entry.message] = (repeatedCounts[entry.message] || 0) + 1;
        } else {
          entry.index = entries.length;

          if (entry.level) {
            levelCounts[entry.level] = (levelCounts[entry.level] || 0)  + 1;
          }

          entries.push(entry);
        }

        if (previous && previous.timestamp && previous.momentValue && entry.timestamp === new Date('Jan-01-71 00:00:00').toString()) {
          // In this case, the line didn't have a timestamp. If possible, give it the timestamp of the line before.
          entry.timestamp = previous.timestamp;
          entry.momentValue = previous.momentValue;

        } else if (previous && previous.timestamp && previous.momentValue && entry.timestamp.startsWith('No Date')) {
          // In this case, the line has a timestamp only, but no date. If possible, give it the date of the line before!
          const newTimestamp = previous.timestamp.substring(0, 16) + entry.timestamp.substring(7);
          const newDate = new Date(newTimestamp);

          entry.timestamp = newTimestamp;
          entry.momentValue = newDate.valueOf();
        }
      }
    }

    function readLine(line: string) {
      lines = lines + 1;

      if (!line || line.length === 0 || (logType === 'mobile' && line.startsWith('====='))) {
        return;
      }

      const matched = matchFn(line);

      if (matched) {
        // Is there a meta object?
        if (current && toParse && toParse.length > 0) {
          current.meta = toParse;
        }

        // Push the last entry
        pushEntry(current);

        // Create new entry
        toParse = matched.toParseHead || '';
        current = makeLogEntry(matched, parsedlogType, lines, logFile.fullPath);
      } else {
        // We couldn't match, let's treat it
        if (isCall && current) {
          // Call logs sometimes have random newlines
          current.message += line;
        } else if (logType === 'mobile' && current) {
          // Android logs do too
          current.message += '\n' + line;
        } else if (current && (logFile.fileName.startsWith('app.slack') || logFile.fileName.startsWith('console-export-'))) {
          // For console logs:
          if (toParse && toParse.length > 0) {
            // If there's already a meta, just add to the meta
            toParse += line + '\n';
          } else if (line.includes('@') || line.includes('(async)') || line.match(/Show [\d]+ more frames/)) {
            // This is part of a stack trace - I could add it to the above line but that's a mouthful
            toParse += line + '\n';
          } else {
            current.message += '\n' + line;
          }
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
    readInterface.on('close', () => {
      pushEntry(current);
      resolve({ entries, lines, levelCounts, repeatedCounts });
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
  // matches three possible timestamps:
  //
  // info: 2017/2/22 16:02:37.178 didStartLoading called TSSSB.timeout_tim set for ms:60000
  // info: Mar-19 13:50:41.676 [FOCUS-EVENT] Window focused
  // [01/12/2021, 24:13:05:353] INFO [COUNTS] (T29KZ003T)
  //
  // Matcher for webapp logs that don't have a timestamp, but do have a level 🙄
  // info: ╔═══════════════════════════════════════════════════════════════════════╗
  // Sometimes they just log
  // TS.storage.isUsingMemberBotCache():false

  // If the line starts with a `{`, we're taking a shortcut and are expecting data.
  if (line[0] === '{') return;

  DESKTOP_RGX.lastIndex = 0;
  let results = DESKTOP_RGX.exec(line);

  // First, try the expected default format
  if (results && results.length === 4) {

    // Expected format: MM/DD/YY(YY), HH:mm:ss:SSS'
    const momentValue = new Date(results[1].replace(', 24:', ', 00:')).valueOf();
    let message = results[3];

    // If we have two timestamps, cut that from the message
    WEBAPP_NEW_TIMESTAMP_RGX.lastIndex = 0;
    if (WEBAPP_NEW_TIMESTAMP_RGX.test(results[3])) {
      message = message.slice(WEBAPP_NEW_TIMESTAMP_RGX.lastIndex);
    }

    return {
      timestamp: results[1],
      level: results[2].toLowerCase(),
      message,
      momentValue
    };
  }

  // Alright, try WEBAPP_A.
  WEBAPP_A_RGX.lastIndex = 0;
  results = WEBAPP_A_RGX.exec(line);

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

  return;
}

/**
 * Matches a line coming from Squirrel
 *
 * @export
 * @param {string} line
 * @returns {(MatchResult | undefined)}
 */
export function matchLineSquirrel(line: string): MatchResult | undefined {
  if (line.startsWith('   at')) return;

  SQUIRREL_RGX.lastIndex = 0;
  const results = SQUIRREL_RGX.exec(line);

  if (results && results.length === 3) {
    // Expected format: 2019-01-30 21:08:25
    const momentValue = new Date(results[1]).valueOf();

    return {
      timestamp: results[1],
      level: 'info',
      message: results[2],
      momentValue
    };
  }

  return;
}

/**
 * Matches a line coming from a ShipIt log file
 *
 * @export
 * @param {string} line
 * @returns {(MatchResult | undefined)}
 */
export function matchLineShipItMac(line: string): MatchResult | undefined {
  // If the line does not start with a number, we're taking a shortcut and
  // are expecting data.
  if (!/\d/.test(line[0])) return;

  SHIPIT_MAC_RGX.lastIndex = 0;
  const results = SHIPIT_MAC_RGX.exec(line);

  if (results && results.length === 3) {
    // Expected format: 2019-01-08 08:29:56.504
    const momentValue = new Date(results[1]).valueOf();
    let message = results[2];

    // Handle a meta entry
    // ShipIt logs have data on the same line
    const hasMeta = message.indexOf(', ');
    let toParseHead = '';

    if (hasMeta > -1) {
      toParseHead = message.slice(hasMeta + 1) + '\n';
      message = message.slice(0, hasMeta);
    }

    return {
      timestamp: results[1],
      level: 'info',
      message,
      momentValue,
      toParseHead
    };
  }

  return;
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
    const momentValue = new Date(results[1].replace(', 24:', ', 00:')).valueOf();

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
 * Matches a console log line (Chrome or Firefox)
 *
 * @param line
 * @returns ({MatchResult | undefined})
 */
export function matchLineConsole(line: string): MatchResult | undefined {
  // This monster recognizes several cases, including but not limited to:
  //
  // CONSOLE_A_RGX:
  //  Sep-24 14:36:07.809 [API-Q] (T34263EUF) e437fee7-1600983367.809
  // (cont.) conversations.history called with reason: message-pane/requestHistory
  // a.slack-edge.com/bv1-8/gantry-shared.75d2ab5.min.js?cacheKey=gantry-1600974368:1
  // (cont.) Sep-24 14:40:32.318 (T34263EUF) Notification (message) suppressed because:
  // 11:50:19.372 service-worker.js:1 Jan-19 11:50:19.372 [SERVICE-WORKER] checking if asset
  // (cont.) is in an existing cache bucket: gantry-1611070538 https://a.slack-edge.com/
  // 11:50:19.377 ​ Jan-19 11:50:19.377 [SERVICE-WORKER] checking if asset is in an existing
  // (cont.) cache bucket: gantry-1611070538 https://a.slack-edge.com/
  //
  // CONSOLE_B_RGX:
  // edgeapi.slack.com/cache/E12KS1G65/T34263EUF/users/info:1 Failed to load resource: net::ERR_TIMED_OUT
  //
  // CONSOLE_C_RGX:
  // 11:50:09.731 ​ Exposing workspace desktop delegate for  {
  // 11:50:10.297 ​ [API-Q] (T34263EUF) noversion-1611085810.297 Flannel users/info is ENQUEUED
  // 11:50:18.322 gantry-shared.f1348ec.min.js?cacheKey=gantry-1611070538:1
  // (cont.) [API-Q] (T34263EUF) noversion-1611085818.279 Flannel users/info is RESOLVED

  if (line.includes('@') || line.includes('(async)') || line.match(/Show [\d]+ more frames/)) { return; }
  // These lines are part of a stack trace, let's skip the regex so we can add them to the meta

  CONSOLE_A_RGX.lastIndex = 0;
  let results = CONSOLE_A_RGX.exec(line);

  if (results && results.length === 4) {
    const currentDate = new Date();
    const newTimestamp = new Date(results[2]);
    newTimestamp.setFullYear(currentDate.getFullYear());

    if (newTimestamp > currentDate) { // If the date is in the future, change the year by -1
      newTimestamp.setFullYear(newTimestamp.getFullYear() - 1);
    }

    const momentValue = newTimestamp.valueOf();

    return {
      timestamp: newTimestamp.toString(),
      level: 'info',
      message: results[1] ? results[3] + ' <' + results[1] + '>' : results[3],
      momentValue,
   };
  }

  CONSOLE_B_RGX.lastIndex = 0;
  results = CONSOLE_B_RGX.exec(line);

  if (results && results.length === 3) {
    return {
      timestamp: new Date('Jan-01-71 00:00:00').toString(),
      level: 'info',
      message: results [2] + ' ' + results[1],
      momentValue: new Date('Jan-01-71 00:00:00').valueOf(),
    };
  }

  CONSOLE_C_RGX.lastIndex = 0;
  results = CONSOLE_C_RGX.exec(line);

  if (results && results.length === 4) {
    return {
      timestamp: 'No Date' + results[1],
      level: 'info',
      message: results[2] ? results[3] + ' <' + results[2] + '>' : results[3],
      momentValue: 0,
    };
  }


  return;
}


/**
 * Matches an iOS line
 *
 * @param line
 * @returns {(MatchResult | undefined)}
 */
export function matchLineIOS(line: string): MatchResult | undefined {

  if (line.startsWith('=====')) { return; } // We're ignoring these lines

  IOS_RGX.lastIndex = 0;
  const results = IOS_RGX.exec(line);

  if (results && results.length === 4) {
    // Expected format: MM/DD/YY, HH:mm:ss ?AM|PM'
    const momentValue = new Date(results[1]).valueOf();

    const oldLevel = results[2];
    let newLevel: string;

    if (oldLevel.includes('ERR')) {
      newLevel = 'error';
    } else if (oldLevel.includes('WARN')) {
      newLevel = 'warn';
    } else {
      newLevel = 'info';
    }

    return {
      timestamp: results[1],
      level: newLevel,
      message: results[3],
      momentValue
    };
  }
  return;
}


/**
 * Matches an Android line
 *
 * @param line
 * @returns {(MatchResult | undefined)}
 */
export function matchLineAndroid(line: string): MatchResult | undefined {

  ANDROID_RGX.lastIndex = 0;
  const results = ANDROID_RGX.exec(line);

  if (results && results.length === 3) {
    // Android timestamps have no year, so we gotta add one
    const currentDate = new Date();
    const newTimestamp = new Date(results[1]);
    newTimestamp.setFullYear(currentDate.getFullYear());

    if (newTimestamp > currentDate) { // If the date is in the future, change the year by -1
      newTimestamp.setFullYear(newTimestamp.getFullYear() - 1);
    }

    // Expected format: MM-DD HH:mm:ss:sss
    const momentValue = newTimestamp.valueOf();

    return {
      timestamp: newTimestamp.toString(),
      level: 'info',
      message: results[2],
      momentValue
    };
  }

  // Let's pretend some of the debugging metadata is a log line so we can search for it
  if (line.startsWith('UsersCounts') || line.startsWith('Messag') && !line.startsWith('MessageGap(')) {
    return {
      timestamp: new Date('Jan-01-70 00:00:00').toString(),
      level: 'info',
      message: line,
      momentValue: new Date('Jan-01-70 00:00:00').valueOf(),
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
      level: results[2],
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
 * @param {UnzippedFile} logFile
 * @returns {((line: string) => MatchResult | undefined)}
 */
export function getMatchFunction(
  logType: LogType,
  logFile: UnzippedFile
): (line: string) => MatchResult | undefined {
  if (logType === LogType.WEBAPP) {
    if (logFile.fileName.startsWith('app.slack') || logFile.fileName.startsWith('console-export-')) {
      return matchLineConsole;
    } else {
      return matchLineWebApp;
    }
  } else if (logType === LogType.CALL) {
    return matchLineCall;
  } else if (logType === LogType.INSTALLER) {
    if (logFile.fileName.includes('Squirrel')) {
      return matchLineSquirrel;
    } else {
      return matchLineShipItMac;
    }
  } else if (logType === LogType.MOBILE) {
    if (logFile.fileName.startsWith('attachment')) {
      return matchLineAndroid;
    } else {
      return matchLineIOS;
    }
  } else {
    return matchLineElectron;
  }
}