import { LogEntry } from './logview';
import * as React from 'react';
import * as classNames from 'classnames';
import * as fs from 'fs-promise';
import * as readline from 'readline';
import * as moment from 'moment';

import { UnzippedFiles } from '../unzip';
import {
  MergedLogFile,
  MergedLogFiles,
  mergeLogFiles,
  ProcessedFiles,
  ProcessedLogFile,
  ProcessedLogFiles,
  processFiles
} from '../processor';
import { LogViewHeader } from './logview-header';
import { LogTable } from './logtable';
import { Sidebar } from './sidebar';


export interface LogViewProps {
  unzippedFiles: UnzippedFiles;
}

export interface LogViewState {
  sidebarIsOpen: boolean;
  processedLogFiles: ProcessedLogFiles;
  stateFiles: UnzippedFiles;
  selectedLogFile?: ProcessedLogFile | MergedLogFile;
  mergedLogFiles?: MergedLogFiles;
}

export class LogView extends React.Component<LogViewProps, LogViewState> {
  constructor(props: LogViewProps) {
    super(props);

    this.state = {
      sidebarIsOpen: true,
      processedLogFiles: []
    };

    this.selectLogFile = this.selectLogFile.bind(this);
  }

  public componentDidMount() {
    this.processFiles();
  }

  public processFiles() {
    const { unzippedFiles } = this.props;

    processFiles(unzippedFiles)
      .then(({ processedLogFiles, stateFiles }: ProcessedFiles) => {
        const selectedLogFile = processedLogFiles.length > 0 ? processedLogFiles[0] : null;

        this.setState({ processedLogFiles, selectedLogFile, stateFiles });
      });
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
        const filesToMerge = processedLogFiles.filter((logFile) => logFile.logType === logType || logType === 'all');
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

  public render() {
    const { sidebarIsOpen, processedLogFiles, selectedLogFile } = this.state;
    const logViewClassName = classNames('LogView');
    const logContentClassName = classNames({ SidebarIsOpen: sidebarIsOpen });
    const logTable = selectedLogFile ? (<LogTable logFile={selectedLogFile} />) : '';
    const selectedLogFileName = this.getSelectedFileName();

    return (
      <div className={logViewClassName}>
        <Sidebar isOpen={sidebarIsOpen} logFiles={processedLogFiles} selectLogFile={this.selectLogFile} selectedLogFileName={selectedLogFileName} />
        <div id='content' className={logContentClassName}>
          <LogViewHeader menuToggle={() => this.menuToggled()} />
          {logTable}
        </div>
      </div>
    );
  }
}
