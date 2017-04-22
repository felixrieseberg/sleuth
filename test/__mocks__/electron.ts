import * as path from 'path';

const ipcRenderer = {
  send: jest.fn()
};

const app = {
  getPath(target: string) {
    if (target === 'downloads') {
      return path.join(__dirname, '../static/');
    }

    return __dirname;
  }
}

const remote = {
  app
};

module.exports = { ipcRenderer, remote };
