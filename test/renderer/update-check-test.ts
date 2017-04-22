import { expect } from 'chai';
import { getUpdateAvailable } from '../../src/renderer/update-check';
import * as http from 'http';

let server: http.Server | undefined;
let toServe: string = '';

describe('Update-Check', () => {
  beforeAll(() => {
    server = http.createServer((_req, res) => {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(toServe);
    });

    server.listen(8881);
  });

  afterAll(() => {
    if (server) server.close();
  });

  it('should return false if the latest is equal to the current version', () => {
    toServe = '{ "latest": "2.0.0" }';

    return getUpdateAvailable({
      checkUpdate: 'http://localhost:8881/',
      downloadUpdate: ''
    }, '2.0.0').then((result) => expect(result).to.be.false);
  });

  it('should return false if the latest is below to the current version', () => {
    toServe = '{ "latest": "0.2.0" }';

    return getUpdateAvailable({
      checkUpdate: 'http://localhost:8881/',
      downloadUpdate: ''
    }, '2.0.0').then((result) => expect(result).to.be.false);
  });

  it('should return "2.0.0" if the latest is above to the current version', () => {
    toServe = '{ "latest": "2.0.0" }';

    return getUpdateAvailable({
      checkUpdate: 'http://localhost:8881/',
      downloadUpdate: ''
    }, '0.0.1').then((result) => expect(result).to.be.equal('2.0.0'));
  });
});
