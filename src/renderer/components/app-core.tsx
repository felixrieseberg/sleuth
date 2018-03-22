import { getFirstLogFile } from '../../utils/get-first-logfile';
import { isMergedLogFile, isProcessedLogFile, isUnzippedFile } from '../../utils/is-logfile';
import { observer } from 'mobx-react';
import { sleuthState, SleuthState } from '../state/sleuth';
import * as React from 'react';
import * as classNames from 'classnames';

import { ipcRenderer, remote } from 'electron';
import { UnzippedFile, UnzippedFiles } from '../unzip';
import { getTypesForFiles, mergeLogFiles, processLogFiles } from '../processor';
import {
  LevelFilter,
  MergedFilesLoadStatus,
  MergedLogFile,
  MergedLogFiles,
  ProcessedLogFile,
  ProcessedLogFiles
} from '../interfaces';
import { AppCoreHeader } from './app-core-header';
import { Sidebar } from './sidebar';
import { Loading } from './loading';
import { LogContent } from './log-content';

const debug = require('debug')('sleuth:appCore');

export interface CoreAppProps {
  state: SleuthState;
  unzippedFiles: UnzippedFiles;
}

export interface CoreAppState {
  sidebarIsOpen: boolean;
  processedLogFiles: ProcessedLogFiles;
  selectedLogFile?: ProcessedLogFile | MergedLogFile | UnzippedFile;
  mergedLogFiles?: MergedLogFiles;
  loadingMessage: string;
  loadedLogFiles: boolean;
  loadedMergeFiles: boolean;
  filter: LevelFilter;
  search?: string;
}

@observer
export class CoreApplication extends React.Component<CoreAppProps, Partial<CoreAppState>> {
  constructor(props: CoreAppProps) {
    super(props);

    this.state = {
      sidebarIsOpen: true,
      processedLogFiles: {
        browser: [],
        renderer: [],
        webview: [],
        webapp: [],
        state: [],
        call: []
      },
      loadingMessage: '',
      loadedLogFiles: false,
      loadedMergeFiles: false
    };

    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.selectLogFile = this.selectLogFile.bind(this);

    ipcRenderer.on('processing-status', (_event: any, loadingMessage: string) => {
      this.setState({ loadingMessage });
    });
  }

  /**
   * Once the component has mounted, we'll start processing files.
   */
  public componentDidMount() {
    this.processFiles();
  }

  public componentWillUnmount() {
    ipcRenderer.removeAllListeners('processing-status');
  }

  /**
   * Take an array of processed files (for logs) or unzipped files (for state files)
   * and add them to the state of this component.
   *
   * @param {(Array<ProcessedLogFile|UnzippedFile>)} files
   * @param {string} logType
   */
  public addFilesToState(files: Array<ProcessedLogFile|UnzippedFile>, logType: string) {
    const { processedLogFiles } = this.state;
    const newProcessedLogFiles: ProcessedLogFiles = { ...processedLogFiles as ProcessedLogFiles };
    newProcessedLogFiles[logType] = newProcessedLogFiles[logType].concat(files);

    this.setState({
      processedLogFiles: newProcessedLogFiles
    });
  }

  /**
   * Process files - most of the work happens over in ../processor.ts.
   */
  public async processFiles() {
    const { unzippedFiles } = this.props;

    const sortedUnzippedFiles = getTypesForFiles(unzippedFiles);

    if (Object.keys(sortedUnzippedFiles).map((k) => sortedUnzippedFiles[k]).every((s) => s.length === 0)) {
      const title = 'Huh, weird logs!';
      const message = 'Sorry, Sleuth does not understand the files. It seems like there are no Slack logs here.';

      remote.dialog.showMessageBox({ type: 'error', title, message }, () => {
        remote.getCurrentWindow().reload();
      });
    }

    this.addFilesToState(sortedUnzippedFiles.state, 'state');

    await processLogFiles(sortedUnzippedFiles.renderer)
      .then((newFiles: Array<ProcessedLogFile>) => this.addFilesToState(newFiles, 'renderer'));
    await processLogFiles(sortedUnzippedFiles.browser)
      .then((newFiles: Array<ProcessedLogFile>) => this.addFilesToState(newFiles, 'browser'));
    await processLogFiles(sortedUnzippedFiles.webapp)
      .then((newFiles: Array<ProcessedLogFile>) => this.addFilesToState(newFiles, 'webapp'));
    await processLogFiles(sortedUnzippedFiles.webview)
      .then((newFiles: Array<ProcessedLogFile>) => this.addFilesToState(newFiles, 'webview'));
    await processLogFiles(sortedUnzippedFiles.call)
      .then((newFiles: Array<ProcessedLogFile>) => this.addFilesToState(newFiles, 'call'));

    const { selectedLogFile, processedLogFiles } = this.state;
    if (!selectedLogFile && processedLogFiles) {
      this.props.state.selectedLogFile = getFirstLogFile(processedLogFiles);
      this.setState({ loadedLogFiles: true });
    } else {
      this.setState({ loadedLogFiles: true });
    }

    // We're done processing the files, so let's get started on the merge files.
    this.processMergeFiles();
  }

