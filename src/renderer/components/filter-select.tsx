import { LevelFilter } from '../interfaces';
import * as React from 'react';
import * as classNames from 'classnames';
import * as debounce from 'debounce';

export interface FilterProps {
  onFilterToggle: Function;
  onSearchChange: React.EventHandler<React.FormEvent>;
}

export interface FilterState {
  filter: LevelFilter;
  isSearchVisible: boolean;
}

export class Filter extends React.Component<FilterProps, Partial<FilterState>> {
  constructor(props: FilterProps) {
    super(props);

    this.state = {
      filter: {
        error: false,
        warning: false,
        debug: false,
        info: false
      },
      isSearchVisible: false
    };

    this.onFilterToggle = this.onFilterToggle.bind(this);
    this.onToggleSearch = debounce(this.onToggleSearch.bind(this), 700);
  }

  public onFilterToggle(level: string) {
    if (this.state.filter![level] !== undefined) {
      const filter = {...this.state.filter};
      filter[level] = !filter[level];
      this.setState({ filter });
    }

    this.props.onFilterToggle(level);
  }

  public onToggleSearch() {
    this.setState({ isSearchVisible: !this.state.isSearchVisible });
  }

  public render() {
    const { onSearchChange } = this.props;
    const { isSearchVisible } = this.state;
    const { error, warning, info, debug } = this.state.filter!;

    if (isSearchVisible) {
      return (
        <div id='search_container'>
            <form role='search' id='header_search_form' className='search_form no_bottom_margin'>
              <div className='icon_search_wrapper'>
                <i className='ts_icon ts_icon_search icon_search' />
              </div>
              <div className='search_input_wrapper'>
                  <input type='text' onChange={onSearchChange} id='search_terms' className='search_input' placeholder='Search' />
              </div>
            </form>
            <a onClick={() => this.onToggleSearch()}>
              <i className='ts_icon ts_icon_times_circle' />
            </a>
        </div>
      );
    }

    return (
      <div>
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
}
