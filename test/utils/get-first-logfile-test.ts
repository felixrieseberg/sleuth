import { fakeUnzippedFile } from '../__mocks__/unzipped-file';
import { ProcessedLogFile, ProcessedLogFiles } from '../../src/renderer/interfaces';
import { expect } from 'chai';
import { getFirstLogFile } from '../../src/utils/get-first-logfile';


const fakeFile: ProcessedLogFile = {
  logEntries: [],
  logFile: fakeUnzippedFile,
  logType: 'browser',
  type: 'ProcessedLogFile'
};

const files: ProcessedLogFiles = {
  browser: [],
  renderer: [],
  call: [],
  webapp: [],
  webview: [],
  state: []
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
    fakeFile.logType = 'browser';
    files.browser = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });

  it('should return the first logfile (renderer if available)', () => {
    fakeFile.logType = 'renderer';
    files.renderer = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });

  it('should return the first logfile (call if available)', () => {
    fakeFile.logType = 'call';
    files.call = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });

  it('should return the first logfile (webapp if available)', () => {
    fakeFile.logType = 'webapp';
    files.webapp = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });

  it('should return the first logfile (webview if available)', () => {
    fakeFile.logType = 'webview';
    files.webview = [fakeFile];

    expect(getFirstLogFile(files)).to.be.deep.equal(fakeFile);
  });
});
