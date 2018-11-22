import { observer } from 'mobx-react';
import { SleuthState, sleuthState } from '../state/sleuth';
import React from 'react';
import { remote } from 'electron';
import { Alignment, Button, ButtonGroup, Navbar, NavbarGroup } from '@blueprintjs/core';

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
    this.toggleDarkMode = this.toggleDarkMode.bind(this);
  }

  public refresh() {
    remote.getCurrentWindow().reload();
  }

  public toggleDarkMode() {
    this.props.state.toggleDarkMode();
  }

  public render() {
    return (
      <Navbar className='AppHeader'>
        <NavbarGroup align={Alignment.LEFT}>
          <ButtonGroup>
            <Button onClick={this.refresh} icon='home' />
            <Button active={this.props.state.isDarkMode} onClick={this.toggleDarkMode} icon='moon' />
          </ButtonGroup>
        </NavbarGroup>
        <Filter state={sleuthState} />
      </Navbar>
    );
  }
}
