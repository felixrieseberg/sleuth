import { UnzippedFile, UnzippedFiles } from '../../src/renderer/unzip';
import { expect } from 'chai';
import {
  getTypeForFile,
  getTypesForFiles,
  makeLogEntry,
  matchLineElectron,
  matchLineWebApp,
  mergeLogFiles,
  processLogFile,
  readFile
} from '../../src/renderer/processor';
import { mockBrowserFile1, mockBrowserFile2 } from '../__mocks__/processed-log-file';

import * as dirtyJSON from 'jsonic';
import * as path from 'path';
import { LogType } from '../../src/renderer/interfaces';

describe('matchLineWebApp', () => {
  it('should match a classic webapp line', () => {
    const line = 'info: 2017/2/22 16:02:37.178 didStartLoading TSSSB.timeout_tim set for ms:60000';
    const result = matchLineWebApp(line);

    expect(result).to.exist;
    expect(result!.timestamp).to.be.equal('2017/2/22 16:02:37.178');
    expect(result!.level).to.be.equal('info');
    expect(result!.message).to.be.equal('didStartLoading TSSSB.timeout_tim set for ms:60000');
  });

  it('should match a dirty webapp line', () => {
    const line = 'info: %celectron-text-substitutions %cSmart quotes are off%c +0ms';
    const result = matchLineWebApp(line);

    expect(result).to.exist;
    expect(result!.level).to.be.equal('info');
    expect(result!.message).to.be.equal('%celectron-text-substitutions %cSmart quotes are off%c +0ms');
  });

  it('should match a super dirty webapp line', () => {
    const line = 'TS.storage.isUsingMemberBotCache():true';
    const result = matchLineWebApp(line);

    expect(result).to.exist;
    expect(result!.message).to.be.equal('TS.storage.isUsingMemberBotCache():true');
  });
});

describe('matchLineElectron', () => {
  it('should match an Electron (>= 2.6) line', () => {
    const line = '[02/22/17, 16:02:33:371] info: Store: UPDATE_SETTINGS';
    const result = matchLineElectron(line);

    expect(result).to.exist;
    expect(result!.timestamp).to.be.equal('02/22/17, 16:02:33:371');
    expect(result!.level).to.be.equal('info');
    expect(result!.message).to.be.equal('Store: UPDATE_SETTINGS');
  });

  it('should match an Electron (< 2.6) line', () => {
    const line = '2016-10-19T19:19:56.485Z - info: LOAD_PERSISTENT : {';
    const result = matchLineElectron(line);

    expect(result).to.exist;
    expect(result!.timestamp).to.be.equal('2016-10-19T19:19:56.485Z');
    expect(result!.level).to.be.equal('info');
    expect(result!.message).to.be.equal('LOAD_PERSISTENT');
    expect(result!.toParseHead).to.be.equal('{');
  });
});

describe('readFile', () => {
  it('should read a browser.log file and create log entries', () => {
    const file: UnzippedFile = {
      fullPath: path.join(__dirname, '../static/browser.log'),
      fileName: 'browser.log',
      size: 1713
    };

    return readFile(file, LogType.BROWSER).then(({ entries }) => {
      expect(entries).to.exist;
      expect(entries.length).to.be.equal(12);
      expect(entries[0]).to.exist;
      expect(entries[0].timestamp).to.be.equal('02/22/17, 16:02:32:675');
      expect(entries[0].level).to.be.equal('info');
      expect(entries[0].momentValue).to.be.equal(1487808152675);
      expect(entries[0].logType).to.be.equal(LogType.BROWSER);
      expect(entries[0].index).to.be.equal(0);

      expect(entries[4].meta).to.exist;

      const parsedMeta = dirtyJSON(entries[4].meta);

      expect(parsedMeta).to.exist;
      expect(parsedMeta.isDevMode).to.be.true;
    });
  });

  it('should read a webapp.log file and create log entries', () => {
    const file: UnzippedFile = {
      fullPath: path.join(__dirname, '../static/webapp.log'),
      fileName: 'webapp.log',
      size: 1713
    };

    return readFile(file, LogType.WEBAPP).then(({ entries }) => {
      expect(entries).to.exist;
      expect(entries.length).to.be.equal(6);
      expect(entries[3]).to.exist;
      expect(entries[3].timestamp).to.be.equal('2017/2/22 16:02:37.178');
      expect(entries[3].message).to.be.equal('didStartLoading called TSSSB.timeout_tim set for ms:60000');
      expect(entries[3].logType).to.be.equal(LogType.WEBAPP);
      expect(entries[3].index).to.be.equal(3);
    });
  });
});

