import defaultMenu from 'electron-default-menu';
import { remote } from 'electron';

import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp';
import { promisify } from 'util';

const { Menu, shell, app, dialog } = remote;

const debug = require('debug')('sleuth:menu');

export class AppMenu {
  private productionLogs: string;
  private devEnvLogs: string;
  private devModeLogs: string;
  private productionLogsExist: boolean;
  private devEnvLogsExist: boolean;
  private devModeLogsExist: boolean;
  private menu: Array<any> | null = null;
  private webContents = remote.getCurrentWebContents();

  constructor() {
    const appData = app.getPath('appData');

    this.productionLogs = path.join(appData, `Slack`, 'logs');
    this.devEnvLogs = path.join(appData, `SlackDevEnv`, 'logs');
    this.devModeLogs = path.join(appData, `SlackDevMode`, 'logs');
    this.productionLogsExist = fs.existsSync(this.productionLogs);
    this.devEnvLogsExist = fs.existsSync(this.devEnvLogs);
    this.devModeLogsExist = fs.existsSync(this.devModeLogs);

    this.setupMenu();
  }

  /**`
   * Returns a MenuItemOption for a given Slack logs location.
   *
   * @param {('' | 'DevEnv' | 'DevMode')} [type='']
   * @returns {Electron.MenuItemOptions}
   */
  public getOpenItem(type: '' | 'DevEnv' | 'DevMode' = ''): Electron.MenuItemConstructorOptions {
    const appData = app.getPath('appData');
    const logsPath = path.join(appData, `Slack${type}`, 'logs');
    const storagePath = path.join(appData, `Slack${type}`, 'storage');

    return {
      label: `Open local Slack${type} logs...`,
      click: async () => {
        let files: Array<string> = [];

        try {
          files = await fs.readdir(logsPath);
        } catch (error) {
          debug(`Tried to read logs directory, but failed`, { error });
        }

        if (files && files.length > 0) {
          const tmpdir = await promisify(tmp.dir)({ unsafeCleanup: true });

          await fs.copy(logsPath, tmpdir);
          await fs.copy(storagePath, tmpdir);

          this.webContents.send('file-dropped', tmpdir);
        } else {
          dialog.showMessageBox({
            type: 'error',
            title: 'Could not find local Slack logs',
            message: `We attempted to find your local Slack's logs, but we couldn't find them. We checked for them in ${logsPath}.`
          });
        }
      }
    };
  }

  /**
   * Checks what kind of Slack logs are locally available and returns an array
   * with appropriate items.
   *
   * @returns {Array<Electron.MenuItemOptions>}
   */
  public getOpenItems(): Array<Electron.MenuItemConstructorOptions> {
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

    const openItems: Array<Electron.MenuItemConstructorOptions> = [ openItem ];

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

    if (this.productionLogsExist || this.devEnvLogsExist || this.devModeLogsExist) {
      openItems.push({ type: 'separator' });
    }

    if (this.productionLogsExist) openItems.push(this.getOpenItem());
    if (this.devEnvLogsExist) openItems.push(this.getOpenItem('DevEnv'));
    if (this.devModeLogsExist) openItems.push(this.getOpenItem('DevMode'));

    return openItems;
  }

  /**
   * Get "Prune ..." items
   */
  public getPruneItems(): Array<Electron.MenuItemConstructorOptions> {
    const getPruneItem = (name: string, targetPath: string) => ({
      label: `Prune ${name}`,
      click: async () => {
        try {
          fs.emptyDir(targetPath);
        } catch (error) {
          dialog.showMessageBox({
            type: 'error',
            title: 'Could not prune logs',
            message: `We attempted to prune logs at ${targetPath}, but failed with the following error: "${error}".`
          });
        }
      }
    });

    const result = [];

    if (this.productionLogsExist) {
      result.push(getPruneItem('Slack Logs (Production)', this.productionLogs));
    }

    if (this.devModeLogsExist) {
      result.push(getPruneItem('Slack Logs (DevMode)', this.devModeLogs));
    }

    if (this.devEnvLogsExist) {
      result.push(getPruneItem('Slack Logs (DevEnv)', this.devEnvLogs));
    }

    return result;
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

    this.menu.push({
      label: 'Utilities',
      submenu: this.getPruneItems()
    });

    Menu.setApplicationMenu(Menu.buildFromTemplate(this.menu));
  }
}
