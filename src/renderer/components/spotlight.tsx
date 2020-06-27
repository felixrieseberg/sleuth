import React from 'react';
import autoBind from 'react-autobind';
import path from 'path';
import { observer } from 'mobx-react';
import { Omnibar, ItemRenderer, ItemPredicate } from '@blueprintjs/select';
import { MenuItem } from '@blueprintjs/core';
import { ipcRenderer } from 'electron';

import { SleuthState } from '../state/sleuth';
import { ProcessedLogFile, UnzippedFile } from '../../interfaces';
import { isProcessedLogFile } from '../../utils/is-logfile';
import { highlightText } from '../../utils/highlight-text';

interface SpotlightItem {
  text: string;
  icon?: string;
  label?: string;
  click: () => void;
}
const SleuthOmnibar = Omnibar.ofType<SpotlightItem>();

export const renderItem: ItemRenderer<SpotlightItem>
  = ({ text, label, icon }, { handleClick, modifiers, query }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }

    return (
      <MenuItem
        active={modifiers.active}
        disabled={modifiers.disabled}
        text={highlightText(text, query)}
        key={text}
        onClick={handleClick}
        label={label || ''}
        icon={icon as any}
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
    const { processedLogFiles } = this.props.state;

    const spotSuggestions: Array<SpotlightItem> = Object.keys(suggestions)
      .map((filePath) => ({
        text: path.basename(filePath),
        label: `${suggestions[filePath].age} old`,
        icon: filePath.endsWith('zip') ? 'compressed' : 'folder-open',
        click: () => {
          this.props.state.openFile(filePath);
        }
      }));

    const logFileSuggestions: Array<SpotlightItem> = [];

    Object.keys(processedLogFiles || {}).forEach((key) => {
      const keyFiles: Array<ProcessedLogFile | UnzippedFile> = processedLogFiles![key];
      keyFiles.forEach((logFile) => {
        if (isProcessedLogFile(logFile)) {
          logFileSuggestions.push({
            text: logFile.logFile.fileName,
            label: `${logFile.logEntries.length} entries`,
            icon: 'document',
            click: () => {
              this.props.state.selectLogFile(logFile);
            }
          });
        } else {
          logFileSuggestions.push({
            text: logFile.fileName,
            label: `State`,
            icon: 'cog',
            click: () => {
              this.props.state.selectLogFile(logFile);
            }
          });
        }
      });
    });

    const appSuggestions = [
      {
        text: 'Quit Sleuth',
        icon: 'power',
        click: () => ipcRenderer.invoke('quit')
      },
      {
        text: 'Go Home',
        icon: 'home',
        click: () => {
          this.props.state.reset(true);
        }
      },
      {
        text: 'Toggle Dark Mode',
        icon: 'moon',
        click: () => {
          this.props.state.toggleDarkMode();
        }
      },
      {
        text: 'Toggle Sidebar',
        icon: 'menu',
        click: () => {
          this.props.state.toggleSidebar();
        }
      }
    ];

    return [ ...spotSuggestions, ...logFileSuggestions, ...appSuggestions ];
  }
}
