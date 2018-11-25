import { MergedLogFile, LogType } from '../../src/renderer/interfaces';

export const fakeMergedFile: MergedLogFile = {
  logEntries: [],
  logFiles: [],
  logType: LogType.BROWSER,
  type: 'MergedLogFile'
};