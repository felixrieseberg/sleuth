import React from 'react';
import autoBind from 'react-autobind';
import path from 'path';
import { observer } from 'mobx-react';
import { Omnibar, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import { MenuItem } from '@blueprintjs/core';

import { SleuthState } from '../state/sleuth';
import { ProcessedLogFiles, SelectLogFileFn, ProcessedLogFile } from '../interfaces';
import { UnzippedFile } from '../unzip';
import { isProcessedFile } from '../../utils/is-processed-file';

interface SpotlightItem { text: string; label?: string; click: () => void; }
const SleuthOmnibar = Omnibar.ofType<SpotlightItem>();

export const renderItem: ItemRenderer<SpotlightItem>
  = ({ text, label }, { handleClick, modifiers, query }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }

    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        text={text}
        key={text}
        onClick={handleClick}
        label={label || ''}
      />
    );
  };

export const filterItem: ItemPredicate<SpotlightItem> = (query, item) => {
  return item.text.toLowerCase().includes(query.toLowerCase());
};

export interface SpotlightState {
  isCooperButtonLoading: boolean;
  isOpen: boolean;
}

export interface SpotlightProps {
  state: SleuthState;
  logFiles: ProcessedLogFiles;
  selectLogFile: SelectLogFileFn;
}

@observer
export class Spotlight extends React.Component<SpotlightProps, Partial<SpotlightState>> {
  constructor(props: SpotlightProps) {
    super(props);

    this.state = {};
    autoBind(this);
  }

  public render(): JSX.Element {
    const { isSpotlightOpen } = this.props.state;
    return (
      <SleuthOmnibar
        isOpen={isSpotlightOpen}
        noResults={<MenuItem disabled={true} text='No results.' />}
        onClose={this.props.state.toggleSpotlight}
        items={this.getItems()}
        itemRenderer={renderItem}
        onItemSelect={this.onItemSelect}
        itemPredicate={filterItem}
        resetOnSelect={true}
      />
    );
  }

  private onItemSelect(item: SpotlightItem) {
    if (item && item.click) {
      item.click();
      this.props.state.toggleSpotlight();
    }
  }

  private getItems(): Array<SpotlightItem> {
    const { suggestions } = this.props.state;
    const { logFiles } = this.props;

    const spotSuggestions: Array<SpotlightItem> = Object.keys(suggestions)
      .map((filePath) => ({
        text: path.basename(filePath),
        label: `${suggestions[filePath].age} old`,
        click: () => {
          this.props.state.openFile(filePath);
        }
      }));

    const logFileSuggestions: Array<SpotlightItem> = [];

    Object.keys(logFiles).forEach((key) => {
      const keyFiles: Array<ProcessedLogFile | UnzippedFile> = logFiles[key];
      keyFiles.forEach((logFile) => {
        if (isProcessedFile(logFile)) {
          logFileSuggestions.push({
            text: logFile.logFile.fileName,
            label: `${logFile.logEntries.length} entries`,
            click: () => {
              this.props.selectLogFile(logFile);
            }
          });
        } else {
          logFileSuggestions.push({
            text: logFile.fileName,
            label: `State`,
            click: () => {
              this.props.selectLogFile(logFile);
            }
          });
        }
      });
    });

    return [ ...spotSuggestions, ...logFileSuggestions ];
  }
}
