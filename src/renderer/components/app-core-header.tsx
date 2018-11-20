import { observer } from 'mobx-react';
import { SleuthState, sleuthState } from '../state/sleuth';
import React from 'react';
import classNames from 'classnames';
import { remote } from 'electron';

import { Filter } from './filter-select';

export interface AppCoreHeaderProps {
  menuToggle: () => void;
  state: SleuthState;
}

export interface AppCoreHeaderState {}

@observer
export class AppCoreHeader extends React.Component<AppCoreHeaderProps, AppCoreHeaderState> {
  constructor(props: AppCoreHeaderProps) {
    super(props);

    this.refresh = this.refresh.bind(this);
  }

  public refresh() {
    remote.getCurrentWindow().reload();
  }

  public render() {
    const appCoreHeaderClassName = classNames('headroom', 'headroom--pinned', 'headroom--top');

    return (
      <header className={appCoreHeaderClassName}>
        <a id='menu_toggle' onClick={() => this.props.menuToggle()}>
          <span className='menu_label'>Menu</span>
          <span className='vert_divider' />
        </a>
        <h1 id='header_team_name' className='inline_block'>
          <a onClick={this.refresh}>
            <i className='ts_icon ts_icon_home' />
          </a>
        </h1>
        <div className='header_btns float_right'>
          <Filter state={sleuthState} />
        </div>
      </header>
    );
  }
}
