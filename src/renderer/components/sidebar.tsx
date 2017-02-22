import * as React from 'react';
import * as classNames from 'classnames';

import { ProcessedLogFile } from './logview';

export interface SortedLogFiles {
  renderer: Array<ProcessedLogFile>;
  webapp: Array<ProcessedLogFile>;
  browser: Array<ProcessedLogFile>;
  webview: Array<ProcessedLogFile>;
}

export interface SidebarProps {
  logFiles: Array<ProcessedLogFile>;
  isOpen: boolean;
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
      if (logFile.type === 'renderer') {
        result.renderer.push(logFile);
      } else if (logFile.type === 'browser') {
        result.browser.push(logFile);
      } else if (logFile.type === 'webapp') {
        result.webapp.push(logFile);
      } else if (logFile.type === 'webview') {
        result.webview.push(logFile);
      }
    });

    return result;
  }

  renderFile(file: ProcessedLogFile) {
    const { selectLogFile } = this.props;

    return (
        <li key={file.logFile.fileName}><a onClick={() => selectLogFile(file)}>
            <i className="ts_icon ts_icon_file LogFile"></i>{file.logFile.fileName}
        </a></li>
        );
  }

  public render() {
    const { isOpen } = this.props;
    const sortedLogFiles = this.getSortedLogFiles();
    const className = classNames('Sidebar', { 'nav_open': isOpen });

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
                <li className="MenuTitle MenuTitle-browser"><i className="ts_icon ts_icon_power_off"></i>Browser Process</li>
                {browserFiles}
              </ul>
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-renderer"><i className="ts_icon ts_icon_laptop"></i>Renderer Process</li>
                {rendererFiles}
              </ul>
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-webview"><i className="ts_icon ts_icon_all_files_alt"></i>WebView Process</li>
                {webviewFiles}
              </ul>
              <ul className="primary_nav">
                <li className="MenuTitle MenuTitle-webapp"><i className="ts_icon ts_icon_globe"></i>WebApp</li>
                {webappFiles}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}

// <li><a href="/messages" data-qa="app"><i className="ts_icon ts_icon_angle_arrow_up_left"></i>Back to Slack</a></li>
// <li><a href="/home" data-qa="home"><i className="ts_icon ts_icon_home"></i>Home</a></li>
// <li><a href="/account" data-qa="account_profile"><i className="ts_icon ts_icon_user"></i>Account &amp; Profile</a></li>
// <li><a href="/apps/manage" data-qa="configure_apps" target="_blank"><i className="ts_icon ts_icon_plug"></i>Configure Apps</a></li>
// <li><a href="/archives" data-qa="archives"><i className="ts_icon ts_icon_archive"></i>Message Archives</a></li>
//
// <li><a href="/team" data-qa="team_directory"><i className="ts_icon ts_icon_team_directory"></i>Directory</a></li>
// <li><a href="/stats" data-qa="statistics"><i className="ts_icon ts_icon_dashboard"></i>Statistics</a></li>
// <li><a href="/customize" data-qa="customize"><i className="ts_icon ts_icon_magic"></i>Customize</a></li>
// <li><a href="/account/team" data-qa="team_settings"><i className="ts_icon ts_icon_cog_o"></i>Team Settings</a></li>