  /**
   * Update this component's status with a merged logfile
   *
   * @param {MergedLogFile} mergedFile
   */
  public setMergedFile(mergedFile: MergedLogFile) {
    const { mergedLogFiles } = this.state;
    const newMergedLogFiles = { ...mergedLogFiles as MergedLogFiles };

    debug(`Merged log file for ${mergedFile.logType} now created!`);
    newMergedLogFiles[mergedFile.logType] = mergedFile;
    this.setState({ mergedLogFiles: newMergedLogFiles });
  }

  /**
   * Kick off merging of all the log files
   */
  public async processMergeFiles() {
    const { processedLogFiles } = this.state;

    if (processedLogFiles) {
      await mergeLogFiles(processedLogFiles.browser, 'browser').then((r) => this.setMergedFile(r));
      await mergeLogFiles(processedLogFiles.renderer, 'renderer').then((r) => this.setMergedFile(r));
      await mergeLogFiles(processedLogFiles.webview, 'webview').then((r) => this.setMergedFile(r));
      await mergeLogFiles(processedLogFiles.call, 'call').then((r) => this.setMergedFile(r));

      const merged = this.state.mergedLogFiles as MergedLogFiles;

      mergeLogFiles([merged.browser, merged.renderer, merged.webview, merged.call], 'all').then((r) => this.setMergedFile(r));
    }
  }

  /**
   * Toggle the sidebar.
   */
  public toggleSidebar() {
    this.setState({ sidebarIsOpen: !this.state.sidebarIsOpen });
  }

  /**
   * Select a log file. This is a more complex operation than one might think -
   * mostly because we might need to create a merged file on-the-fly.
   *
   * @param {ProcessedLogFile} logFile
   * @param {string} [logType]
   */
  public selectLogFile(logFile: ProcessedLogFile | UnzippedFile | null, logType?: string): void {
    if (!logFile && logType) {
      const { mergedLogFiles } = this.state;

      debug(`Selecting log type ${logType}`);

      if (mergedLogFiles && mergedLogFiles[logType]) {
        this.props.state.selectedLogFile = mergedLogFiles[logType];
      }
    } else if (logFile) {
      const name = isProcessedLogFile(logFile) ? logFile.logType : logFile.fileName;
      debug(`Selecting log file ${name}`);

      this.props.state.selectedLogFile = logFile;
    }
  }

  /**
   * Return the file name of the currently selected file.
   *
   * @returns {string}
   */
  public getSelectedFileName(): string {
    const { selectedLogFile } = this.props.state;

    if (isProcessedLogFile(selectedLogFile)) {
      return selectedLogFile.logFile.fileName;
    } else if (isMergedLogFile(selectedLogFile)) {
      return selectedLogFile.logType;
    } else if (isUnzippedFile(selectedLogFile)) {
      return selectedLogFile.fileName;
    } else {
      return '';
    }
  }

  /**
   * Returns a rounded percentage number for our init process.
   *
   * @returns {number} Percentage loaded
   */
  public getPercentageLoaded(): number {
    const { unzippedFiles } = this.props;
    const processedLogFiles = this.state.processedLogFiles || {};
    const alreadyLoaded = Object.keys(processedLogFiles)
      .map((k) => processedLogFiles[k])
      .reduce((p, c) => p + c.length, 0);
    const toLoad = unzippedFiles.length;

    return Math.round(alreadyLoaded / toLoad * 100);
  }

  /**
   * Real quick: Are we loaded yet?
   *
   * @returns
   */
  public getMergedFilesStatus(): MergedFilesLoadStatus {
    const { mergedLogFiles } = this.state;

    return {
      all: !!(mergedLogFiles && mergedLogFiles.all && mergedLogFiles.all.logEntries),
      browser: !!(mergedLogFiles && mergedLogFiles.browser && mergedLogFiles.browser.logEntries),
      renderer: !!(mergedLogFiles && mergedLogFiles.renderer && mergedLogFiles.renderer.logEntries),
      webview: !!(mergedLogFiles && mergedLogFiles.webview && mergedLogFiles.webview.logEntries),
      webapp: !!(mergedLogFiles && mergedLogFiles.webapp && mergedLogFiles.webapp.logEntries),
      call: !!(mergedLogFiles && mergedLogFiles.call && mergedLogFiles.call.logEntries),
    };
  }

  public render() {
    const { selectedLogFile } = this.props.state;
    const { sidebarIsOpen, processedLogFiles, loadingMessage } = this.state;
    const appCoreClassName = classNames('AppCore');
    const logContentClassName = classNames({ SidebarIsOpen: sidebarIsOpen });
    const selectedLogFileName = this.getSelectedFileName();
    const percentageLoaded = this.getPercentageLoaded();
    const loading = <Loading percentage={percentageLoaded} message={loadingMessage} />;
    const tableOrLoading = selectedLogFile ? <LogContent state={sleuthState} /> : loading;
    const mergedFilesStatus = this.getMergedFilesStatus();

    return (
      <div className={appCoreClassName}>
        <Sidebar
          isOpen={!!sidebarIsOpen}
          logFiles={processedLogFiles as ProcessedLogFiles}
          mergedFilesStatus={mergedFilesStatus}
          selectLogFile={this.selectLogFile}
          selectedLogFileName={selectedLogFileName}
        />
        <div id='content' className={logContentClassName}>
          <AppCoreHeader state={sleuthState} menuToggle={this.toggleSidebar} />
          {tableOrLoading}
        </div>
      </div>
    );
  }
}
