import { SleuthState } from '../state/sleuth';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as classNames from 'classnames';
import * as debounce from 'debounce';
import * as ReactCSSTransitionGroup from 'react-addons-css-transition-group';

export interface FilterProps {
  state: SleuthState
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
    const { error, warning, info, debug } = this.props.state.levelFilter!;
    let items;

    if (isSearchVisible) {
      items = (
        <div>
          <div key='menu' className='SearchButtons'>
            <a
              className={classNames({ Engaged: showOnlySearchResults })}
              onClick={() => this.onToggleSearchResultVisibility()}>
              <i className='ts_icon ts_icon_eye' />
              <span className='block label'>Show only results</span>
            </a>
            <a
              onClick={() => this.onSearchIndexChange(-1)}>
              <i className='ts_icon ts_icon_chevron_circle_left' />
              <span className='block label'>Prev</span>
            </a>
            <a
              onClick={() => this.onSearchIndexChange(1)}>
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
                    autoFocus
                    onChange={(e) => this.onSearchChange(e.target.value)}
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
        <div key='menu' className='FilterButtons'>
          <a onClick={() => this.onToggleSearch()}>
            <i className='ts_icon ts_icon_search' />
            <span className='block label'>Search</span>
          </a>
          <a className={classNames({ Engaged: error })} onClick={() => this.onFilterToggle('error')}>
            <i className='ts_icon ts_icon_poo' />
            <span className='block label'>Filter Error</span>
          </a>
          <a className={classNames({ Engaged: warning })} onClick={() => this.onFilterToggle('warning')}>
            <i className='ts_icon ts_icon_warning' />
            <span className='block label'>Filter Warning</span>
          </a>
          <a className={classNames({ Engaged: info })} onClick={() => this.onFilterToggle('info')}>
            <i className='ts_icon ts_icon_info_circle' />
            <span className='block label'>Filter Info</span>
          </a>
          <a className={classNames({ Engaged: debug })} onClick={() => this.onFilterToggle('debug')}>
            <i className='ts_icon ts_icon_filter' />
            <span className='block label'>Filter Debug</span>
          </a>
        </div>
      );
    }

    return (
      <ReactCSSTransitionGroup
        transitionName='filter'
        transitionEnterTimeout={250}
        transitionLeaveTimeout={250}>
        {items}
      </ReactCSSTransitionGroup>
    )
  }
}
