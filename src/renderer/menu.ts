import * as defaultMenu from 'electron-default-menu';
import { remote } from 'electron';

import * as fs from 'fs-extra';
import * as path from 'path';

const { Menu, shell, app, dialog } = remote;

const debug = require('debug')('sleuth:menu');

export class AppMenu {
  private menu: Array<any> | null = null;
  private webContents = remote.getCurrentWebContents();

  constructor() {
    this.setupMenu();
  }

  /**
   * Returns a MenuItemOption for a given Slack logs location.
   *
   * @param {('' | 'DevEnv' | 'DevMode')} [type='']
   * @returns {Electron.MenuItemOptions}
   */
  public getOpenItem(type: '' | 'DevEnv' | 'DevMode' = ''): Electron.MenuItemOptions {
    const appData = app.getPath('appData');
    const logsPath = path.join(appData, `Slack${type}`, 'logs');

    return {
      label: `Open local Slack${type} logs...`,
      click: () => {
        fs.readdir(logsPath).then((results) => {
          if (results) return this.webContents.send('file-dropped', logsPath);
          dialog.showMessageBox({
            type: 'error',
            title: 'Could not find local Slack logs',
            message: `We attempted to find your local Slack's logs, but we couldn't find them. We checked for them in ${logsPath}.`
          });
        }).catch((err) => debug(`Tried to open local Slack logs folder, but failed`, err));
      }
    };
  }

  /**
   * Checks what kind of Slack logs are locally available and returns an array
   * with appropriate items.
   *
   * @returns {Array<Electron.MenuItemOptions>}
   */
  public getOpenItems(): Array<Electron.MenuItemOptions> {
    const appData = app.getPath('appData');
    const productionLogs = path.join(appData, `Slack`, 'logs');
    const devEnvLogs = path.join(appData, `SlackDevEnv`, 'logs');
    const devModeLogs = path.join(appData, `SlackDevMode`, 'logs');

    const productionLogsExist = !!fs.statSyncNoException(productionLogs);
    const devEnvLogsExist = !!fs.statSyncNoException(devEnvLogs);
    const devModeLogsExist = !!fs.statSyncNoException(devModeLogs);

    const handleFilePaths = (filePaths: Array<string>) => {
      if (filePaths && filePaths.length > 0) {
        this.webContents.send('file-dropped', filePaths[0]);
      }
    };

    const openItem = {
      label: 'Open...',
      acccelerator: 'CmdOrCtrl+O',
      click: () => {
        dialog.showOpenDialog({
          defaultPath: app.getPath('downloads'),
          filters: [ { name: 'zip', extensions: [ 'zip' ] } ],
          properties: [ 'openFile', 'openDirectory', 'showHiddenFiles' ],
        }, handleFilePaths);
      }
    };

    const openItems: Array<Electron.MenuItemOptions> = [ openItem ];

    // Windows and Linux don't understand combo dialogs
    if (process.platform !== 'darwin') {
      openItem.label = 'Open Folder...';

      // Make a new one
      const openFile = {
        label: 'Open File...',
        acccelerator: 'CmdOrCtrl+Shift+O',
        click: () => {
          dialog.showOpenDialog({
            defaultPath: app.getPath('downloads'),
            filters: [ { name: 'zip', extensions: [ 'zip' ] } ],
            properties: [ 'openFile', 'showHiddenFiles' ],
          }, handleFilePaths);
        }
      };

      openItems.push(openFile);
    }

    if (productionLogsExist || devEnvLogsExist || devModeLogsExist) openItems.push({ type: 'separator' });
    if (productionLogsExist) openItems.push(this.getOpenItem());
    if (devEnvLogsExist) openItems.push(this.getOpenItem('DevEnv'));
    if (devModeLogsExist) openItems.push(this.getOpenItem('DevMode'));

    return openItems;
  }

  /**
   * Actually creates the menu.
   */
  public setupMenu() {
    this.menu = defaultMenu(app, shell) as Array<any>;

    const preferencesItem = {
      label: 'Preferences',
      accelerator: 'CmdOrCtrl+,',
      click: () => this.webContents.send('preferences-show')
    };

    if (process.platform === 'darwin') {
      (this.menu[0].submenu as Array<any>).splice(1, 0, preferencesItem);
      this.menu.splice(1, 0, { label: 'File', submenu: this.getOpenItems() });
    } else {
      this.menu.splice(0, 1, { label: 'File', submenu: [ ...this.getOpenItems(), preferencesItem ] });
    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(this.menu));
  }
}
