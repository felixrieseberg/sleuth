import * as React from 'react';
import * as classNames from 'classnames';

import { remote } from 'electron';

export interface LogViewHeaderProps {
  menuToggle: Function;
}

export interface LogViewHeaderState {
}

export class LogViewHeader extends React.Component<LogViewHeaderProps, LogViewHeaderState> {
  constructor(props: LogViewHeaderProps) {
    super(props);

    this.state = {};
    this.refresh = this.refresh.bind(this);
  }

  public refresh() {
    remote.getCurrentWindow().reload();
  }

  public render() {
    const logViewHeaderClassName = classNames('headroom', 'headroom--pinned', 'headroom--top');

    return (
      <header className={logViewHeaderClassName}>
        <a id="menu_toggle" onClick={() => this.props.menuToggle()}>
          <span className="menu_icon"></span>
          <span className="menu_label">Menu</span>
          <span className="vert_divider"></span>
        </a>
        <h1 id="header_team_name" className="inline_block" data-qa="header_team_name">
          <a onClick={this.refresh}>
            <i className="ts_icon ts_icon_home"></i> Slack Log Viewer
          </a>
        </h1>
      </header>
    );
  }
}
