import * as React from 'react';
import * as dirtyJSON from 'jsonic';
import JSONTree from 'react-json-tree';
import * as fs from 'fs-extra';
import { shell } from 'electron';

import { MergedLogFile, ProcessedLogFile } from '../interfaces';
import { SleuthState } from '../state/sleuth';
import { getSettingsInfo } from '../analytics/settings-analytics';
import { getNotifWarningsInfo } from '../analytics/notification-warning-analytics';
import { UnzippedFile } from '../unzip';

const debug = require('debug')('sleuth:statetable');

export interface StateTableProps {
  state: SleuthState;
}

export interface StateTableState {
  data?: any;
  path?: string;
}

export type StateFileType = 'appTeams' | 'teams' | 'dialog' | 'unknown' | 'unreads' | 'settings' | 'windowFrame' | 'html' | 'notifs';

export class StateTable extends React.Component<StateTableProps, StateTableState> {
  constructor(props: StateTableProps) {
    super(props);

    this.state = {};
  }

  public isStateFile(file?: ProcessedLogFile | MergedLogFile | UnzippedFile): file is UnzippedFile {
    const _file = file as UnzippedFile;
    return !!_file.fullPath;
  }

  public isHtmlFile(file: UnzippedFile) {
    return file.fullPath.endsWith('.html');
  }

  public isNotifsFile(file: UnzippedFile) {
    return file.fullPath.endsWith('notification-warnings.json');
  }

  public componentDidMount() {
    const { selectedLogFile } = this.props.state;

    if (this.isStateFile(selectedLogFile)) {
      this.parse(selectedLogFile);
    }
  }

  public componentWillReceiveProps(nextProps: StateTableProps) {
    const nextFile = nextProps.state.selectedLogFile;

    if (this.isStateFile(nextFile)) {
      this.parse(nextFile);
    }
  }

  public getFileType(): StateFileType {
    const { selectedLogFile } = this.props.state;

    if (!this.isStateFile(selectedLogFile)) throw new Error('StateTable: No file');

    if (this.isHtmlFile(selectedLogFile)) {
      return 'html' as StateFileType;
    }

    if (this.isNotifsFile(selectedLogFile)) {
      return 'notifs' as StateFileType;
    }

    const nameMatch = selectedLogFile.fileName.match(/slack-(\w*)/);
    const type = nameMatch && nameMatch.length > 1 ? nameMatch[1] : 'unknown';

    return type as StateFileType;
  }

  public parse(file: UnzippedFile) {
    if (!file) {
      return;
    }

    debug(`Reading ${file.fullPath}`);

    if (this.isHtmlFile(file)) {
      this.setState({ data: undefined, path: file.fullPath });
      return;
    }

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

        this.setState({ data, path: undefined });
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

    return (
        <div className='StateTable-Info'>
          {...getSettingsInfo(this.state.data || {})}
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

  public renderNotifsInfo(): JSX.Element | null {
    const { data } = this.state;

    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className='StateTable-Warning-Info'>
          No notification warnings were found!
        </div>
      );
    }

    return (
      <div className='StateTable-Warning-Info'>
        {...getNotifWarningsInfo(data || {})}
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
    } else if (type === 'notifs') {
      return this.renderNotifsInfo();
    }

    return null;
  }

  public render(): JSX.Element {
    const { data, path } = this.state;

    if (!data && !path) {
      return <div />;
    }

    const theme = this.getTheme();
    const info = this.renderInfo();
    const onIFrameLoad = function(this: HTMLIFrameElement) {
      if (this) {
        const { document: idoc } = this.contentWindow!;
        this.height = `${idoc.body.scrollHeight}px`;
      }
    };

    const content = (!data && path)
      ? <iframe onLoad={onIFrameLoad} src={path} />
      : <JSONTree data={data} theme={theme} />;

    return (
      <div className='StateTable' style={{ fontFamily: this.props.state.font }}>
        <div className='StateTable-Content'>
          {info}
          {content}
        </div>
      </div>
    );
  }
}
