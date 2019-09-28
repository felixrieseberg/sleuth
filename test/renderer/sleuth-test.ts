import { expect } from 'chai';
import { getSleuth } from '../../src/renderer/sleuth';

describe('getSleuth', () => {
  it('should return a Sleuth 🕵', () => {
    expect(getSleuth()).to.be.not.empty;
    expect(getSleuth()).to.be.not.null;
    expect(getSleuth()).to.be.not.false;
  });

  it('should return a Sleuth 🕵 (win32, 8)', () => {
    expect(getSleuth('win32', '8')).to.be.not.empty;
    expect(getSleuth('win32', '8')).to.be.not.null;
    expect(getSleuth('win32', '8')).to.be.not.false;
  });

  it('should return a Sleuth 🕵 (win32, 10)', () => {
    expect(getSleuth('win32', '10.0')).to.be.not.empty;
    expect(getSleuth('win32', '10.0')).to.be.not.null;
    expect(getSleuth('win32', '10.0')).to.be.not.false;
  });

  it('should return a Sleuth 🕵 (darwin)', () => {
    expect(getSleuth('darwin')).to.be.not.empty;
    expect(getSleuth('darwin')).to.be.not.null;
    expect(getSleuth('darwin')).to.be.not.false;
  });
});