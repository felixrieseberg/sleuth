import { expect } from 'chai';
import { shouldIgnoreFile } from '../../src/utils/should-ignore-file';

describe('shouldIgnoreFile', () => {
  it('should ignore .DS_Store', () => {
    expect(shouldIgnoreFile('.DS_Store')).to.be.ok;
  });

  it('should not ignore rando file', () => {
    expect(shouldIgnoreFile('hiitme')).to.be.false;
  });
});
