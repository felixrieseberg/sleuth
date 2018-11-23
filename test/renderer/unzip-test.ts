import { expect } from 'chai';
import { Unzipper } from '../../src/renderer/unzip';
import path from 'path';

describe('Unzipper', () => {
  it('should read a simple zip file', () => {
    const simple = path.join(__dirname, '../static/simple.zip');
    const unzipper = new Unzipper(simple);

    return unzipper.open()
      .then(() => unzipper.unzip())
      .then((files) => {
        expect(files.length).to.be.equal(2);
        return unzipper.clean();
      });
  });

  it('should read a simple zip file with folders', () => {
    const simple = path.join(__dirname, '../static/simple-with-folders.zip');
    const unzipper = new Unzipper(simple);

    return unzipper.open()
      .then(() => unzipper.unzip())
      .then((files) => {
        expect(files.length).to.be.equal(3);
        return unzipper.clean();
      });
  });
});
