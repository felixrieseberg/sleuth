import { observer } from 'mobx-react';
import { sleuthState, SleuthState } from '../state/sleuth';
import * as React from 'react';
import * as moment from 'moment';
import { ipcRenderer } from 'electron';
import { default as Skylight } from 'react-skylight';
import { default as keydown } from 'react-keydown';

import { UserPreferences } from '../interfaces';
import { getSleuth } from '../sleuth';
import { CooperSignInOutButton } from './cooper/sign-in-out-button';

const packageInfo = require('../../../package.json');
const debug = require('debug')('sleuth:preferences');
const exampleTime = 1493475035123;

/**
 * Sleuth's defaults
 */
export const defaults = {
  dateTimeFormat: 'HH:mm:ss (DD/MM)'
};

/**
 * Get a single preference (or the default)
 *
 * @param {string} preference
 * @returns {any}
 */
export function getPreference(preference: string): any {
  return localStorage.getItem(preference) || defaults[preference];
}

/**
 * Get the current preferences
 *
 * @returns {UserPreferences}
 */
export function getPreferences(): UserPreferences {
  const userPrefs: UserPreferences = {
    dateTimeFormat: getPreference('dateTimeFormat')
  };

  return userPrefs;
}

export interface PreferencesState {
  dateTimeFormat: string;
  isCooperButtonLoading: boolean;
}

export interface PreferencesProps {
  state: SleuthState;
}

@observer
export class Preferences extends React.Component<PreferencesProps, Partial<PreferencesState>> {
  private skylightElement: any;
  private readonly refHandlers = {
    skylight: (ref: any) => this.skylightElement = ref
  };
  private readonly dateTimePresets: Array<string> = [
    'HH:mm:ss (DD/MM)',
    'hh:mm:ss A (DD/MM)',
    'HH:mm:ss.SSS (DD/MM)',
    'hh:mm:ss.SSS A (DD/MM)',
    'hh:mm A, MMM Mo',
    'dddd, MMMM Do YYYY, h:mm:ss a',
    'ddd, hA'
  ];

  constructor() {
    super();

    this.state = { ...getPreferences() };
    this.handleDateFormatChange = this.handleDateFormatChange.bind(this);
    this.beforeClose = this.beforeClose.bind(this);
    ipcRenderer.on('preferences-show', () => this.show());
  }

  public beforeClose() {
    this.props.state.dateTimeFormat = this.state.dateTimeFormat;
  }

  public show() {
    debug('Showing Preferences');
    if (this.skylightElement) this.skylightElement.show();
  }

  @keydown('ESC')
  public hide() {
    debug('Hiding Preferences');
    if (this.skylightElement) this.skylightElement.hide();
  }

  public handleDateFormatChange({ target }: any) {
    if (target && target.value) {
      localStorage.setItem('dateTimeFormat', target.value);
      this.setState({ dateTimeFormat: target.value });
    }
  }

  public isDateTimePreset(value: string) {
    return !!(this.dateTimePresets.find((v) => v === value));
  }

  public renderDateTimeOption(value: string) {
    return <option key={value} value={value}>{moment(exampleTime).format(value)}</option>;
  }

  public renderCooperOptions() {
    return (
      <div>
        <label htmlFor='cooper'>Cooper Service</label>
        <CooperSignInOutButton state={sleuthState} />
      </div>
    );
  }

  public render(): JSX.Element {
    const { dateTimeFormat } = this.props.state;
    const dateTimePresets = this.dateTimePresets.map(this.renderDateTimeOption);
    const closeButtonStyle = { top: '10px' };
    const customDateTimePreset = this.isDateTimePreset(dateTimeFormat!) ? null :
      <option key='custom' value={dateTimeFormat}>{moment(exampleTime).format(dateTimeFormat)}</option>;

    return (
      <div>
        <Skylight {...closeButtonStyle} ref={this.refHandlers.skylight} title='Preferences' beforeClose={this.beforeClose}>
          <p>You're running Sleuth {packageInfo.version} {getSleuth()}</p>
          <div className='DateTime'>
            <div>
              <label className='select small'>
                Date Format
                <select className='small' value={dateTimeFormat} onChange={this.handleDateFormatChange}>
                  {dateTimePresets}
                  {customDateTimePreset}
                </select>
              </label>
            </div>
            <div>
              <label htmlFor='dfa'>Date Format (Advanced)</label>
              <input type='text' id='dfa' className='small' value={dateTimeFormat} onChange={this.handleDateFormatChange} />
            </div>
          </div>
          {this.renderCooperOptions()}
        </Skylight>
      </div>
    );
  }
}
