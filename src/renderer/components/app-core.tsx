import { observer } from 'mobx-react';
import React from 'react';
import classNames from 'classnames';

import { getFirstLogFile } from '../../utils/get-first-logfile';
import { isMergedLogFile, isProcessedLogFile, isUnzippedFile, isTool } from '../../utils/is-logfile';
import { SleuthState } from '../state/sleuth';
import { UnzippedFile, UnzippedFiles } from '../unzip';
import { getTypesForFiles, mergeLogFiles, processLogFiles } from '../processor';
import {
  LevelFilter,
  MergedFilesLoadStatus,
  MergedLogFile,
  MergedLogFiles,
  ProcessedLogFile,
  ProcessedLogFiles,
  LogType,
  LOG_TYPES_TO_PROCESS,
  SortedUnzippedFiles,
  Tool
} from '../interfaces';
import { AppCoreHeader } from './app-core-header';
import { Sidebar } from './sidebar';
import { Loading } from './loading';
import { LogContent } from './log-content';
import { flushLogPerformance } from '../processor/performance';
import { Spotlight } from './spotlight';
import { sendShowMessageBox } from '../ipc';
import { capitalize } from 'lodash';

const debug = require('debug')('sleuth:appCore');

export interface CoreAppProps {
  state: SleuthState;
  unzippedFiles: UnzippedFiles;
}

