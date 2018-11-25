import { UnzippedFile } from '../unzip';
import { LevelFilter, LogEntry, MergedLogFile, ProcessedLogFile, DateRange } from '../interfaces';
import { observable, action, autorun } from 'mobx';

export const defaults = {
  dateTimeFormat: 'HH:mm:ss (DD/MM)',
  defaultEditor: 'code --goto {filepath}:{line}',
  font: process.platform === 'darwin' ? 'San Francisco' : 'Segoe UI',
  isDarkMode: true
};

export class SleuthState {
  @observable public slackUserId?: string;
  @observable public isCooperSignedIn = false;
  @observable public selectedEntry?: LogEntry;
  @observable public source?: string;
  @observable.ref public selectedLogFile?: ProcessedLogFile | MergedLogFile | UnzippedFile;

  @observable public levelFilter: LevelFilter = {
    debug: false,
    error: false,
    info: false,
    warn: false
  };

  @observable public searchIndex: number = 0;
  @observable public search: string = '';

  @observable public webAppLogsWarningDismissed: boolean = false;
  @observable public opened: number = 0;
  @observable public dateRange: DateRange = { from: undefined, to: undefined };
  @observable public showOnlySearchResults: boolean = false;
  @observable public isDetailsVisible: boolean = false;
  @observable public isSidebarOpen: boolean = true;

  // Settings
  @observable public isDarkMode: boolean = !!this.retrieve('isDarkMode', true);
  @observable public dateTimeFormat: string = this.retrieve<string>('dateTimeFormat', false)!;
  @observable public font: string = this.retrieve<string>('font', false)!;
  @observable public defaultEditor: string = this.retrieve<string>('defaultEditor', false)!;

  constructor() {
    // Setup autoruns
    autorun(() => this.save('dateTimeFormat', this.dateTimeFormat));
    autorun(() => this.save('font', this.font));
    autorun(() => this.save('defaultEditor', this.defaultEditor));
    autorun(() => {
      this.save('isDarkMode', this.isDarkMode);

      if (this.isDarkMode) {
        document.body.classList.add('bp3-dark');
      } else {
        document.body.classList.remove('bp3-dark');
      }
    });
  }

  @action
  public setSource(source: string) {
    this.source = source;
  }

  @action
  public toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
  }

  @action
  public toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Save a key/value to localStorage.
   *
   * @param {string} key
   * @param {(string | number | object)} [value]
   */
  private save(key: string, value?: string | number | object | null | boolean) {
    if (value) {
      const _value = typeof value === 'object'
        ? JSON.stringify(value)
        : value.toString();

      localStorage.setItem(key, _value);
    } else {
      localStorage.removeItem(key);
    }
  }

  /**
   * Fetch data from localStorage.
   *
   * @template T
   * @param {string} key
   * @param {boolean} parse
   * @returns {(T | string | null)}
   */
  private retrieve<T>(
    key: string, parse: boolean
  ): T | string | null {
    const value = localStorage.getItem(key);

    if (parse) {
      return JSON.parse(value || 'null') as T;
    }

    if (value === null && defaults[key]) {
      return defaults[key];
    }

    return value;
  }
}

export const sleuthState = new SleuthState();

/**
 * Resets the state between different files. User data is retained.
 */
export function resetState() {
  sleuthState.selectedEntry = undefined;
  sleuthState.selectedLogFile = undefined;
  sleuthState.levelFilter.debug = false;
  sleuthState.levelFilter.error = false;
  sleuthState.levelFilter.info = false;
  sleuthState.levelFilter.warn = false;
  sleuthState.searchIndex = 0;
  sleuthState.showOnlySearchResults = false;
  sleuthState.isDetailsVisible = false;
  sleuthState.dateRange = { from: undefined, to: undefined };
}
