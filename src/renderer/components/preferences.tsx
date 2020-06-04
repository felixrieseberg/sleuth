import { Select } from '@blueprintjs/select';
import { ipcRenderer } from 'electron';
import { observer } from 'mobx-react';
import { Overlay, Classes, FormGroup, Button, MenuItem, Callout, ControlGroup, InputGroup, RadioGroup, Radio, Checkbox, Divider } from '@blueprintjs/core';
import { SleuthState } from '../state/sleuth';
import classNames from 'classnames';
import React from 'react';
import autoBind from 'react-autobind';

import { getSleuth } from '../sleuth';
import { CooperSignInOutButton } from './cooper/sign-in-out-button';
import { renderFontItem, filterFont, FONTS } from './preferences-font';
import { filterDateTime, renderDateTimeItem, DATE_TIME_FORMATS } from './preferences-datetime';
import { renderEditorItem, Editor, EDITORS, nameForCmd } from './preferences-editor';
import { SORT_DIRECTION } from './log-table-constants';

const packageInfo = require('../../../package.json');

const FontSelect = Select.ofType<string>();
const DateTimeSelect = Select.ofType<string>();
const EditorSelect = Select.ofType<Editor>();

export interface PreferencesState {
  isOpen: boolean;
}

export interface PreferencesProps {
  state: SleuthState;
}

@observer
export class Preferences extends React.Component<PreferencesProps, Partial<PreferencesState>> {
  constructor(props: PreferencesProps) {
    super(props);

    this.state = {};
    autoBind(this);

    ipcRenderer.on('preferences-show', () => this.setState({ isOpen: true }));
  }

  public render(): JSX.Element {
    const { dateTimeFormat, defaultEditor, font } = this.props.state;

    const classes = classNames(Classes.CARD, Classes.ELEVATION_4, 'Preferences');

    return (
      <Overlay
        isOpen={this.state.isOpen}
        onClose={this.onClose}
        hasBackdrop={true}
      >
        <div className={classes}>
          <h2>Preferences</h2>
          <Callout>You're running Sleuth {packageInfo.version} {getSleuth()}</Callout>
          <Divider style={{ marginTop: '15px' }} />
          <FormGroup
            inline={true}
            label='Font'
            helperText='Choose a custom font to override how Sleuth renders various text elements'
          >
            <FontSelect
              itemRenderer={renderFontItem}
              itemPredicate={filterFont}
              items={FONTS}
              noResults={<MenuItem disabled={true} text='No results.' />}
              onItemSelect={this.onFontSelect}
              popoverProps={{ minimal: true }}
            >
              <Button text={font} rightIcon='font' />
            </FontSelect>
          </FormGroup>
          <Divider />
          <FormGroup
            inline={true}
            label='Date Time Format'
            helperText='Choose a custom format for dates to override how timestamps will be displayed'
          >
            <DateTimeSelect
              itemRenderer={renderDateTimeItem}
              itemPredicate={filterDateTime}
              items={DATE_TIME_FORMATS}
              noResults={<MenuItem disabled={true} text='No results.' />}
              onItemSelect={this.onDateTimeSelect}
              popoverProps={{ minimal: true }}
            >
              <Button text={dateTimeFormat} rightIcon='calendar' />
            </DateTimeSelect>
          </FormGroup>
          <Divider />
          <FormGroup
            inline={true}
            label='Sort Direction'
            helperText='Skip home screen and always open most recent file automatically'
          >
            <RadioGroup
              onChange={(event) => (this.props.state.defaultSort = event.currentTarget.value as SORT_DIRECTION)}
              selectedValue={this.props.state.defaultSort || SORT_DIRECTION.DESC}
              inline={true}
            >
              <Radio label='Ascending' value={SORT_DIRECTION.ASC} />
              <Radio label='Descending' value={SORT_DIRECTION.DESC} />
            </RadioGroup>
          </FormGroup>
          <Divider />
          <FormGroup
            inline={true}
            label='Always open most recent file'
            helperText='Skip home screen and always open most recent file automatically'
          >
            <Checkbox
              checked={this.props.state.isOpenMostRecent}
              label='Enabled'
              onChange={(event) => (this.props.state.isOpenMostRecent = event.currentTarget.checked)}
            />
          </FormGroup>
          <Divider />
          <FormGroup
            inline={true}
            label='Enable "smart copy", copying whole log lines'
            helperText="Disable this if you're having trouble with copy & paste in Sleuth"
          >
            <Checkbox
              checked={this.props.state.isSmartCopy}
              label='Enabled'
              onChange={(event) => (this.props.state.isSmartCopy = event.currentTarget.checked)}
            />
          </FormGroup>
          <Divider />
          <FormGroup
            inline={true}
            label='Editor'
            helperText='Sleuth can open log source files in your favorite editor'
          >
            <ControlGroup>
              <EditorSelect
                filterable={false}
                items={EDITORS}
                itemRenderer={renderEditorItem}
                noResults={<MenuItem disabled={true} text='No results.' />}
                onItemSelect={this.onEditorSelect}
                popoverProps={{ minimal: true }}
              >
                <Button text={nameForCmd(defaultEditor)} rightIcon='code' />
              </EditorSelect>
              <InputGroup
                placeholder='Custom shell command'
                value={defaultEditor}
                onChange={this.onEditorCmdChange}
              />
            </ControlGroup>
          </FormGroup>
          <Divider />
          <FormGroup
            inline={true}
            label='Use the Mark Christian™️ icon'
            helperText='Mark did some art and made a special Sleuth icon. Requires a restart.'
          >
            <Checkbox
              checked={this.props.state.isMarkIcon}
              label='Enabled'
              onChange={(event) => (this.props.state.isMarkIcon = event.currentTarget.checked)}
            />
          </FormGroup>
          <Divider />
          {this.renderCooperOptions()}
        </div>
      </Overlay>
    );
  }

  private renderCooperOptions() {
    return (
      <FormGroup
        inline={true}
        helperText='The log service allows Slack employees to leave comments and hints for log entries'
        label='Sign into the Cooper Log Service'
      >
        <CooperSignInOutButton state={this.props.state} />
      </FormGroup>
    );
  }

  private onClose() {
    this.setState({ isOpen: false });
  }

  private onEditorSelect(editor: Editor) {
    this.props.state.defaultEditor = editor.cmd;
  }

  private onEditorCmdChange({ target }: React.FormEvent<HTMLInputElement>) {
    if (target && (target as any).value) {
      this.props.state.defaultEditor = (target as any).value;
    }
  }

  private onFontSelect(font: string) {
    this.props.state.font = font;
  }

  private onDateTimeSelect(format: string) {
    this.props.state.dateTimeFormat = format;
  }
}
