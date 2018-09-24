import { UnzippedFile } from '../unzip';
import { LevelFilter, LogEntry, MergedLogFile, ProcessedLogFile } from '../interfaces';
import { observable } from 'mobx';
import { defaults } from '../components/preferences';

export class SleuthState {
  @observable public slackUserId?: string;
  @observable public isCooperSignedIn = false;
  @observable public selectedEntry?: LogEntry;
  @observable.ref public selectedLogFile?: ProcessedLogFile | MergedLogFile | UnzippedFile;

  @observable public levelFilter: LevelFilter = {
    debug: false,
    error: false,
    info: false,
    warn: false
  };
  @observable public searchIndex: number = 0;
  @observable public search: string = '';
  @observable public dateFrom: undefined | Date;
  @observable public dateTo: undefined | Date;
  @observable public showOnlySearchResults: boolean = false;
  @observable public isDetailsVisible: boolean = false;
  @observable public dateTimeFormat: string = localStorage.getItem('dateTimeFormat') || defaults.dateTimeFormat;
  @observable public font: string = localStorage.getItem('font') || defaults.font;
  @observable public defaultEditor: string = localStorage.getItem('defaultEditor') || defaults.defaultEditor;
  @observable public webAppLogsWarningDismissed: boolean = false;

  @observable public opened: number = 0;
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
  sleuthState.dateFrom = undefined;
  sleuthState.dateTo = undefined;
}
