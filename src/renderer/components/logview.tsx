import * as React from 'react';
import * as classNames from 'classnames';
import * as fs from 'fs-promise';
import * as readline from 'readline';
import * as moment from 'moment';

import { ipcRenderer } from 'electron';
import { UnzippedFile, UnzippedFiles } from '../unzip';
import {
  getTypesForFiles,
  MergedLogFile,
  MergedLogFiles,
  mergeLogFiles,
  ProcessedLogFile,
  ProcessedLogFiles,
  processLogFiles
} from '../processor';
import { LogViewHeader } from './logview-header';
import { LogTable } from './logtable';
import { Sidebar } from './sidebar';
import { Loading } from './loading';

export interface LogViewProps {
  unzippedFiles: UnzippedFiles;
}

export interface LogViewState {
  sidebarIsOpen: boolean;
  processedLogFiles: ProcessedLogFiles;
  selectedLogFile?: ProcessedLogFile | MergedLogFile;
  mergedLogFiles?: MergedLogFiles;
  loadingMessage: string;
  doneProcessing: boolean;
}

export class LogView extends React.Component<LogViewProps, Partial<LogViewState>> {
  constructor(props: LogViewProps) {
    super(props);

    this.state = {
      sidebarIsOpen: true,
      processedLogFiles: {
        browser: [],
        renderer: [],
        webview: [],
        webapp: [],
        state: []
      },
      loadingMessage: '',
      doneProcessing: false
    };

    this.selectLogFile = this.selectLogFile.bind(this);

    ipcRenderer.on('processing-status', (_event, loadingMessage: string) => {
      this.setState({ loadingMessage })
    });
  }

  public componentDidMount() {
    this.processFiles();
  }

  public addFilesToState(files: Array<ProcessedLogFile|UnzippedFile>, logType: string) {
    const { processedLogFiles } = this.state;
    const newProcessedLogFiles = {...processedLogFiles};
    newProcessedLogFiles[logType] = newProcessedLogFiles[logType].concat(files);

    this.setState({
      processedLogFiles: newProcessedLogFiles
    });
  }

  public async processFiles() {
    const { unzippedFiles } = this.props;
    const sortedUnzippedFiles = getTypesForFiles(unzippedFiles);

    this.addFilesToState(sortedUnzippedFiles.state, 'state');

    await processLogFiles(sortedUnzippedFiles.renderer)
      .then((newFiles: Array<ProcessedLogFile>) => this.addFilesToState(newFiles, 'renderer'));
    await processLogFiles(sortedUnzippedFiles.browser)
      .then((newFiles: Array<ProcessedLogFile>) => this.addFilesToState(newFiles, 'browser'));
    await processLogFiles(sortedUnzippedFiles.webapp)
      .then((newFiles: Array<ProcessedLogFile>) => this.addFilesToState(newFiles, 'webapp'));
    await processLogFiles(sortedUnzippedFiles.webview)
      .then((newFiles: Array<ProcessedLogFile>) => this.addFilesToState(newFiles, 'webview'));

    const { selectedLogFile, processedLogFiles } = this.state;
    if (!selectedLogFile) {
      this.setState({ selectedLogFile: processedLogFiles.browser[0] });
    }
  }

  public menuToggled() {
    this.setState({ sidebarIsOpen: !this.state.sidebarIsOpen });
  }

  public selectLogFile(logFile: ProcessedLogFile, logType?: string) {
    if (!logFile && logType) {
      const { mergedLogFiles, processedLogFiles } = this.state;

      if (!mergedLogFiles || !mergedLogFiles[logType]) {
        // Requested for the first time? Let's sort them real quick
        console.log(`Requested the merged log format for '${logType}', but it hasn't been created yet.`);
        let filesToMerge;

        if (logType === 'all') {
          filesToMerge = Object.keys(processedLogFiles)
            .filter((k) => k !== 'state' && k !== 'webapp')
            .map((k) => processedLogFiles[k])
            .reduce((p, c) => p.concat(c), []);
        } else {
          filesToMerge = processedLogFiles[logType];
        }

        const freshlyMerged = mergeLogFiles(filesToMerge, logType);
        const newMergedLogFiles = {...mergedLogFiles};

        console.log(`Merged log file for '${logType}' now created!`);
        newMergedLogFiles[logType] = freshlyMerged;
        this.setState({ mergedLogFiles: newMergedLogFiles, selectedLogFile: freshlyMerged });
      } else {
        this.setState({ selectedLogFile: mergedLogFiles[logType] });
      }
    } else {
      this.setState({ selectedLogFile: logFile });
    }
  }

  public getSelectedFileName(): string {
    const { selectedLogFile } = this.state;

    if (selectedLogFile && selectedLogFile.type === 'ProcessedLogFile') {
      return (selectedLogFile as ProcessedLogFile).logFile.fileName;
    } else if (selectedLogFile && selectedLogFile.type === 'MergedLogFile') {
      return (selectedLogFile as MergedLogFile).logType;
    } else {
      return '';
    }
  }

  public getPercentageLoaded() {
    const { unzippedFiles } = this.props;
    const { processedLogFiles } = this.state;
    const alreadyLoaded = Object.keys(processedLogFiles)
      .map((k) => processedLogFiles[k])
      .reduce((p, c) => p + c.length, 0);
    const toLoad = unzippedFiles.length;

    return Math.round(alreadyLoaded / toLoad * 100);
  }

  public render() {
    const { sidebarIsOpen, processedLogFiles, selectedLogFile, loadingMessage } = this.state;
    const logViewClassName = classNames('LogView');
    const logContentClassName = classNames({ SidebarIsOpen: sidebarIsOpen });
    const logTable = selectedLogFile ? (<LogTable logFile={selectedLogFile} />) : '';
    const selectedLogFileName = this.getSelectedFileName();
    const percentageLoaded = this.getPercentageLoaded();
    const tableOrLoading = selectedLogFile ? logTable : <Loading percentage={percentageLoaded} message={loadingMessage} />;

    return (
      <div className={logViewClassName}>
        <Sidebar isOpen={sidebarIsOpen} logFiles={processedLogFiles} selectLogFile={this.selectLogFile} selectedLogFileName={selectedLogFileName} />
        <div id='content' className={logContentClassName}>
          <LogViewHeader menuToggle={() => this.menuToggled()} />
          {tableOrLoading}
        </div>
      </div>
    );
  }
}
