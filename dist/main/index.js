process.env.HMR_PORT=0;process.env.HMR_HOSTNAME="localhost";// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"5HGl":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.config = {
  cooperUrl: 'https://desktop-build-bot.herokuapp.com',
  teamName: 'tinyspeck',
  isDevMode: process.execPath.match(/[\\/]electron/)
};
},{}],"GEXs":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const electron_1 = require("electron");

class IpcManager {
  constructor() {
    this.setupFileDrop();
    this.setupProcessingStatus();
  }

  openFile(path) {
    this.getMainWindow().webContents.send('file-dropped', path);
  }

  setupProcessingStatus() {
    electron_1.ipcMain.on('processing-status', (_event, status) => {
      this.getMainWindow().webContents.send('processing-status', status);
    });
  }

  getMainWindow() {
    const allWindows = electron_1.BrowserWindow.getAllWindows();

    if (allWindows && allWindows.length > 0) {
      return allWindows[0];
    } else {
      throw new Error('Could not find window!');
    }
  }

  setupFileDrop() {
    this.getMainWindow().webContents.on('will-navigate', (e, url) => {
      e.preventDefault();

      if (!url.startsWith('file:///')) {
        electron_1.shell.openExternal(url);
      } else {
        this.openFile(decodeURIComponent(url.replace('file:///', '/')));
      }
    });
  }

}

exports.IpcManager = IpcManager;
},{}],"+n2K":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const electron_1 = require("electron");

const url_1 = require("url"); // tslint:disable:no-console

/**
 * Attempts to secure the app by disallowing things we do
 * not need.
 *
 * @export
 */


function secureApp() {
  electron_1.app.on('web-contents-created', (_event, webContents) => {
    // Disallow navigation
    webContents.on('will-navigate', (event, url) => {
      const parsedUrl = new url_1.URL(url);
      const isSlack = parsedUrl.hostname.endsWith('slack.com');
      const isOkta = parsedUrl.hostname.endsWith('okta.com');
      const isFile = parsedUrl.protocol === 'file';

      if (!isSlack && !isOkta && !isFile) {
        console.warn(`Prevented navigation to ${url}`);
        console.log(`Hostname: ${parsedUrl.hostname}`);
        event.preventDefault();
      }
    }); // Disallow new-window

    webContents.on('new-window', (event, url) => {
      console.warn(`Prevented new-window for ${url}`);
      event.preventDefault();
    });
  });
}

exports.secureApp = secureApp; // tslint:enable:no-console
},{}],"7QCb":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const tslib_1 = require("tslib");

const electron_1 = require("electron");

const electron_devtools_installer_1 = tslib_1.__importStar(require("electron-devtools-installer"));

const config_1 = require("../config");

const ipc_1 = require("./ipc");

const security_1 = require("./security"); // Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.


let mainWindow;
let ipcManager;

if (require('electron-squirrel-startup')) {// No-op, we're done here
} else {
  const createWindow = async () => {
    const windowStateKeeper = require('electron-window-state');

    require('electron-context-menu')();

    const mainWindowState = windowStateKeeper({
      defaultWidth: 1200,
      defaultHeight: 800
    }); // Create the browser window.

    mainWindow = new electron_1.BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      show: !!config_1.config.isDevMode,
      minHeight: 500,
      minWidth: 1000,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : undefined,
      webPreferences: {
        webviewTag: false
      }
    });
    mainWindowState.manage(mainWindow); // and load the index.html of the app.

    mainWindow.loadFile('./dist/index.html'); // Open the DevTools.

    if (config_1.config.isDevMode) {
      await electron_devtools_installer_1.default(electron_devtools_installer_1.REACT_DEVELOPER_TOOLS);
      mainWindow.webContents.openDevTools();
    } // Emitted when the window is closed.


    mainWindow.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });
    ipcManager = new ipc_1.IpcManager();
  }; // Whenever the app has finished launching


  electron_1.app.on('will-finish-launching', () => {
    electron_1.app.on('open-file', (event, path) => {
      event.preventDefault();

      function openWhenReady() {
        if (ipcManager) {
          ipcManager.openFile(path);
        } else {
          setTimeout(openWhenReady, 500);
        }
      }

      openWhenReady();
    });
  }); // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.

  electron_1.app.on('ready', () => {
    security_1.secureApp();
    createWindow();
  }); // Quit when all windows are closed.

  electron_1.app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      electron_1.app.quit();
    }
  });
  electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow();
    }
  });
}
},{"../config":"5HGl","./ipc":"GEXs","./security":"+n2K"}]},{},["7QCb"], null)
//# sourceMappingURL=/index.map