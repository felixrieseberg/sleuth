import { LevelFilter } from '../interfaces';
import * as React from 'react';
import * as classNames from 'classnames';

export interface FilterProps {
  filterToggle: Function;
  filter: LevelFilter;
}

export interface FilterState extends LevelFilter { }

export class Filter extends React.Component<FilterProps, FilterState> {
  constructor(props: FilterProps) {
    super(props);

    this.state = {
      error: false,
      warning: false,
      debug: false,
      info: false
    };

    this.filterToggle = this.filterToggle.bind(this);
  }

  public filterToggle(level: string) {
    if (this.state[level] !== undefined) {
      const newState = {...this.state};
      newState[level] = !newState[level];
      this.setState({...newState});
    }

    this.props.filterToggle(level);
  }

  public render() {
    const { error, warning, info, debug } = this.state;

    return (
      <div>
        <a className={classNames({ Engaged: error })} onClick={() => this.filterToggle('error')}>
          <i className='ts_icon ts_icon_th_large 	ts_icon_poo'></i>
          <span className='block label'>Filter Error</span>
        </a>
        <a className={classNames({ Engaged: warning })} onClick={() => this.filterToggle('warning')}>
          <i className='ts_icon ts_icon_th_large ts_icon_warning'></i>
          <span className='block label'>Filter Warning</span>
        </a>
        <a className={classNames({ Engaged: info })} onClick={() => this.filterToggle('info')}>
          <i className='ts_icon ts_icon_th_large ts_icon_info_circle'></i>
          <span className='block label'>Filter Info</span>
        </a>
        <a className={classNames({ Engaged: debug })} onClick={() => this.filterToggle('debug')}>
          <i className='ts_icon ts_icon_th_large ts_icon_filter'></i>
          <span className='block label'>Filter Debug</span>
        </a>
      </div>
    );
  }
}
