import { fakeUnzippedFile } from '../__mocks__/unzipped-file';
import { ProcessedLogFile, ProcessedLogFiles, LogType } from '../../src/renderer/interfaces';
import { expect } from 'chai';
import { getFirstLogFile } from '../../src/utils/get-first-logfile';


const fakeFile: ProcessedLogFile = {
  logEntries: [],
  logFile: fakeUnzippedFile,
  logType: LogType.BROWSER,
  type: 'ProcessedLogFile',
  levelCounts: {}
};

const files: ProcessedLogFiles = {
  browser: [],
  renderer: [],
  call: [],
  webapp: [],
  preload: [],
  state: [],
  netlog: [],
  installer: []
};

describe('getFirstLogFile', () => {
  afterEach(() => {
    files.browser = [];
    files.renderer = [];
    files.call = [];
    files.webapp = [];
    files.state = [];
  });

  it('should return the first logfile (browser if available)', () => {
    fakeFile.logType = LogType.BROWSER;
    files.browser = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });

  it('should return the first logfile (renderer if available)', () => {
    fakeFile.logType = LogType.RENDERER;
    files.renderer = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });

  it('should return the first logfile (call if available)', () => {
    fakeFile.logType = LogType.CALL;
    files.call = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });

  it('should return the first logfile (webapp if available)', () => {
    fakeFile.logType = LogType.WEBAPP;
    files.webapp = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });

  it('should return the first logfile (preload if available)', () => {
    fakeFile.logType = LogType.PRELOAD;
    files.preload = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });
});
