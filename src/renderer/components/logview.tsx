import * as React from 'react';
import * as classNames from 'classnames';
import * as fs from 'fs-promise';
import * as readline from 'readline';

import { UnzippedFile, UnzippedFiles } from '../unzip';
import { LogViewHeader } from './logview-header';
import { LogTable } from './logtable';
import { Sidebar } from './sidebar';

export interface LogEntry {
  timestamp: string;
  message: string;
  level: string;
  meta?: any;
}

export interface ProcessedLogFile {
  logFile: UnzippedFile;
  logEntries: Array<LogEntry>;
  type: string;
}

export interface LogViewProps {
  logFiles: UnzippedFiles;
}

export interface LogViewState {
  sidebarIsOpen: boolean;
  processedLogFiles: Array<ProcessedLogFile>;
  selectedLogFile?: ProcessedLogFile;
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
    this.processLogFiles();
  }

  public processLogFile(logFile: UnzippedFile): Promise<ProcessedLogFile> {
    return new Promise((resolve) => {
      const { fileName } = logFile;
      let type: string = '';

      if (fileName.startsWith('browser.log')) {
        type = 'browser';
      } else if (fileName.startsWith('renderer-')) {
        type = 'renderer';
      } else if (fileName.startsWith('webapp-')) {
        type = 'webapp';
      } else if (fileName.startsWith('webview-')) {
        type = 'webview';
      }

      console.log(`Processing file ${logFile.fileName}. Type: ${type}.`);

      this.readFile(logFile)
        .then((logEntries) => {
          resolve({ logFile, logEntries, type } as ProcessedLogFile)
        });
    });
  }

  public processLogFiles() {
    const { logFiles } = this.props;
    let promises: Array<any> = [];

    logFiles.forEach((logFile) => {
      promises.push(this.processLogFile(logFile));
    });

    Promise.all(promises).then((processedLogFiles: Array<ProcessedLogFile>) => {
      const selectedLogFile = processedLogFiles.length > 0 ? processedLogFiles[0] : null;

      this.setState({ processedLogFiles, selectedLogFile })
    });
  }

  public menuToggled() {
    this.setState({ sidebarIsOpen: !this.state.sidebarIsOpen });
  }

  public readFile(logFile: UnzippedFile): Promise<Array<LogEntry>> {
    return new Promise((resolve) => {
      const lines: Array<LogEntry> = [];
      const readStream = fs.createReadStream(logFile.fullPath);
      const readInterface = readline.createInterface({ input: readStream, terminal: false });
      const matchLine = /^\[([\d\/\,\s\:]{18})\] ([A-Za-z]{0,20})\: ([\s\S]*)$/;

      console.log(`Reading file ${logFile.fileName}.`);

      function getEntry(message: string = '', timestamp: string = '', level: string = '', meta?: any): LogEntry {
        return { message, timestamp, level, meta };
      };
      let currentEntry: LogEntry = getEntry();
      let toParse = '';

      readInterface.on('line', function onLine(line) {
        const results = matchLine.exec(line);

        if (results && results.length === 4) {
          // Is there a meta object?
          if (toParse && toParse.length > 0) {
            currentEntry.meta = toParse;
          }

          // Push the last entry
          lines.push(currentEntry);

          // Create new entry
          toParse = '';
          currentEntry = getEntry();
          currentEntry.timestamp = results[1];
          currentEntry.level = results[2];
          currentEntry.message = results[3];
        } else {
          // This is (hopefully) part of a meta object
          toParse += line;
        }
      });

      readInterface.on('close', () => {
        console.log(`Finished reading file ${logFile.fileName}.`);
        resolve(lines);
      });
    });
  }

  public selectLogFile(logFile: ProcessedLogFile) {
    this.setState({ selectedLogFile: logFile });
  }

  public render() {
    const { sidebarIsOpen, processedLogFiles, selectedLogFile } = this.state;
    const logViewClassName = classNames('LogView');
    const logContentClassName = classNames({ SidebarIsOpen: sidebarIsOpen });
    const logTable = selectedLogFile ? (<LogTable logFile={selectedLogFile} />) : '';

    return (
      <div className={logViewClassName}>
        <Sidebar isOpen={sidebarIsOpen} logFiles={processedLogFiles} selectLogFile={this.selectLogFile} />
        <div id='content' className={logContentClassName}>
          <LogViewHeader menuToggle={() => this.menuToggled()} />
          {logTable}
        </div>
      </div>
    );
  }
}
