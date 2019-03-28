import React from 'react';
import { observer } from 'mobx-react';
import * as fs from 'fs-extra';

import { SleuthState } from '../state/sleuth';
import { UnzippedFile } from '../unzip';
import { autorun, IReactionDisposer } from 'mobx';

export interface NetLogViewProps {
  state: SleuthState;
  file: UnzippedFile;
}

export interface NetLogViewState {
}

const debug = require('debug')('sleuth:netlogview');

@observer
export class NetLogView extends React.Component<NetLogViewProps, NetLogViewState> {
  private disposeDarkModeAutorun: IReactionDisposer | undefined;

  constructor(props: NetLogViewProps) {
    super(props);

    this.loadFile = this.loadFile.bind(this);
  }

  public render() {
    return (
      <div className='NetLogView'>
        <iframe
          src='catapult.html'
          onLoad={this.loadFile}
          frameBorder={0}
        />
      </div>
    );
  }

  public componentWillUnmount() {
    if (this.disposeDarkModeAutorun) {
      this.disposeDarkModeAutorun();
    }
  }

  /**
   * Loads the currently selected file in catapult
   *
   * @memberof NetLogView
   */
  public async loadFile() {
    debug(`iFrame loaded`);

    const { file, state } = this.props;
    const { isDarkMode } = state;
    const iframe = document.getElementsByTagName('iframe');

    if (iframe && iframe[0]) {
      try {
        const catapultWindow = (iframe[0].contentWindow as any);
        const raw = await fs.readFile(file.fullPath, 'utf8');
        catapultWindow.log_util.loadLogFile(raw, file.fileName);

        if (isDarkMode) {
          catapultWindow.sleuth.setDarkMode(true);
        }
      } catch (error) {
        debug(`Failed to read file and load contents in catapult`, error);
      }
    }

    this.disposeDarkModeAutorun = autorun(() => {
      this.setDarkMode(this.props.state.isDarkMode);
    });
  }

  /**
   * We have a little bit of css in catapult.html that'll enable a
   * basic dark mode.
   *
   * @param {boolean} enabled
   * @memberof NetLogView
   */
  public setDarkMode(enabled: boolean) {
    try {
      const iframe = document.getElementsByTagName('iframe');

      if (iframe && iframe.length > 0) {
        const catapultWindow = (iframe[0].contentWindow as any);
        catapultWindow.sleuth.setDarkMode(enabled);
      }
    } catch (error) {
      debug(`Failed to set dark mode`, error);
    }
  }
}
