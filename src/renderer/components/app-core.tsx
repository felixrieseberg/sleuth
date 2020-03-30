import { observer } from 'mobx-react';
import React from 'react';
import classNames from 'classnames';

import { getFirstLogFile } from '../../utils/get-first-logfile';
import { SleuthState } from '../state/sleuth';
import { getTypesForFiles, mergeLogFiles, processLogFiles } from '../processor';
import {
  LevelFilter,
  MergedFilesLoadStatus,
  MergedLogFiles,
  ProcessedLogFiles,
  LogType,
  LOG_TYPES_TO_PROCESS,
  SortedUnzippedFiles,
  UnzippedFiles,
} from '../interfaces';
import { AppCoreHeader } from './app-core-header';
import { Sidebar } from './sidebar';
import { Loading } from './loading';
import { LogContent } from './log-content';
import { flushLogPerformance } from '../processor/performance';
import { Spotlight } from './spotlight';
import { sendShowMessageBox } from '../ipc';

export interface CoreAppProps {
  state: SleuthState;
  unzippedFiles: UnzippedFiles;
}

export interface CoreAppState {
  processedLogFiles: ProcessedLogFiles;
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

    const { processedLogFiles } = this.state;
    const { selectedLogFile } = this.props.state;
    if (!selectedLogFile && processedLogFiles) {
      this.props.state.selectedLogFile = getFirstLogFile(processedLogFiles);
    }
    this.setState({ loadedLogFiles: true });

    // We're done processing the files, so let's get started on the merge files.
    await this.processMergeFiles();
    flushLogPerformance();
  }

  /**
   * Kick off merging of all the log files
   */
  private async processMergeFiles() {
    const { processedLogFiles } = this.state;
    const { setMergedFile } = this.props.state;

    if (processedLogFiles) {
      await mergeLogFiles(processedLogFiles.browser, LogType.BROWSER).then(setMergedFile);
      await mergeLogFiles(processedLogFiles.renderer, LogType.RENDERER).then(setMergedFile);
      await mergeLogFiles(processedLogFiles.preload, LogType.PRELOAD).then(setMergedFile);
      await mergeLogFiles(processedLogFiles.call, LogType.CALL).then(setMergedFile);
      await mergeLogFiles(processedLogFiles.webapp, LogType.WEBAPP).then(setMergedFile);

      const merged = this.props.state.mergedLogFiles as MergedLogFiles;
      const toMerge = [merged.browser, merged.renderer, merged.preload, merged.call, merged.webapp];

      mergeLogFiles(toMerge, LogType.ALL).then((r) => setMergedFile(r));
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
    const { mergedLogFiles } = this.props.state;

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
    const { selectedFileName } = this.props.state;
    const mergedFilesStatus = this.getMergedFilesStatus();

    return (
      <>
        <Sidebar
          logFiles={processedLogFiles as ProcessedLogFiles}
          mergedFilesStatus={mergedFilesStatus}
          selectedLogFileName={selectedFileName}
          state={this.props.state}
        />
        <Spotlight
          state={this.props.state}
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
