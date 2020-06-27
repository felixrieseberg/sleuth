import React from 'react';
import fs from 'fs-extra';
import { shell } from 'electron';
import { Card, Elevation } from '@blueprintjs/core';

import { SelectableLogFile, UnzippedFile } from '../../interfaces';
import { SleuthState } from '../state/sleuth';
import { getSettingsInfo } from '../analytics/settings-analytics';
import { getEnvInfo } from '../analytics/environment-analytics';
import { getLocalSettingsInfo } from '../analytics/local-settings-analytics';
import { getNotifWarningsInfo } from '../analytics/notification-warning-analytics';
import { JSONView } from './json-view';
import { parseJSON } from '../../utils/parse-json';
import { getFontForCSS } from './preferences-font';
import { isTruthy } from '../../utils/is-truthy';
import { plural } from '../../utils/pluralize';
import { getBacktraceHref, convertInstallation } from '../backtrace';

const debug = require('debug')('sleuth:statetable');

export interface StateTableProps {
  state: SleuthState;
}

export interface StateTableState {
  data?: any;
  path?: string;
  raw?: string;
}

export type StateFileType = 'appTeams' |
  'workspaces' |
  'teams' |
  'dialog' |
  'unknown' |
  'unreads' |
  'settings' |
  'windowFrame' |
  'html' |
  'notifs' |
  'installation' |
  'environment' |
  'localSettings';