describe('makeLogEntry', () => {
  it('should make a log entry (duh)', () => {
    const options = {
      timestamp: '1',
      level: 'info',
      meta: '{}',
      toParseHead: '{',
      momentValue: 1
    };

    const result = makeLogEntry(options, 'browser', 1, 'test-file');
    expect(result).to.exist;
    expect(result.message).to.be.equal('');
    expect(result.timestamp).to.be.equal('1');
  });
});

describe('processLogFile', () => {
  it('should process a browser.log log file correctly', () => {
    const file: UnzippedFile = {
      fullPath: path.join(__dirname, '../static/browser.log'),
      fileName: 'browser.log',
      size: 1713
    };

    return processLogFile(file).then((result) => {
      expect(result).to.exist;
      expect(result.logFile).to.exist;
      expect(result.logEntries).to.exist;
      expect(result.logEntries.length).to.be.equal(12);
      expect(result.logEntries[0].timestamp).to.be.equal('02/22/17, 16:02:32:675');
      expect(result.logEntries[0].level).to.be.equal('info');
      expect(result.logEntries[0].momentValue).to.be.equal(1487808152675);
      expect(result.logEntries[0].logType).to.be.equal('browser');
      expect(result.logEntries[0].index).to.be.equal(0);
      expect(result.logType).to.exist;
      expect(result.type).to.exist;
    });
  });

  it('should process a webapp.log log file correctly', () => {
    const file: UnzippedFile = {
      fullPath: path.join(__dirname, '../static/webapp.log'),
      fileName: 'webapp.log',
      size: 1713
    };

    return processLogFile(file).then((result) => {
      expect(result).to.exist;
      expect(result.logFile).to.exist;
      expect(result.logEntries).to.exist;
      expect(result.logEntries.length).to.be.equal(6);
      expect(result.logEntries[3]).to.exist;
      expect(result.logEntries[3].timestamp).to.be.equal('2017/2/22 16:02:37.178');
      expect(result.logEntries[3].message).to.be.equal('didStartLoading called TSSSB.timeout_tim set for ms:60000');
      expect(result.logEntries[3].logType).to.be.equal('webapp');
      expect(result.logEntries[3].index).to.be.equal(3);
      expect(result.logType).to.exist;
      expect(result.type).to.exist;
    });
  });
});

describe('getTypesForFiles', () => {
  it('should read an array of log files and return a sorting', () => {
    const files = [{
      fileName: 'browser.log',
      fullPath: '_',
      size: 0
    }, {
      fileName: 'renderer-1.log',
      fullPath: '_',
      size: 0
    }, {
      fileName: 'renderer-2.log',
      fullPath: '_',
      size: 0
    }, {
      fileName: 'webapp.log',
      fullPath: '_',
      size: 0
    }, {
      fileName: 'renderer-webapp-123-preload.log',
      fullPath: '_',
      size: 0
    }, {
      fileName: 'slack-teams.log',
      fullPath: '_',
      size: 0
    }, {
      fileName: 'gpu-log.html',
      fullPath: '_',
      size: 0
    }, {
      fileName: 'notification-warnings.json',
      fullPath: '_',
      size: 0
    }];

    const result = getTypesForFiles(files as UnzippedFiles);
    expect(result).to.exist;
    expect(result.browser.length).to.be.equal(1);
    expect(result.renderer.length).to.be.equal(2);
    expect(result.webapp.length).to.be.equal(1);
    expect(result.preload.length).to.be.equal(1);
    expect(result.state.length).to.be.equal(3);
  });
});

describe('getTypeForFile', () => {
  it('should get the type for browser log files', () => {
    expect(getTypeForFile({ fileName: 'browser.log', fullPath: '_', size: 0 })).to.be.equal('browser');
  });

  it('should get the type for renderer log files', () => {
    expect(getTypeForFile({ fileName: 'renderer-12.log', fullPath: '_', size: 0 })).to.be.equal('renderer');
  });

  it('should get the type for webapp log files', () => {
    expect(getTypeForFile({ fileName: 'webapp-4.log', fullPath: '_', size: 0 })).to.be.equal('webapp');
  });

  it('should get the type for preload log files', () => {
    expect(getTypeForFile({ fileName: 'renderer-webapp-44-preload.log', fullPath: '_', size: 0 })).to.be.equal('preload');
  });
});

describe('mergeLogFiles', () => {
  it('should merge two logfiles together', () => {
    const files = [ mockBrowserFile1, mockBrowserFile2 ];

    return mergeLogFiles(files, 'browser').then((result) => {
      expect(result).to.exist;
      expect(result.type).to.be.equal('MergedLogFile');
      expect(result.logEntries.length).to.be.equal(6);

      const indeces = result.logEntries.map((entry) => entry.index);
      expect(indeces).to.be.deep.equal([0, 1, 0, 2, 1, 2]);
    });
  });
});
