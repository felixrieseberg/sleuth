import { expect } from 'chai';
import { didFilterChange } from '../../src/utils/did-filter-change';

describe('didFilterChange', () => {
  it('should consider a changed filter changed', () => {
    const a = {
      debug: true,
      error: true,
      warn: true,
      info: true
    };

    const b = {
      debug: true,
      error: true,
      warn: true,
      info: false
    };

    expect(didFilterChange(a, b)).to.be.true;
  });

  it('should consider an unchanged filter unchanged', () => {
    const a = {
      debug: true,
      error: true,
      warn: true,
      info: true
    };

    const b = {
      debug: true,
      error: true,
      warn: true,
      info: true
    };

    expect(didFilterChange(a, b)).to.be.false;
  });
});