export class StateTable extends React.Component<StateTableProps, StateTableState> {
  constructor(props: StateTableProps) {
    super(props);

    this.state = {};
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

  public render(): JSX.Element {
    const { data, path, raw } = this.state;
    const { font } = this.props.state;

    const info = this.renderInfo();
    const type = this.getFileType();
    const onIFrameLoad = function(this: HTMLIFrameElement) {
      if (this) {
        const { document: idoc } = this.contentWindow!;
        this.height = `${idoc.body.scrollHeight}px`;
      }
    };

    const content = (!data && path)
      ? <iframe sandbox='' onLoad={onIFrameLoad} src={path} />
      : type === 'installation' ? null : <JSONView data={data} raw={raw} state={this.props.state} />;
    const contentCard =  type === 'installation' ? <div/> : <Card> {content} </Card>;

    return (
      <div className='StateTable' style={{ fontFamily: getFontForCSS(font) }}>
        <div className='StateTable-Content'>
          {info}
          {contentCard}
        </div>
      </div>
    );
  }

  private getFileType(): StateFileType {
    const { selectedLogFile } = this.props.state;

    if (!this.isStateFile(selectedLogFile)) {
      throw new Error('StateTable: No file');
    }

    if (this.isHtmlFile(selectedLogFile)) {
      return 'html' as StateFileType;
    }

    if (this.isNotifsFile(selectedLogFile)) {
      return 'notifs' as StateFileType;
    }

    if (this.isInstallationFile(selectedLogFile)) {
      return 'installation' as StateFileType;
    }

    if (selectedLogFile.fileName === 'environment.json') {
      return 'environment' as StateFileType;
    }

    if (selectedLogFile.fileName === 'local-settings.json') {
      return 'localSettings' as StateFileType;
    }

    const nameMatch = selectedLogFile.fileName.match(/slack-(\w*)/);
    const type = nameMatch && nameMatch.length > 1 ? nameMatch[1] : 'unknown';

    return type as StateFileType;
  }

  private async parse(file: UnzippedFile) {
    if (!file) {
      return;
    }

    debug(`Reading ${file.fullPath}`);

    if (this.isHtmlFile(file)) {
      this.setState({ data: undefined, path: file.fullPath });
      return;
    }

    if (this.isInstallationFile(file)) {
      try {
        const content = await fs.readFile(file.fullPath, 'utf8');
        this.setState({ data: [ content ], path: undefined });
      } catch (error) {
        debug(error);
      }
      return;
    }

    try {
      const raw = await fs.readFile(file.fullPath, 'utf8');
      this.setState({ data: parseJSON(raw), path: undefined, raw });
    } catch (error) {
      debug(error);
    }
  }

  private getSearchLink(text: string, query: string): JSX.Element {
    const href = `https://mc.tinyspeck.com/god/search.php?q=${encodeURIComponent(query)}`;
    return (<a onClick={() => shell.openExternal(href)}>{text}</a>);
  }

  private renderWindowFrameInfo(): JSX.Element | null {
    const data = this.state.data || {};
    const windowSettings = data.windowSettings || {};
    const { size, position, isMaximized } = windowSettings;

    const sizeInfo = size && size.length === 2 ? <span>{size[0]}px wide and {size[1]}px tall, </span> : null;
    const posInfo = position && position[1] ? <span>positioned {position[0]}px from the left and {position[1]}px from the top, </span> : null;
    const maximizedInfo = isMaximized ? <span>and maximized.</span> : <span>and not maximized</span>;

    return (
        <Card className='StateTable-Info'>
          This user's window is {sizeInfo}{posInfo}{maximizedInfo}.
        </Card>
      );
  }

  private renderSettingsInfo(): JSX.Element | null {
    return (
        <Card className='StateTable-Info' elevation={Elevation.ONE}>
          {...getSettingsInfo(this.state.data || {})}
        </Card>
      );
  }

  private renderWorkspacesInfo(): JSX.Element | null {
    const { data } = this.state;
    const teams = data ? Object.keys(data).map((k) => data[k]) : null;

    if (!data || !teams) {
      return null;
    }

    const workspaceLinks = this.renderTeamsLinks(teams);
    const orgLinks = this.renderEnterprisesLinks(teams);

    const workspaceText = workspaceLinks.length > 0
      ? <p>This user has {workspaceLinks.length} {plural('workspace', workspaceLinks)}: <ul>{workspaceLinks}</ul>.</p>
      : <p>This user is not signed into any workspaces.</p>;

    const enterpriseText = orgLinks.length > 0
      ? <p>This user has {orgLinks.length} {plural('enterprise', orgLinks)}: <ul>{orgLinks}</ul>.</p>
      : <p>This user is not signed into any enterprise organizations.</p>;

    return (
        <Card className='StateTable-Info' elevation={Elevation.TWO}>
          {workspaceText}
          {enterpriseText}
        </Card>
      );
  }

  private renderTeamsLinks(teams: Array<any>): Array<JSX.Element> {
    return teams.map((t: any) => {
      // The old format has team_id and user_id, the new format (Sonic)
      // has only id
      if (t && t.team_name && t.team_id && t.user_id) {
        const teamLink = this.getSearchLink(t.team_name, t.team_id);
        const userLink = this.getSearchLink(t.user_id, t.user_id);
        return (<li key={t.team_id}>{teamLink} (as user {userLink})</li>);
      } else if (t && t.id && t.name) {
        const teamLink = this.getSearchLink(t.name, t.id);
        return (<li key={t.team_id}>{teamLink}</li>);
      } else {
        return null;
      }
    }).filter(isTruthy);
  }

  private renderEnterprisesLinks(teams: Array<any>): Array<JSX.Element> {
    return teams.map((t: any) => {
      if (t && t.enterprise_id && t.enterprise_name) {
        const enterpriseLink = this.getSearchLink(t.enterprise_name, t.enterprise_id);
        return (<li key={t.enterprise_id}>{enterpriseLink}</li>);
      } else {
        return null;
      }
    }).filter(isTruthy)
      // Each team in the enterprise will have the enterprise,
      // so this is a simple way of making the array unique
      .reduce<Array<JSX.Element>>((previous, current) => {
        if (!previous.find((s) => s.key === current.key)) {
          previous.push(current);
        }

        return previous;
      }, []);
  }

  private renderNotifsInfo(): JSX.Element | null {
    const { data } = this.state;

    if (!Array.isArray(data) || data.length === 0) {
      return (
        <Card className='StateTable-Info'>
          No notification warnings were found!
        </Card>
      );
    }

    return (
      <Card className='StateTable-Info'>
        {...getNotifWarningsInfo(data || {})}
      </Card>
    );
  }

  private renderInstallationInfo(): JSX.Element | null {
    const { data } = this.state;

    if (Array.isArray(data) && data.length > 0) {
      const id = convertInstallation(data[0]);
      const href = getBacktraceHref(id);

      return (
        <Card className='StateTable-Info'>
          See exceptions in Backtrace: <a onClick={() => shell.openExternal(href)}>{id}</a>
        </Card>
      );
    }

    return (
      <Card className='StateTable-Info'>
        No installation id found.
      </Card>
    );
  }

  private renderEnvironmentInfo(): JSX.Element | null {
    return (
      <Card className='StateTable-Info' elevation={Elevation.ONE}>
        {...getEnvInfo(this.state.data || {})}
      </Card>
    );
  }

  private renderLocalSettings(): JSX.Element | null {
    return (
      <Card className='StateTable-Info' elevation={Elevation.ONE}>
        {...getLocalSettingsInfo(this.state.data || {})}
      </Card>
    );
  }

  private renderInfo(): JSX.Element | null {
    const type = this.getFileType();

    if (type === 'teams' || type === 'workspaces') {
      return this.renderWorkspacesInfo();
    } else if (type === 'windowFrame') {
      return this.renderWindowFrameInfo();
    } else if (type === 'settings') {
      return this.renderSettingsInfo();
    } else if (type === 'notifs') {
      return this.renderNotifsInfo();
    } else if (type === 'installation') {
      return this.renderInstallationInfo();
    } else if (type === 'environment') {
      return this.renderEnvironmentInfo();
    } else if (type === 'localSettings') {
      return this.renderLocalSettings();
    }

    return null;
  }

  private isStateFile(file?: SelectableLogFile): file is UnzippedFile {
    const _file = file as UnzippedFile;
    return !!_file.fullPath;
  }

  private isHtmlFile(file: UnzippedFile) {
    return file.fullPath.endsWith('.html');
  }

  private isNotifsFile(file: UnzippedFile) {
    return file.fullPath.endsWith('notification-warnings.json');
  }

  private isInstallationFile(file: UnzippedFile) {
    return file.fullPath.endsWith('installation');
  }
}
