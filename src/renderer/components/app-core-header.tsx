import { observer } from 'mobx-react';
import { SleuthState } from '../state/sleuth';
import React from 'react';
import { Alignment, Button, ButtonGroup, Navbar, NavbarGroup } from '@blueprintjs/core';

import { Filter } from './app-core-header-filter';

export interface AppCoreHeaderProps {
  state: SleuthState;
}

export interface AppCoreHeaderState {}

@observer
export class AppCoreHeader extends React.Component<AppCoreHeaderProps, AppCoreHeaderState> {
  public render() {
    const {
      isSidebarOpen,
      isDarkMode,
      isSpotlightOpen,
      toggleDarkMode,
      toggleSidebar,
      toggleSpotlight,
      reset
    } = this.props.state;
    const sidebarIcon = isSidebarOpen ? 'menu-closed' : 'menu-open';

    return (
      <Navbar className='AppHeader'>
        <NavbarGroup align={Alignment.LEFT}>
          <ButtonGroup>
            <Button onClick={() => reset(true)} icon='home' />
            <Button active={!isSidebarOpen} onClick={toggleSidebar} icon={sidebarIcon} />
            <Button active={isDarkMode} onClick={toggleDarkMode} icon='moon' />
            <Button active={isSpotlightOpen} onClick={toggleSpotlight} icon='geosearch' />
          </ButtonGroup>
        </NavbarGroup>
        <Filter state={this.props.state} />
      </Navbar>
    );
  }
}
