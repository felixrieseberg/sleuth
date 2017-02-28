import * as React from 'react';
import * as classNames from 'classnames';
import { remote } from 'electron';

import { Filter } from './filter-select';

export interface LogViewHeaderProps {
  menuToggle: Function;
  onFilterToggle: Function;
  onSearchChange: Function;
}

export class LogViewHeader extends React.Component<LogViewHeaderProps, undefined> {
  constructor(props: LogViewHeaderProps) {
    super(props);

    this.refresh = this.refresh.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
  }

  public onSearchChange(e: React.FormEvent) {
    const { onSearchChange } = this.props;

    if (onSearchChange && e && e.target) {
      onSearchChange((e.target as any).value || '');
    }
  }

  public refresh() {
    remote.getCurrentWindow().reload();
  }

  public render() {
    const { onFilterToggle } = this.props;
    const logViewHeaderClassName = classNames('headroom', 'headroom--pinned', 'headroom--top');

    return (
      <header className={logViewHeaderClassName}>
        <a id='menu_toggle' onClick={() => this.props.menuToggle()}>
          <span className='menu_icon'></span>
          <span className='menu_label'>Menu</span>
          <span className='vert_divider'></span>
        </a>
        <h1 id='header_team_name' className='inline_block'>
          <a onClick={this.refresh}>
            <i className='ts_icon ts_icon_home'></i>
          </a>
        </h1>
        <div className='header_btns float_right'>
          <Filter onSearchChange={this.onSearchChange} onFilterToggle={onFilterToggle} />
        </div>
      </header>
    );
  }
}
