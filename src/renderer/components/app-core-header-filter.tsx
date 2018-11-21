import { observer } from 'mobx-react';
import React from 'react';
import debounce from 'debounce';
import { Alignment, Button, Classes, NavbarDivider, NavbarGroup, ButtonGroup, InputGroup } from '@blueprintjs/core';
import { DateRangeInput } from '@blueprintjs/datetime';

import { SleuthState } from '../state/sleuth';

export interface FilterProps {
  state: SleuthState;
}

export interface FilterState {
}

@observer
export class Filter extends React.Component<FilterProps, Partial<FilterState>> {
  constructor(props: FilterProps) {
    super(props);

    this.onFilterToggle = this.onFilterToggle.bind(this);
    this.toggleSearchResultVisibility = this.toggleSearchResultVisibility.bind(this);
    this.onSearchChange = debounce(this.onSearchChange.bind(this), 700);
    this.onDateRangeChange = this.onDateRangeChange.bind(this);
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
  public onSearchIndexChange(change: number) {
    this.props.state.searchIndex = this.props.state.searchIndex + change;
  }

  public onDateRangeChange(range: [ Date?, Date? ]) {
    this.props.state.dateRange = {
      from: range[0],
      to: range[1]
    };
  }

  public toggleSearchResultVisibility() {
    this.props.state.showOnlySearchResults = !this.props.state.showOnlySearchResults;
  }


  public render() {
    const { showOnlySearchResults, dateRange } = this.props.state;
    const { error, warn, info, debug } = this.props.state.levelFilter!;

    const showOnlySearchResultsButton = (
      <Button
        active={showOnlySearchResults}
        onClick={this.toggleSearchResultVisibility}
        className={Classes.MINIMAL}
        icon={showOnlySearchResults ? 'eye-off' : 'eye-open'}
      />
    );

    return (
      <NavbarGroup align={Alignment.RIGHT}>
        <ButtonGroup>
          <Button active={error} onClick={() => this.onFilterToggle('error')} icon='error' text='Error' />
          <Button active={warn} onClick={() => this.onFilterToggle('warn')} icon='warning-sign' text='Warning' />
          <Button active={info} onClick={() => this.onFilterToggle('info')} icon='info-sign' text='Info' />
          <Button active={debug} onClick={() => this.onFilterToggle('debug')} icon='code' text='Debug' />
        </ButtonGroup>
        <NavbarDivider />
        <DateRangeInput
          formatDate={(date) => date.toLocaleString()}
          onChange={this.onDateRangeChange}
          parseDate={(str) => new Date(str)}
          value={[ dateRange.from, dateRange.to ]}
        />
        <NavbarDivider />
        <InputGroup
          leftIcon='search'
          placeholder='Search'
          rightElement={showOnlySearchResultsButton}
          onChange={(e: React.FormEvent) => this.onSearchChange((e.target as any).value)}
        />
        <NavbarDivider />
        <ButtonGroup>
          <Button icon='arrow-left' onClick={() => this.onSearchIndexChange(-1)} />
          <Button icon='arrow-right' onClick={() => this.onSearchIndexChange(1)} />
        </ButtonGroup>
      </NavbarGroup>
    );
  }
}
