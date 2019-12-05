import { observable, action, autorun } from 'mobx';
import { ipcRenderer } from 'electron';

import { UnzippedFile } from '../unzip';
import { LevelFilter, LogEntry, MergedLogFile, ProcessedLogFile, DateRange, Suggestions } from '../interfaces';
import { getItemsInSuggestionFolders } from '../suggestions';
import { testDateTimeFormat } from '../../utils/test-date-time';
import { SORT_DIRECTION } from '../components/log-table-constants';

export const defaults = {
  dateTimeFormat: 'HH:mm:ss (dd/MM)',
  defaultEditor: 'code --goto {filepath}:{line}',
  font: process.platform === 'darwin' ? 'San Francisco' : 'Segoe UI',
  isDarkMode: true,
  isOpenMostRecent: false,
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

  @observable public suggestions: Suggestions = [];
  @observable public searchIndex: number = 0;
  @observable public search: string = '';

  @observable public webAppLogsWarningDismissed: boolean = false;
  @observable public opened: number = 0;
  @observable public dateRange: DateRange = { from: undefined, to: undefined };
  @observable public showOnlySearchResults: boolean = false;
  @observable public isDetailsVisible: boolean = false;
  @observable public isSidebarOpen: boolean = true;
  @observable public isSpotlightOpen: boolean = false;

  // Settings
  @observable public isDarkMode: boolean = !!this.retrieve('isDarkMode', true);
  @observable public isOpenMostRecent: boolean = !!this.retrieve<boolean>('isOpenMostRecent', true);
  @observable public dateTimeFormat: string
    = testDateTimeFormat(this.retrieve<string>('dateTimeFormat_v3', false)!, defaults.dateTimeFormat);
  @observable public font: string = this.retrieve<string>('font', false)!;
  @observable public defaultEditor: string = this.retrieve<string>('defaultEditor', false)!;
  @observable public defaultSort: SORT_DIRECTION = this.retrieve('defaultSort', false) as SORT_DIRECTION || SORT_DIRECTION.DESC;

  // Internal setting
  private didOpenMostRecent = false;

  constructor(
    public readonly openFile: (file: string) => void,
    public readonly resetApp: () => void
  ) {
    this.getSuggestions();

    // Setup autoruns
    autorun(() => this.save('dateTimeFormat_v3', this.dateTimeFormat));
    autorun(() => this.save('font', this.font));
    autorun(() => this.save('isOpenMostRecent', this.isOpenMostRecent));
    autorun(() => this.save('defaultEditor', this.defaultEditor));
    autorun(() => this.save('defaultSort', this.defaultSort));
    autorun(() => {
      this.save('isDarkMode', this.isDarkMode);

      if (this.isDarkMode) {
        document.body.classList.add('bp3-dark');
      } else {
        document.body.classList.remove('bp3-dark');
      }
    });
    autorun(() => {
      if (this.isSidebarOpen) {
        document.body.classList.add('SidebarOpen');
      } else {
        document.body.classList.remove('SidebarOpen');
      }
    });

    this.reset = this.reset.bind(this);
    this.toggleDarkMode = this.toggleDarkMode.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.toggleSpotlight = this.toggleSpotlight.bind(this);

    ipcRenderer.on('spotlight', this.toggleSpotlight);
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

  @action
  public toggleSpotlight() {
    this.isSpotlightOpen = !this.isSpotlightOpen;
  }

  @action
  public async getSuggestions() {
    this.suggestions = await getItemsInSuggestionFolders();

    // This is a side effect. There's probably a better
    // place for it, since we only want to run it once,
    // but here we are.
    this.openMostRecentSuggestionMaybe();
  }

  @action
  public openMostRecentSuggestionMaybe() {
    if (!this.isOpenMostRecent || this.didOpenMostRecent) return;

    const keys = Object.keys(this.suggestions);

    if (keys.length === 0) return;

    let mostRecentStats = this.suggestions[keys[0]];
    let mostRecentFilePath = keys[0];

    for (const filePath of keys) {
      const stats = this.suggestions[filePath];

      if (stats.mtimeMs > mostRecentStats.mtimeMs) {
        mostRecentFilePath = filePath;
        mostRecentStats = stats;
      }
    }

    this.didOpenMostRecent = true;
    this.openFile(mostRecentFilePath);
  }

  @action
  public reset(goBackToHome: boolean = false) {
    this.selectedEntry = undefined;
    this.selectedLogFile = undefined;
    this.levelFilter.debug = false;
    this.levelFilter.error = false;
    this.levelFilter.info = false;
    this.levelFilter.warn = false;
    this.searchIndex = 0;
    this.showOnlySearchResults = false;
    this.isSpotlightOpen = false;
    this.isDetailsVisible = false;
    this.dateRange = { from: undefined, to: undefined };

    if (goBackToHome) {
      this.resetApp();
    }
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
