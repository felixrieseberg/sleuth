import { UnzippedFile } from '../unzip';
import * as React from 'react';
import * as classNames from 'classnames';

import { ProcessedLogFile, ProcessedLogFiles } from '../interfaces';

export interface SidebarProps {
  logFiles: ProcessedLogFiles;
  isOpen: boolean;
  selectedLogFileName: string;
  selectLogFile: Function;
}

export class Sidebar extends React.Component<SidebarProps, undefined> {
  constructor(props: SidebarProps) {
    super(props);

    this.renderFile = this.renderFile.bind(this);
  }

  /**
   * Renders a single file inside the sidebar.
   *
   * @param {ProcessedLogFile} file
   * @returns {JSX.Element}
   */
  renderLogFile(file: ProcessedLogFile): JSX.Element {
    const { selectLogFile, selectedLogFileName } = this.props;
    const isSelected = (selectedLogFileName === file.logFile.fileName);
    const className = classNames({ Selected: isSelected });

    return (
        <li key={file.logFile.fileName}>
          <a onClick={() => selectLogFile(file)} className={className}>
              <i className="ts_icon ts_icon_file LogFile"></i>{file.logFile.fileName}
          </a>
        </li>
        );
  }

  renderStateFile(file: UnzippedFile): JSX.Element {
    const { selectLogFile, selectedLogFileName } = this.props;
    const isSelected = (selectedLogFileName === file.fileName);
    const className = classNames({ Selected: isSelected });

    const nameMatch = file.fileName.match(/slack-(\w*)/);
    const name = nameMatch && nameMatch.length > 1 ? nameMatch[1] : file.fileName;

    return (
        <li key={file.fileName}>
          <a onClick={() => selectLogFile(file)} className={className}>
              <i className="ts_icon ts_icon_file LogFile"></i>{name}
          </a>
        </li>
        );
  }

  renderFile(file: ProcessedLogFile | UnzippedFile) {
    if ((file as ProcessedLogFile).type === 'ProcessedLogFile') {
      // It's a log file
      return this.renderLogFile(file as ProcessedLogFile);
    } else {
      // it's a state file
      return this.renderStateFile(file as UnzippedFile);
    }
  }

  public render(): JSX.Element | null {
    const { isOpen, selectLogFile, selectedLogFileName, logFiles } = this.props;
    const className = classNames('Sidebar', { 'nav_open': isOpen });

    const getSelectedClassName = (logType: string) => classNames({ Selected: (selectedLogFileName === logType) });
    const stateFiles = logFiles.state.map(this.renderFile.bind(this));
    const browserFiles = logFiles.browser.map(this.renderFile.bind(this));
    const rendererFiles = logFiles.renderer.map(this.renderFile.bind(this));
    const webappFiles = logFiles.webapp.map(this.renderFile.bind(this));
    const webviewFiles = logFiles.webview.map(this.renderFile.bind(this));

    return (
      <div className={className}>
        <nav id="site_nav">
          <div id="site_nav_contents">
            <div className="nav_contents">
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-Webapp">
                  <a>
                    <i className="ts_icon ts_icon_filter"></i>State
                  </a>
                </li>
                {stateFiles}
              </ul>
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-all">
                  <a onClick={() => selectLogFile(null, 'all')} className={getSelectedClassName('all')}>
                    <i className="ts_icon ts_icon_archive"></i>All Desktop Log Files
                  </a>
                </li>
              </ul>
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-Browser">
                  <a onClick={() => selectLogFile(null, 'browser')} className={getSelectedClassName('browser')}>
                    <i className="ts_icon ts_icon_power_off"></i>Browser Process
                  </a>
                </li>
                {browserFiles}
              </ul>
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-Renderer">
                  <a onClick={() => selectLogFile(null, 'renderer')} className={getSelectedClassName('renderer')}>
                    <i className="ts_icon ts_icon_laptop"></i>Renderer Process
                  </a>
                </li>
                {rendererFiles}
              </ul>
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-Webview">
                  <a onClick={() => selectLogFile(null, 'webview')} className={getSelectedClassName('webview')}>
                    <i className="ts_icon ts_icon_all_files_alt"></i>WebView Process
                  </a>
                </li>
                {webviewFiles}
              </ul>
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-Webapp">
                  <a onClick={() => selectLogFile(null, 'webapp')} className={getSelectedClassName('webapp')}>
                    <i className="ts_icon ts_icon_globe"></i>WebApp
                  </a>
                </li>
                {webappFiles}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}
