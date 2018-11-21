import { observer } from 'mobx-react';
import React from 'react';
import classNames from 'classnames';
import debounce from 'debounce';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Alignment, Button, Classes, Navbar, NavbarDivider, NavbarGroup, NavbarHeading, ButtonGroup } from '@blueprintjs/core';

import { SleuthState } from '../state/sleuth';
import { DateRangePicker } from './date-range-picker';

export interface FilterProps {
  state: SleuthState;
}

export interface FilterState {
  isSearchVisible: boolean;
}

@observer
export class Filter extends React.Component<FilterProps, Partial<FilterState>> {
  constructor(props: FilterProps) {
    super(props);

    this.state = {
      isSearchVisible: false
    };

    this.onFilterToggle = this.onFilterToggle.bind(this);
    this.onToggleSearch = this.onToggleSearch.bind(this);
    this.onToggleSearchResultVisibility = this.onToggleSearchResultVisibility.bind(this);
    this.onSearchChange = debounce(this.onSearchChange.bind(this), 700);
  }

  public onSearchChange(value: string) {
    this.props.state.search = value;
  }

  public onFilterToggle(level: string) {
    if (this.props.state.levelFilter![level] !== undefined) {
      const filter = {...this.props.state.levelFilter};
      filter[level] = !filter[level];

      this.props.state.levelFilter = filter;
    }
  }

  public onToggleSearch() {
    this.props.state.search = '';
    this.setState({ isSearchVisible: !this.state.isSearchVisible });
  }

  public onToggleSearchResultVisibility() {
    this.props.state.showOnlySearchResults = !this.props.state.showOnlySearchResults;
  }

  public onSearchIndexChange(change: number) {
    this.props.state.searchIndex = this.props.state.searchIndex + change;
  }

  public render() {
    const { isSearchVisible } = this.state;
    const { showOnlySearchResults } = this.props.state;
    const { error, warn, info, debug } = this.props.state.levelFilter!;
    let items;

    if (isSearchVisible) {
      items = (
        <div>
          <div key='menu' className='SearchButtons'>
            <a
              className={classNames({ Engaged: showOnlySearchResults })}
              onClick={() => this.onToggleSearchResultVisibility()}
            >
              <i className='ts_icon ts_icon_eye' />
              <span className='block label'>Show only results</span>
            </a>
            <a
              onClick={() => this.onSearchIndexChange(-1)}
            >
              <i className='ts_icon ts_icon_chevron_circle_left' />
              <span className='block label'>Prev</span>
            </a>
            <a
              onClick={() => this.onSearchIndexChange(1)}
            >
              <i className='ts_icon ts_icon_chevron_circle_right' />
              <span className='block label'>Next</span>
            </a>
          </div>
          <span className='vert_divider SearchDivider' />
          <div key='search' id='search_container' className='SearchContainer'>
              <form onSubmit={(e) => e.preventDefault()} role='search' id='header_search_form' className='search_form no_bottom_margin'>
                <div className='icon_search_wrapper'>
                  <i className='ts_icon ts_icon_search icon_search' />
                </div>
                <div className='search_input_wrapper'>
                  <input
                    type='text'
                    autoFocus={true}
                    onChange={(e) => this.onSearchChange((e.target as any).value)}
                    id='search_terms'
                    className='search_input'
                    placeholder='Search'
                  />
                </div>
              </form>
              <a onClick={this.onToggleSearch}>
                <i className='ts_icon ts_icon_times_circle' />
              </a>
          </div>
        </div>
      );
    } else {
      items = (
        <NavbarGroup align={Alignment.RIGHT}>
          <ButtonGroup>
            <Button active={error} onClick={() => this.onFilterToggle('error')} icon='error' text='Filter Error' />
            <Button active={warn} onClick={() => this.onFilterToggle('warn')} icon='warning-sign' text='Filter Warning' />
            <Button active={info} onClick={() => this.onFilterToggle('info')} icon='info-sign' text='Filter Info' />
            <Button active={debug} onClick={() => this.onFilterToggle('debug')} icon='code' text='Filter Debug' />
          </ButtonGroup>
          <NavbarDivider />
          <ButtonGroup>
            <Button onClick={() => this.onToggleSearch()} icon='moon' />
            <Button onClick={() => this.onToggleSearch()} icon='search' />
          </ButtonGroup>
        </NavbarGroup>
      );
    }

    return (
      <ReactCSSTransitionGroup
        transitionName='filter'
        transitionEnterTimeout={250}
        transitionLeaveTimeout={250}
      >
        {items}
      </ReactCSSTransitionGroup>
    );
  }
}
