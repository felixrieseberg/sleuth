import { observer } from 'mobx-react';
import { SleuthState, sleuthState } from '../state/sleuth';
import React from 'react';
import { remote } from 'electron';
import { Alignment, Button, Classes, Navbar, NavbarDivider, NavbarGroup, NavbarHeading } from '@blueprintjs/core';

import { Filter } from './app-core-header-filter';

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
    return (
      <Navbar className='AppHeader'>
        <NavbarGroup align={Alignment.LEFT}>
          <NavbarHeading>Sleuth</NavbarHeading>
          <NavbarDivider />
          <Button className={Classes.MINIMAL} onClick={this.refresh} icon='home' text='Home' />
        </NavbarGroup>
        <Filter state={sleuthState} />
      </Navbar>
    );
  }
}

{/* <header className={appCoreHeaderClassName}>
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
      </header> */}