import { ProcessedLogFile } from '../../src/renderer/interfaces';

export const mockBrowserFile1: ProcessedLogFile = {
  logEntries: [
    {
      index: 0,
      level: 'info',
      logType: 'browser',
      message: 'Hi!',
      momentValue: 1488837185497,
      timestamp: '2017-03-06T13:53:05.497',
      line: 0,
      sourceFile: 'test-file'
    }, {
      index: 1,
      level: 'info',
      logType: 'browser',
      message: 'Yo!',
      momentValue: 1488837201751,
      timestamp: '2017-03-06T13:53:21.751',
      line: 1,
      sourceFile: 'test-file'
    }, {
      index: 2,
      level: 'info',
      logType: 'browser',
      message: 'Hey!',
      momentValue: 1488837270030,
      timestamp: '2017-03-06T13:54:30.030',
      line: 2,
      sourceFile: 'test-file'
    }
  ],
  logFile: {
    fileName: 'browser.log',
    fullPath: '/mock/path/browser.log',
    size: 100
  },
  logType: 'browser',
  type: 'ProcessedLogFile'
};

// Slightly different timestamps
export const mockBrowserFile2: ProcessedLogFile = {
  logEntries: [
    {
      index: 0,
      level: 'info',
      logType: 'browser',
      message: 'Hi!',
      momentValue: 1488837228089,
      timestamp: '2017-03-06T13:53:48.089',
      line: 0,
      sourceFile: 'test-file'
    }, {
      index: 1,
      level: 'info',
      logType: 'browser',
      message: 'Yo!',
      momentValue: 1488837285150,
      timestamp: '2017-03-06T13:54:45.150',
      line: 1,
      sourceFile: 'test-file'
    }, {
      index: 2,
      level: 'info',
      logType: 'browser',
      message: 'Hey!',
      momentValue: 1488837294254,
      timestamp: '2017-03-06T13:54:54.254',
      line: 2,
      sourceFile: 'test-file'
    }
  ],
  logFile: {
    fileName: 'browser1.log',
    fullPath: '/mock/path/browser1.log',
    size: 100
  },
  logType: 'browser',
  type: 'ProcessedLogFile'
};
