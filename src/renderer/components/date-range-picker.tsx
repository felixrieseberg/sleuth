import { observer } from 'mobx-react';
import * as React from 'react';
import DayPicker from 'react-day-picker';
import * as classNames from 'classnames';

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
    const range = DayPicker.DateUtils.addDayToRange(day, {
      from: this.props.state.dateFrom!,
      to: this.props.state.dateTo!
    });

    this.props.state.dateFrom = range.from;
    this.props.state.dateTo = range.to;
  }

  public render() {
    const { isOpen } = this.state;
    const { dateFrom, dateTo } = this.props.state;
    const isEngaged = dateFrom && dateTo;
    const picker = isOpen ? this.renderPicker() : null;

    return (
      <>
        <a
          className={classNames({ Engaged: isEngaged })}
          onClick={() => this.onToggleOpen()}
        >
          <i className='ts_icon ts_icon_calendar' />
          <span className='block label'>Select Dates</span>
        </a>
        {picker}
      </>
    );
  }

  public renderPicker() {
    const { dateFrom, dateTo } = this.props.state;
    const modifiers = { start: dateFrom, end: dateTo };
    const selectedDays = [ dateFrom, { from: dateFrom, to: dateTo } ];

    return (
      <div className='DateRangePicker'>
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
