import * as defaultMenu from 'electron-default-menu';
import { remote } from 'electron';

const { Menu, shell, app } = remote;

export class AppMenu {
  private menu: Array<any> | null = null;

  constructor() {
    this.setupMenu();
  }

  public setupMenu() {
    this.menu = defaultMenu(app, shell) as Array<any>;

    const preferencesItem = {
      label: 'Preferences',
      accelerator: 'CmdOrCtrl+,',
      click: () => remote.getCurrentWebContents().send('preferences-show')
    };

    const fileMenu = {
      label: 'File',
      submenu: [ preferencesItem ]
    };

    if (process.platform === 'darwin') {
      (this.menu[0].submenu as Array<any>).splice(1, 0, preferencesItem);
    } else {
      this.menu.splice(0, 1, fileMenu);
    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(this.menu));
  }
}
