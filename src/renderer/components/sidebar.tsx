import * as React from 'react';
import * as classNames from 'classnames';

import { ProcessedLogFile } from '../processor';

export interface SortedLogFiles {
  renderer: ProcessedLogFiles;
  webapp: ProcessedLogFiles;
  browser: ProcessedLogFiles;
  webview: ProcessedLogFiles;
}

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

  getSortedLogFiles(): SortedLogFiles {
    const { logFiles } = this.props;
    const result: SortedLogFiles = {
      renderer: [],
      webapp: [],
      browser: [],
      webview: []
    };

    logFiles.forEach((logFile) => {
      if (logFile.logType === 'renderer') {
        result.renderer.push(logFile);
      } else if (logFile.logType === 'browser') {
        result.browser.push(logFile);
      } else if (logFile.logType === 'webapp') {
        result.webapp.push(logFile);
      } else if (logFile.logType === 'webview') {
        result.webview.push(logFile);
      }
    });

    return result;
  }

  renderFile(file: ProcessedLogFile) {
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

  public render() {
    const { isOpen, selectLogFile, selectedLogFileName } = this.props;
    const sortedLogFiles = this.getSortedLogFiles();
    const className = classNames('Sidebar', { 'nav_open': isOpen });

    const getSelectedClassName = (logType: string) => classNames({ Selected: (selectedLogFileName === logType) });
    const browserFiles = sortedLogFiles.browser.map(this.renderFile.bind(this));
    const rendererFiles = sortedLogFiles.renderer.map(this.renderFile.bind(this));
    const webappFiles = sortedLogFiles.webapp.map(this.renderFile.bind(this));
    const webviewFiles = sortedLogFiles.webview.map(this.renderFile.bind(this));

    return (
      <div className={className}>
        <nav id="site_nav">
          <div id="site_nav_contents">
            <div className="nav_contents">
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-all">
                  <a onClick={() => selectLogFile(null, 'all')} className={getSelectedClassName('all')}>
                    <i className="ts_icon ts_icon_archive"></i>All Log Files
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
