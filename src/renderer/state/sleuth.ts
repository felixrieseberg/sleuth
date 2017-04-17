import { UnzippedFile } from '../unzip';
import { LevelFilter, LogEntry, MergedLogFile, ProcessedLogFile } from '../interfaces';
import { observable } from 'mobx';

export const defaults = {
  dateTimeFormat: 'HH:mm:ss (DD/MM)'
};

export class SleuthState {
    @observable public isCooperSignedIn = false;
    @observable public selectedEntry: LogEntry;
    @observable public selectedLogFile?: ProcessedLogFile | MergedLogFile;
    @observable public selectedStateFile?: UnzippedFile;

    @observable public levelFilter: LevelFilter = {
        debug: false,
        error: false,
        info: false,
        warning: false
    };

    @observable public search?: string;
    @observable public isDetailsVisible: boolean = false;
    @observable public dateTimeFormat: string = localStorage.getItem('dateTimeFormat') || defaults.dateTimeFormat;
}

export const sleuthState = new SleuthState();