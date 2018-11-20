import { observer } from 'mobx-react';
import React from 'react';
import DayPicker from 'react-day-picker';
import classNames from 'classnames';

import { SleuthState } from '../state/sleuth';

export interface DateRangePickerProps {
  state: SleuthState;
}

export interface DateRangePickerState {
  isOpen: boolean;
}

@observer
export class DateRangePicker extends React.Component<DateRangePickerProps, Partial<DateRangePickerState>> {
  constructor(props: DateRangePickerProps) {
    super(props);

    this.state = {
      isOpen: false
    };

    this.onToggleOpen = this.onToggleOpen.bind(this);
    this.onDayClick = this.onDayClick.bind(this);
  }

  public onToggleOpen() {
    this.setState({ isOpen: !this.state.isOpen });
  }

  public onDayClick(day: Date) {
    this.props.state.dateRange = DayPicker.DateUtils.addDayToRange(day, {
      ...this.props.state.dateRange as any
    });
  }

  public render() {
    const { dateRange } = this.props.state;
    const isEngaged = dateRange && dateRange.from && dateRange.to;

    return (
      <>
        <a
          className={classNames({ Engaged: isEngaged })}
          onClick={() => this.onToggleOpen()}
        >
          <i className='ts_icon ts_icon_calendar' />
          <span className='block label'>Select Dates</span>
        </a>
        {this.renderPicker()}
      </>
    );
  }

  public renderPicker() {
    const isOpen = this.state.isOpen;
    const { dateRange } = this.props.state;
    const modifiers = { start: dateRange.from, end: dateRange.to };
    const selectedDays = [ dateRange.from, { ...dateRange } ];

    return (
      <div className={classNames({ Visible: isOpen, DateRangePicker: true })}>
        <DayPicker
          className='Selectable'
          numberOfMonths={2}
          selectedDays={selectedDays as any}
          modifiers={modifiers}
          onDayClick={this.onDayClick}
        />
      </div>
    );
  }
}
