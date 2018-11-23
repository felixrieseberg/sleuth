import { observer } from 'mobx-react';
import { sleuthState, SleuthState } from '../state/sleuth';
import React from 'react';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import { Overlay, Classes } from '@blueprintjs/core';

import { getSleuth } from '../sleuth';
import { CooperSignInOutButton } from './cooper/sign-in-out-button';
import classNames from 'classnames';

const packageInfo = require('../../../package.json');
const exampleTime = 1493475035123;

/**
 * Sleuth's defaults
 */

export interface PreferencesState {
  isCooperButtonLoading: boolean;
  isOpen: boolean;
}

export interface PreferencesProps {
  state: SleuthState;
}

@observer
export class Preferences extends React.Component<PreferencesProps, Partial<PreferencesState>> {
  private readonly dateTimePresets: Array<string> = [
    'HH:mm:ss (DD/MM)',
    'hh:mm:ss A (DD/MM)',
    'HH:mm:ss.SSS (DD/MM)',
    'hh:mm:ss.SSS A (DD/MM)',
    'hh:mm A, MMM Do',
    'dddd, MMMM Do YYYY, h:mm:ss a',
    'ddd, hA'
  ];

  private readonly fontPresets: Array<string> = [
    process.platform === 'darwin' ? 'BlinkMacSystemFont' : 'Helvetica',
    'Verdana',
    'Arial',
    process.platform === 'darwin' ? 'Menlo' : 'Consolas'
  ];

  constructor(props: PreferencesProps) {
    super(props);

    this.state = {};
    this.onDateFormatChange = this.onDateFormatChange.bind(this);
    this.onEditorChange = this.onEditorChange.bind(this);
    this.onFontChange = this.onFontChange.bind(this);
    this.onClose = this.onClose.bind(this);

    ipcRenderer.on('preferences-show', () => this.setState({ isOpen: true }));
  }

  public renderEditorOptions() {
    const options = {
      'Visual Studio Code': `code --goto {filepath}:{line}`,
      Sublime: `subl {filepath}:{line}`,
      Atom: 'atom {filepath}:{line}',
      Custom: ''
    };

    return Object.keys(options).map((key) => {
      return <option key={key} value={options[key]}>{key}</option>;
    });
  }

  public renderDateTimeOption(value: string) {
    return <option key={value} value={value}>{moment(exampleTime).format(value)}</option>;
  }

  public renderFontOption(value: string) {
    return <option key={value} value={value}>{value}</option>;
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
    const { dateTimeFormat, defaultEditor, font } = this.props.state;
    const dateTimePresets = this.dateTimePresets.map(this.renderDateTimeOption);
    const fontPresets = this.fontPresets.map(this.renderFontOption);
    const editorPresets = this.renderEditorOptions();
    const customDateTimePreset = this.isDateTimePreset(dateTimeFormat!) ? null :
      <option key='custom' value={dateTimeFormat}>{moment(exampleTime).format(dateTimeFormat)}</option>;
    const customFontPreset = this.isFontPreset(font!) ? null :
      <option key='custom' value={font}>{font}</option>;
    const fontStyle = { fontFamily: font };
    const classes = classNames(Classes.CARD, Classes.ELEVATION_4, 'PreferencesTransition');

    return (
      <div>
        <Overlay
          isOpen={this.state.isOpen}
          onClose={this.onClose}
          hasBackdrop={true}
        >
          <div className={classes}>
            <p>You're running Sleuth {packageInfo.version} {getSleuth()}</p>
            <div className='Font'>
              <div>
                <label className='select small'>
                  Font Family
                  <select className='small' value={font} onChange={this.onFontChange}>
                    {fontPresets}
                    {customFontPreset}
                  </select>
                </label>
              </div>
              <div>
                <label className='small' htmlFor='dfa'>Font Family (Raw Input)</label>
                <input
                  type='text'
                  style={fontStyle}
                  id='dfa'
                  className='small'
                  value={font}
                  onChange={this.onFontChange}
                />
              </div>
            </div>
            <p>Changing the date format allows you to configure how exactly dates and times are displayed.</p>
            <div className='DateTime'>
              <div>
                <label className='select small'>
                  Date Format
                  <select className='small' value={dateTimeFormat} onChange={this.onDateFormatChange}>
                    {dateTimePresets}
                    {customDateTimePreset}
                  </select>
                </label>
              </div>
              <div>
                <label className='small' htmlFor='dfa'>Date Format (Advanced)</label>
                <input type='text' id='dfa' className='small' value={dateTimeFormat} onChange={this.onDateFormatChange} />
              </div>
            </div>
            <p>Changing the date format allows you to configure how exactly dates and times are displayed.</p>
            <div className='DefaultEditor'>
              <div>
                <label className='select small'>
                  Default Editor
                  <select className='small' value={defaultEditor} onChange={this.onEditorChange}>
                    {editorPresets}
                  </select>
                </label>
              </div>
              <div>
                <label className='small' htmlFor='dfe'>Editor Command</label>
                <input type='text' id='dfe' className='small' value={defaultEditor} onChange={this.onEditorChange} />
              </div>
            </div>
            <p>You can open the source for each log entry using your favorite editor. Find the "Source" button in the log details to do so.</p>
            {this.renderCooperOptions()}
          </div>
        </Overlay>
      </div>
    );
  }

  private onClose() {
    this.setState({ isOpen: false });
  }

  /**
   * Changes the local preference given an DOM input target
   * and a preference key
   *
   * @param {*} target
   * @param {string} key
   */
  private onValueChange(target: any, key: string) {
    if (target && (target.value || target.value === '')) {
      this.props.state[key] = target.value;
    }
  }

  private onDateFormatChange({ target }: any) {
    this.onValueChange(target, 'dateTimeFormat');
  }

  private onEditorChange({ target }: any) {
    this.onValueChange(target, 'defaultEditor');
  }

  private onFontChange({ target }: any) {
    this.onValueChange(target, 'font');
  }

  private isDateTimePreset(value: string) {
    return !!(this.dateTimePresets.find((v) => v === value));
  }

  private isFontPreset(value: string) {
    return !!(this.fontPresets.find((v) => v === value));
  }
}
