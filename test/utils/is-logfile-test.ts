import { mockBrowserFile1 } from '../__mocks__/processed-log-file';
import { fakeUnzippedFile } from '../__mocks__/unzipped-file';
import { fakeMergedFile } from '../__mocks__/merged-log-file';
import { expect } from 'chai';
import { isLogFile, isMergedLogFile, isProcessedLogFile, isUnzippedFile } from '../../src/utils/is-logfile';

describe('isMergedLogFile', () => {
  it('should identify a merged log file', () => {
    expect(isMergedLogFile(fakeMergedFile)).to.be.true;
  });

  it('should not identify an unzipped file', () => {
    expect(isMergedLogFile(fakeUnzippedFile)).to.be.false;
  });

  it('should not identify a processed log file', () => {
    expect(isMergedLogFile(mockBrowserFile1)).to.be.false;
  });
});

describe('isProcessedLogFile', () => {
  it('should identify a processed log file', () => {
    expect(isProcessedLogFile(mockBrowserFile1)).to.be.true;
  });

  it('should not identify an unzipped file', () => {
    expect(isProcessedLogFile(fakeUnzippedFile)).to.be.false;
  });

  it('should not identify a merged log file', () => {
    expect(isProcessedLogFile(fakeMergedFile)).to.be.false;
  });
});

describe('isUnzippedFile', () => {
  it('should identify a unzipped log file', () => {
    expect(isUnzippedFile(fakeUnzippedFile)).to.be.true;
  });

  it('should not identify an processed file', () => {
    expect(isUnzippedFile(mockBrowserFile1)).to.be.false;
  });

  it('should not identify a merged log file', () => {
    expect(isUnzippedFile(fakeMergedFile)).to.be.false;
  });
});

describe('isLogFile', () => {
  it('should not identify a unzipped log file', () => {
    expect(isLogFile(fakeUnzippedFile)).to.be.false;
  });

  it('should identify a processed log file', () => {
    expect(isLogFile(mockBrowserFile1)).to.be.true;
  });

  it('should identify a merged log file', () => {
    expect(isLogFile(fakeMergedFile)).to.be.true;
  });
});
