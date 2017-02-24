import * as React from 'react';
import * as classNames from 'classnames';

import { ipcRenderer } from 'electron';
import { UnzippedFile, UnzippedFiles } from '../unzip';
import { getTypesForFiles, mergeLogFiles, processLogFiles } from '../processor';
import { MergedLogFile, MergedLogFiles, ProcessedLogFile, ProcessedLogFiles } from '../interfaces';
import { LogViewHeader } from './logview-header';
import { LogTable } from './logtable';
import { StateTable } from './statetable';
import { Sidebar } from './sidebar';
import { Loading } from './loading';

export interface LogViewProps {
  unzippedFiles: UnzippedFiles;
}

export interface LogViewState {
  sidebarIsOpen: boolean;
  processedLogFiles: ProcessedLogFiles;
  selectedLogFile?: ProcessedLogFile | MergedLogFile | UnzippedFile;
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

    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.selectLogFile = this.selectLogFile.bind(this);

    ipcRenderer.on('processing-status', (_event, loadingMessage: string) => {
      this.setState({ loadingMessage });
    });
  }

  /**
   * Once the component has mounted, we'll start processing files.
   */
  public componentDidMount() {
    this.processFiles();
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
    const newProcessedLogFiles = {...processedLogFiles};
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
    if (!selectedLogFile && processedLogFiles) {
      this.setState({ selectedLogFile: processedLogFiles.browser[0] });
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
  public selectLogFile(logFile: ProcessedLogFile, logType?: string) {
    if (!logFile && logType) {
      const { mergedLogFiles, processedLogFiles } = this.state;

      if (!mergedLogFiles || !mergedLogFiles[logType]) {
        // Requested for the first time? Let's sort them real quick
        console.log(`Requested the merged log format for '${logType}', but it hasn't been created yet.`);
        let filesToMerge = [];

        if (logType === 'all' && processedLogFiles) {
          filesToMerge = Object.keys(processedLogFiles)
            .filter((k) => k !== 'state' && k !== 'webapp')
            .map((k) => processedLogFiles[k])
            .reduce((p, c) => p.concat(c), []);
        } else if (processedLogFiles) {
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

  /**
   * Return the file name of the currently selected file.
   *
   * @returns {string}
   */
  public getSelectedFileName(): string {
    const { selectedLogFile } = this.state;

    if (selectedLogFile && selectedLogFile.type === 'ProcessedLogFile') {
      return (selectedLogFile as ProcessedLogFile).logFile.fileName;
    } else if (selectedLogFile && selectedLogFile.type === 'MergedLogFile') {
      return (selectedLogFile as MergedLogFile).logType;
    } else if (selectedLogFile) {
      return (selectedLogFile as UnzippedFile).fileName;
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

  public renderTableOrData() {
    const { selectedLogFile } = this.state;

    if ((selectedLogFile as ProcessedLogFile).type === 'ProcessedLogFile' ||
        (selectedLogFile as MergedLogFile).type === 'MergedLogFile') {
      return (<LogTable logFile={selectedLogFile as ProcessedLogFile} />);
    } else {
      return (<StateTable file={selectedLogFile as UnzippedFile} />);
    }
  }

  public render() {
    const { sidebarIsOpen, processedLogFiles, selectedLogFile, loadingMessage } = this.state;
    const logViewClassName = classNames('LogView');
    const logContentClassName = classNames({ SidebarIsOpen: sidebarIsOpen });
    const selectedLogFileName = this.getSelectedFileName();
    const percentageLoaded = this.getPercentageLoaded();
    const loading = <Loading percentage={percentageLoaded} message={loadingMessage} />;
    const tableOrLoading = selectedLogFile ? this.renderTableOrData() : loading;

    return (
      <div className={logViewClassName}>
        <Sidebar isOpen={sidebarIsOpen || true}
          logFiles={processedLogFiles as ProcessedLogFiles}
          selectLogFile={this.selectLogFile}
          selectedLogFileName={selectedLogFileName} />
        <div id='content' className={logContentClassName}>
          <LogViewHeader menuToggle={this.toggleSidebar} />
          {tableOrLoading}
        </div>
      </div>
    );
  }
}
