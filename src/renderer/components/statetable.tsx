import * as React from 'react';
import * as dirtyJSON from 'jsonic';
import JSONTree from 'react-json-tree';
import * as fs from 'fs-promise';

import { UnzippedFile } from '../unzip';
import { shell } from 'electron';

const debug = require('debug')('sleuth:statetable');

export interface StateTableProps {
  file: UnzippedFile;
}

export interface StateTableState {
  data?: any;
}

export type StateFileType = 'appTeams' | 'teams' | 'dialog' | 'unkown' | 'unreads' | 'settings' | 'windowFrame';

export class StateTable extends React.Component<StateTableProps, StateTableState> {
  constructor(props: StateTableProps) {
    super(props);

    this.state = {};
  }

  public componentDidMount() {
    this.parse(this.props.file);
  }

  public componentWillReceiveProps(nextProps: StateTableProps) {
    const nextFile = nextProps.file;
    const currentFile = this.props.file;

    if (currentFile.fullPath !== nextFile.fullPath) {
      this.parse(nextFile);
    }
  }

  public getFileType(): StateFileType {
    const { file } = this.props;
    const nameMatch = file.fileName.match(/slack-(\w*)/);
    const type = nameMatch && nameMatch.length > 1 ? nameMatch[1] : 'unknown';

    return type as StateFileType;
  }

  public parse(file: UnzippedFile) {
    if (!file) {
      return;
    }

    debug(`Reading ${file.fullPath}`);

    fs.readFile(file.fullPath, 'utf8')
      .then((rawData) => {
        let data;

        try {
          data = JSON.parse(rawData);
        } catch (error) {
          try {
            data = dirtyJSON(rawData);
          } catch (error) {
            data = null;
          }
        }

        this.setState({ data });
      })
      .catch((error) => {
        debug(error);
      });
  }

  /**
   * A super-cool Base16 theme using Slack's 2016 colors.
   *
   * @returns {Object}
   */
  public getTheme() {
    return {
      base00: '#2C2D30',
      base01: '#555459',
      base02: '#8B898F',
      base03: '#88919B',
      base04: '#9e9ea6',
      base05: '#F9F9F9',
      base06: '#F9F9F9',
      base07: '#F9F9F9',
      base08: '#e32072',
      base09: '#F96A38',
      base0A: '#FFA940',
      base0B: '#257337',
      base0C: '#3971ED',
      base0D: '#3971ED',
      base0E: '#71105F',
      base0F: '#4d6dc3'
    };
  }

  public getSearchLink(text: string, query: string): JSX.Element {
    const href = `https://mc.tinyspeck.com/god/search.php?q=${encodeURIComponent(query)}`;
    return (<a onClick={() => shell.openExternal(href)}>{text}</a>);
  }

  public renderWindowFrameInfo(): JSX.Element | null {
    const data = this.state.data || {};
    const windowSettings = data.windowSettings || {};
    const { size, position, isMaximized } = windowSettings;

    const sizeInfo = size && size.length === 2 ? <span>{size[0]}px wide and {size[1]}px tall, </span> : null;
    const posInfo = position && position[1] ? <span>positioned {position[0]}px from the left and {position[1]}px from the top, </span> : null;
    const maximizedInfo = isMaximized ? <span>and maximized.</span> : <span>and not maximized</span>;

    return (
        <div className='StateTable-Info'>
          This user's window is {sizeInfo}{posInfo}{maximizedInfo}.
        </div>
      );
  }

  public renderSettingsInfo(): JSX.Element | null {
    const data = this.state.data || {};
    const { appVersion, versionName, platform, platformVersion, isWin10, isBeforeWin10, pretendNotReallyWindows10, releaseChannel, zoomLevel } = data;

    const version = appVersion ? <span>{appVersion} ({versionName || 'no name'})</span> : null;
    const os = platform ? platform.replace('darwin', 'macOS').replace('win32', 'Windows').replace('linux', 'Linux') : null;
    const osVersion = platformVersion && platformVersion.major ? `(${platformVersion.major}.${platformVersion.minor})` : '(unknown version)';
    const pretendInfo = pretendNotReallyWindows10 ? `but we're pretending it's not` : `and we're not pretending otherwise`;
    const oldWinInfo = isBeforeWin10 ? ` That's an older version of Windows (not 10!).` : '';
    const win10Info = isWin10 ? ` That's Windows 10 (${pretendInfo})` : '';
    const channelInfo = releaseChannel ? ` Updates are coming from the ${releaseChannel} channel.` : '';
    const zoomInfo = zoomLevel === 0 ? ` The app is not zoomed.` : zoomLevel ? ` The app is zoomed (level ${zoomLevel})` : '';

    return (
        <div className='StateTable-Info'>
          <p>This user is running Slack {version} on {os} {osVersion}.{oldWinInfo}{win10Info}{channelInfo}</p>
          <p>{zoomInfo}</p>
        </div>
      );
  }


  public renderTeamsInfo(): JSX.Element | null {
    const { data } = this.state;
    const teams = data ? Object.keys(data).map((k) => data[k]) : null;

    if (!data || !teams) {
      return null;
    }

    const teamLinks: Array<JSX.Element | null> = teams.map((t: any) => {
      if (t && t.team_name && t.team_id && t.user_id) {
        const teamLink = this.getSearchLink(t.team_name, t.team_id);
        const userLink = this.getSearchLink(t.user_id, t.user_id);
        return (<li key={t.team_id}>{teamLink} (as user {userLink})</li>);
      } else {
        return null;
      }
    });

    return (
        <div className='StateTable-Info'>
          This user has {teams.length} teams: <ul>{teamLinks}</ul>.
        </div>
      );
  }

  public renderInfo(): JSX.Element | null {
    const type = this.getFileType();

    if (type === 'teams') {
      return this.renderTeamsInfo();
    } else if (type === 'windowFrame') {
      return this.renderWindowFrameInfo();
    } else if (type === 'settings') {
      return this.renderSettingsInfo();
    }

    return null;
  }

  public render(): JSX.Element {
    const { data } = this.state;

    if (!data) {
      return <div />;
    }

    const theme = this.getTheme();
    const info = this.renderInfo();

    return (
      <div className='StateTable'>
        <div className='StateTable-Content'>
          {info}
          <JSONTree data={data} theme={theme}  />
        </div>
      </div>
    );
  }
}
