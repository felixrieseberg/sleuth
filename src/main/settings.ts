import { app } from 'electron';

import * as path from 'path';
import fs from 'fs-extra';
import throttle from 'lodash.throttle';

export class SettingsFileManager {
  private _settings: Record<string, any> = this.getSettings();
  private _lastSaveSettings: Record<string, any>;
  private saveSettings: () => void;
  public settingsFilePath: string;

  constructor() {
    this.getSettings = this.getSettings.bind(this);

    this.saveSettings = throttle(this._saveSettings.bind(this), 1000, { trailing: true });
  }

  public async getItem(key: string) {
    return (this.getSettings())[key];
  }

  /**
   * To keep things simple, this method will only be called in response
   * to an IPC event. Only the renderer should change settings.
   *
   * @param {string} key
   * @param {*} value
   */
  public async setItem(key: string, value: any) {
    console.log(`Settings: Setting preference`, { key, value });

    this._settings[key] = value;
    this.saveSettings();
  }

  private getSettings(): Record<string, any> {
    if (this._settings) {
      return this._settings;
    }

    let settings;

    this.settingsFilePath = path.join(app.getPath('userData'), 'settings.json');

    try {
      settings = fs.readJSONSync(this.settingsFilePath);
    } catch (error) {
      settings = {};
    }

    console.log(`Settings: Loaded`, {
      filePath: this.settingsFilePath,
      settings
    });

    this._lastSaveSettings = { ...settings };
    return this._settings = { ...settings };
  }

  private async _saveSettings(): Promise<void> {
    const settings = this.getSettings();

    // Don't touch the disk unless we have to
    const before = JSON.stringify(this._lastSaveSettings);
    const after = JSON.stringify(settings);
    if (this._lastSaveSettings && before === after) {
      console.log(`Settings: Not writing, no changes`, { before, after });
      return;
    }

    console.log(`Settings: Saving`, {
      filePath: this.settingsFilePath,
      settings
    });

    await fs.writeFile(this.settingsFilePath, after);

    this._lastSaveSettings = { ...settings };
  }
}

export const settingsFileManager = new SettingsFileManager();
