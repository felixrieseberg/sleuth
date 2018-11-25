import { observer } from 'mobx-react';
import { SleuthState, sleuthState } from '../state/sleuth';
import React from 'react';
import { remote } from 'electron';
import { Alignment, Button, ButtonGroup, Navbar, NavbarGroup } from '@blueprintjs/core';

import { Filter } from './app-core-header-filter';

export interface AppCoreHeaderProps {
  state: SleuthState;
}

export interface AppCoreHeaderState {}

@observer
export class AppCoreHeader extends React.Component<AppCoreHeaderProps, AppCoreHeaderState> {
  constructor(props: AppCoreHeaderProps) {
    super(props);

    this.refresh = this.refresh.bind(this);
    this.toggleDarkMode = this.toggleDarkMode.bind(this);
    this.toggleSidebar = this.toggleSidebar.bind(this);
  }

  public refresh() {
    remote.getCurrentWindow().reload();
  }

  public toggleDarkMode() {
    this.props.state.toggleDarkMode();
  }

  public toggleSidebar() {
    this.props.state.toggleSidebar();
  }

  public render() {
    const { isSidebarOpen, isDarkMode } = this.props.state;
    const sidebarIcon = isSidebarOpen ? 'menu-closed' : 'menu-open';

    return (
      <Navbar className='AppHeader'>
        <NavbarGroup align={Alignment.LEFT}>
          <ButtonGroup>
            <Button onClick={this.refresh} icon='home' />
            <Button active={!isSidebarOpen} onClick={this.toggleSidebar} icon={sidebarIcon} />
            <Button active={isDarkMode} onClick={this.toggleDarkMode} icon='moon' />
          </ButtonGroup>
        </NavbarGroup>
        <Filter state={sleuthState} />
      </Navbar>
    );
  }
}