export interface CoreAppState {
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
      processedLogFiles: {
        browser: [],
        renderer: [],
        preload: [],
        webapp: [],
        state: [],
        call: [],
        installer: [],
        netlog: []
      },
      loadingMessage: '',
      loadedLogFiles: false,
      loadedMergeFiles: false
    };

    this.setMergedFile = this.setMergedFile.bind(this);
    this.selectLogFile = this.selectLogFile.bind(this);
  }

  /**
   * Once the component has mounted, we'll start processing files.
   */
  public componentDidMount() {
    this.processFiles();
  }

  public render() {
    return this.state.loadedLogFiles
      ? this.renderContent()
      : this.renderLoading();
  }

  /**
   * Take an array of processed files (for logs) or unzipped files (for state files)
   * and add them to the state of this component.
   *
   * @param {(Array<ProcessedLogFile|UnzippedFile>)} files
   * @param {string} logType
   */
  private addFilesToState(files: Partial<SortedUnzippedFiles>, ...types: Array<string>) {
    const { processedLogFiles } = this.state;
    const newProcessedLogFiles: ProcessedLogFiles = { ...processedLogFiles as ProcessedLogFiles };

    types.forEach((t) => {
      newProcessedLogFiles[t] = newProcessedLogFiles[t].concat(files[t]);
    });

    this.setState({
      processedLogFiles: newProcessedLogFiles
    });
  }

  /**
   * Process files - most of the work happens over in ../processor.ts.
   */
  private async processFiles() {
    const { unzippedFiles } = this.props;
    const { cachePath } = this.props.state;

    const sortedUnzippedFiles = getTypesForFiles(unzippedFiles);
    const noFiles = Object.keys(sortedUnzippedFiles).map((k) => sortedUnzippedFiles[k]).every((s) => s.length === 0);

    if (noFiles && !cachePath) {
      sendShowMessageBox({
        title: 'Huh, weird logs!',
        message: 'Sorry, Sleuth does not understand the files. It seems like there are no Slack logs here.',
        type: 'error'
      });

      // Reload
      window.location.reload();
    }

    this.addFilesToState(sortedUnzippedFiles, 'state', 'netlog');

    console.log(this.state!.processedLogFiles!.state);

    console.time('process-files');
    for (const type of LOG_TYPES_TO_PROCESS) {
      const preFiles = sortedUnzippedFiles[type];
      const files = await processLogFiles(preFiles, (loadingMessage) => {
        this.setState({ loadingMessage });
      });
      const delta: Partial<SortedUnzippedFiles> = {};

      delta[type] = files;
      this.addFilesToState(delta, type);
    }
    console.timeEnd('process-files');

    const { selectedLogFile, processedLogFiles } = this.state;
    if (!selectedLogFile && processedLogFiles) {
      this.props.state.selectedLogFile = getFirstLogFile(processedLogFiles);
      this.setState({ loadedLogFiles: true });
    } else {
      this.setState({ loadedLogFiles: true });
    }

    // We're done processing the files, so let's get started on the merge files.
    await this.processMergeFiles();
    flushLogPerformance();
  }

  /**
   * Update this component's status with a merged logfile
   *
   * @param {MergedLogFile} mergedFile
   */
  private setMergedFile(mergedFile: MergedLogFile) {
    const { mergedLogFiles } = this.state;
    const newMergedLogFiles = { ...mergedLogFiles as MergedLogFiles };

    debug(`Merged log file for ${mergedFile.logType} now created!`);
    newMergedLogFiles[mergedFile.logType] = mergedFile;
    this.setState({ mergedLogFiles: newMergedLogFiles });
  }

  /**
   * Kick off merging of all the log files
   */
  private async processMergeFiles() {
    const { processedLogFiles } = this.state;

    if (processedLogFiles) {
      await mergeLogFiles(processedLogFiles.browser, LogType.BROWSER).then(this.setMergedFile);
      await mergeLogFiles(processedLogFiles.renderer, LogType.RENDERER).then(this.setMergedFile);
      await mergeLogFiles(processedLogFiles.preload, LogType.PRELOAD).then(this.setMergedFile);
      await mergeLogFiles(processedLogFiles.call, LogType.CALL).then(this.setMergedFile);
      await mergeLogFiles(processedLogFiles.webapp, LogType.WEBAPP).then(this.setMergedFile);

      const merged = this.state.mergedLogFiles as MergedLogFiles;
      const toMerge = [merged.browser, merged.renderer, merged.preload, merged.call, merged.webapp];

      mergeLogFiles(toMerge, LogType.ALL).then((r) => this.setMergedFile(r));
    }
  }

  /**
   * Select a log file. This is a more complex operation than one might think -
   * mostly because we might need to create a merged file on-the-fly.
   *
   * @param {ProcessedLogFile} logFile
   * @param {string} [logType]
   */
  private selectLogFile(logFile: ProcessedLogFile | UnzippedFile | null, logType?: string): void {
    this.props.state.selectedEntry = undefined;

    if (!logFile && logType) {
      const { mergedLogFiles } = this.state;

      debug(`Selecting log type ${logType}`);

      // If our "logtype" is actually a tool (like Cache), we'll set it
      if (logType in Tool) {
        this.props.state.selectedLogFile = logType as Tool;
      } else if (mergedLogFiles && mergedLogFiles[logType]) {
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
  private getSelectedFileName(): string {
    const { selectedLogFile } = this.props.state;

    if (isProcessedLogFile(selectedLogFile)) {
      return selectedLogFile.logFile.fileName;
    } else if (isMergedLogFile(selectedLogFile)) {
      return selectedLogFile.logType;
    } else if (isUnzippedFile(selectedLogFile)) {
      return selectedLogFile.fileName;
    } else if (isTool(selectedLogFile)) {
      return capitalize(selectedLogFile);
    } else {
      return '';
    }
  }

  /**
   * Returns a rounded percentage number for our init process.
   *
   * @returns {number} Percentage loaded
   */
  private getPercentageLoaded(): number {
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
   * @returns {MergedFilesLoadStatus}
   */
  private getMergedFilesStatus(): MergedFilesLoadStatus {
    const { mergedLogFiles } = this.state;

    return {
      all: !!(mergedLogFiles && mergedLogFiles.all && mergedLogFiles.all.logEntries),
      browser: !!(mergedLogFiles && mergedLogFiles.browser && mergedLogFiles.browser.logEntries),
      renderer: !!(mergedLogFiles && mergedLogFiles.renderer && mergedLogFiles.renderer.logEntries),
      preload: !!(mergedLogFiles && mergedLogFiles.preload && mergedLogFiles.preload.logEntries),
      webapp: !!(mergedLogFiles && mergedLogFiles.webapp && mergedLogFiles.webapp.logEntries),
      call: !!(mergedLogFiles && mergedLogFiles.call && mergedLogFiles.call.logEntries),
    };
  }

  /**
   * Renders both the sidebar as well as the Spotlight-like omnibar.
   *
   * @returns {JSX.Element}
   */
  private renderSidebarSpotlight(): JSX.Element {
    const { processedLogFiles } = this.state;
    const selectedLogFileName = this.getSelectedFileName();
    const mergedFilesStatus = this.getMergedFilesStatus();

    return (
      <>
        <Sidebar
          logFiles={processedLogFiles as ProcessedLogFiles}
          mergedFilesStatus={mergedFilesStatus}
          selectLogFile={this.selectLogFile}
          selectedLogFileName={selectedLogFileName}
          state={this.props.state}
        />
        <Spotlight
          state={this.props.state}
          selectLogFile={this.selectLogFile}
          logFiles={processedLogFiles as ProcessedLogFiles}
        />
      </>
    );
  }

  /**
   * Render the loading indicator.
   *
   * @returns {JSX.Element}
   */
  private renderLoading() {
    const { loadingMessage } = this.state;
    const percentageLoaded = this.getPercentageLoaded();

    return (
      <div className='AppCore'>
        <div id='content'>
          <Loading percentage={percentageLoaded} message={loadingMessage} />
        </div>
      </div>
    );
  }

  /**
   * Render the actual content (when loaded).
   *
   * @returns {JSX.Element}
   */
  private renderContent(): JSX.Element {
    const { isSidebarOpen } = this.props.state;
    const logContentClassName = classNames({ isSidebarOpen });

    return (
      <div className='AppCore'>
        {this.renderSidebarSpotlight()}

        <div id='content' className={logContentClassName}>
          <AppCoreHeader state={this.props.state} />
          <LogContent state={this.props.state} />
        </div>
      </div>
    );
  }
}
