import { observer } from 'mobx-react';
import * as React from 'react';
import * as classNames from 'classnames';

import { UnzippedFile } from '../unzip';
import { isEqualArrays } from '../../utils/array-is-equal';
import { MergedFilesLoadStatus, ProcessedLogFile, ProcessedLogFiles } from '../interfaces';

export interface SidebarProps {
  logFiles: ProcessedLogFiles;
  isOpen: boolean;
  selectedLogFileName: string;
  selectLogFile: (logFile: ProcessedLogFile | UnzippedFile | null, logType?: string) => void;
  mergedFilesStatus: MergedFilesLoadStatus;
}

export interface SidebarState {}

@observer
export class Sidebar extends React.Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps) {
    super(props);

    this.renderFile = this.renderFile.bind(this);
    this.renderIcon = this.renderIcon.bind(this);
  }

  public shouldComponentUpdate(next: SidebarProps) {
    const { isOpen, selectedLogFileName, mergedFilesStatus, logFiles } = this.props;

    // Check the defaults first
    if (isOpen !== next.isOpen || selectedLogFileName !== next.selectedLogFileName) {
      return true;
    }

    // Check merge status
    if (
      mergedFilesStatus.all !== next.mergedFilesStatus.all ||
      mergedFilesStatus.browser !== next.mergedFilesStatus.browser ||
      mergedFilesStatus.renderer !== next.mergedFilesStatus.renderer ||
      mergedFilesStatus.webapp !== next.mergedFilesStatus.webapp ||
      mergedFilesStatus.webview !== next.mergedFilesStatus.webview
    ) {
      return true;
    }

    // Ugh, new files? Alright, let's check
    const newNames = this.getLogFileNames(next.logFiles);
    const oldNames = this.getLogFileNames(logFiles);

    if (
      (!oldNames && newNames) ||
      (oldNames && !newNames) ||
      !isEqualArrays(oldNames.browser, newNames.browser) ||
      !isEqualArrays(oldNames.renderer, newNames.renderer) ||
      !isEqualArrays(oldNames.webapp, newNames.webapp) ||
      !isEqualArrays(oldNames.webview, newNames.webview)
    ) {
      return true;
    }

    return false;
  }

  public getLogFileNames(logFiles: ProcessedLogFiles) {
    const getNames = (ob: Array<ProcessedLogFile>) => {
      return ob.map((l) => l && l.logFile && l.logFile.fileName ? l.logFile.fileName : null)
        .filter((e) => e);
    };

    if (!logFiles) {
      return {
        browser: [],
        renderer: [],
        webapp: [],
        webview: [],
        call: []
      };
    }

    return {
      browser: getNames(logFiles.browser),
      renderer: getNames(logFiles.renderer),
      webapp: getNames(logFiles.webapp),
      webview: getNames(logFiles.webview),
      call: getNames(logFiles.call)
    };
  }

  /**
   * Renders a single file inside the sidebar.
   *
   * @param {ProcessedLogFile} file
   * @returns {JSX.Element}
   */
  public renderLogFile(file: ProcessedLogFile): JSX.Element {
    const { selectLogFile, selectedLogFileName } = this.props;
    const isSelected = (selectedLogFileName === file.logFile.fileName);
    const className = classNames({ Selected: isSelected });

    return (
        <li key={file.logFile.fileName}>
          <a onClick={() => selectLogFile(file)} className={className}>
              <i className='ts_icon ts_icon_file LogFile' />{file.logFile.fileName}
          </a>
        </li>
        );
  }

  public renderStateFile(file: UnzippedFile): JSX.Element {
    const { selectLogFile, selectedLogFileName } = this.props;
    const isSelected = (selectedLogFileName === file.fileName);
    const className = classNames({ Selected: isSelected });

    let name;
    if (file.fileName.endsWith('gpu-log.html')) {
      name = 'gpuLog';
    } else {
      const nameMatch = file.fileName.match(/slack-(\w*)/);
      name = nameMatch && nameMatch.length > 1 ? nameMatch[1] : file.fileName;
    }

    return (
        <li key={file.fileName}>
          <a onClick={() => selectLogFile(file)} className={className}>
              <i className='ts_icon ts_icon_file LogFile' />{name}
          </a>
        </li>
        );
  }

  public renderFile(file: ProcessedLogFile | UnzippedFile) {
    if ((file as ProcessedLogFile).type === 'ProcessedLogFile') {
      // It's a log file
      return this.renderLogFile(file as ProcessedLogFile);
    } else {
      // it's a state file
      return this.renderStateFile(file as UnzippedFile);
    }
  }

  public renderIcon(logType: string): JSX.Element | null {
    const { mergedFilesStatus } = this.props;

    if (mergedFilesStatus[logType]) {
      if (logType === 'browser') {
        return <i className='ts_icon ts_icon_power_off' />;
      } else if (logType === 'renderer') {
        return <i className='ts_icon ts_icon_laptop' />;
      } else if (logType === 'webview') {
        return <i className='ts_icon ts_icon_all_files_alt' />;
      } else if (logType === 'all') {
        return <i className='ts_icon ts_icon_archive' />;
      }
    }

    return (<svg className='ts_icon ts_icon_spin ts_icon_spinner'><use xlinkHref='./img/starburst.svg#starburst_svg'/></svg>);
  }

  public render(): JSX.Element {
    const { isOpen, selectLogFile, selectedLogFileName, logFiles, mergedFilesStatus } = this.props;
    const className = classNames('Sidebar', { nav_open: isOpen });

    const getSelectedClassName = (logType: string) => {
      const stillLoading = logType !== 'webapp' && !mergedFilesStatus[logType];
      const selected = (selectedLogFileName === logType);
      return classNames({ Selected: selected, StillLoading: stillLoading });
    };

    const stateFiles = logFiles.state.map(this.renderFile.bind(this));
    const browserFiles = logFiles.browser.map(this.renderFile.bind(this));
    const rendererFiles = logFiles.renderer.map(this.renderFile.bind(this));
    const webappFiles = logFiles.webapp.map(this.renderFile.bind(this));
    const webviewFiles = logFiles.webview.map(this.renderFile.bind(this));
    const callFiles = logFiles.call.map(this.renderFile.bind(this));

    return (
      <div className={className}>
        <nav id='site_nav'>
          <div id='site_nav_contents'>
            <div className='nav_contents'>
              <ul className='primary_nav'>
                <li className='MenuTitle MenuTitle-Webapp'>
                  <a>
                    <i className='ts_icon ts_icon_filter' />State
                  </a>
                </li>
                {stateFiles}
              </ul>
              <ul className='primary_nav'>
                <li className='MenuTitle MenuTitle-all'>
                  <a onClick={() => selectLogFile(null, 'all')} className={getSelectedClassName('all')}>
                    {this.renderIcon('all')}All Desktop Log Files
                  </a>
                </li>
              </ul>
              <ul className='primary_nav'>
                <li className='MenuTitle MenuTitle-Browser'>
                  <a onClick={() => selectLogFile(null, 'browser')} className={getSelectedClassName('browser')}>
                    {this.renderIcon('browser')}Browser Process
                  </a>
                </li>
                {browserFiles}
              </ul>
              <ul className='primary_nav'>
                <li className='MenuTitle MenuTitle-Renderer'>
                  <a onClick={() => selectLogFile(null, 'renderer')} className={getSelectedClassName('renderer')}>
                    {this.renderIcon('renderer')}Renderer Process
                  </a>
                </li>
                {rendererFiles}
              </ul>
              <ul className='primary_nav'>
                <li className='MenuTitle MenuTitle-Webview'>
                  <a onClick={() => selectLogFile(null, 'webview')} className={getSelectedClassName('webview')}>
                    {this.renderIcon('webview')}BrowserView Process
                  </a>
                </li>
                {webviewFiles}
              </ul>
              <ul className='primary_nav'>
                <li className='MenuTitle MenuTitle-Call'>
                  <a onClick={() => selectLogFile(null, 'call')} className={getSelectedClassName('call')}>
                    <i className='ts_icon ts_icon_phone' />Call
                  </a>
                </li>
                {callFiles}
              </ul>
              <ul className='primary_nav'>
                <li className='MenuTitle MenuTitle-Webapp'>
                  <a onClick={() => selectLogFile(null, 'webapp')} className={getSelectedClassName('webapp')}>
                    <i className='ts_icon ts_icon_globe' />WebApp
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
