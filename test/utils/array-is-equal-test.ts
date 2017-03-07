import { expect } from 'chai';
import { isEqualArrays } from '../../src/utils/array-is-equal';

describe('isEqualArray', () => {
  it('should consider two arrays with the same content equal', () => {
    const a = [1, 2, 'f'];
    const b = [1, 2, 'f'];

    expect(isEqualArrays(a, b)).to.be.ok;
  });

  it('should consider same reference of array to equal', () => {
    const a = [1, 2, 'x'];

    expect(isEqualArrays(a, a)).to.be.ok;
  });

  it('should consider two arrays without same content not equal', () => {
    const a = [1, 2, 3];
    const b = [1, 2, 4];

    expect(isEqualArrays(a, b)).to.be.false;
  });
});
