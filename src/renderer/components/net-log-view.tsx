import React from 'react';
import { observer } from 'mobx-react';
import fs from 'fs-extra';

import { SleuthState } from '../state/sleuth';
import { autorun, IReactionDisposer } from 'mobx';
import { UnzippedFile } from '../interfaces';

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

    const { file } = this.props;
    const iframe = document.getElementsByTagName('iframe');

    if (iframe && iframe[0]) {
      try {
        const catapultWindow = iframe[0].contentWindow;
        const raw = await fs.readFile(file.fullPath, 'utf8');

        // See catapult.html for the postMessage handler
        catapultWindow?.postMessage({
          instruction: 'load',
          payload: { fileName: file.fileName, content: raw }
        }, 'file://');
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
        const catapultWindow = iframe[0].contentWindow;

        catapultWindow?.postMessage({
          instruction: 'dark-mode',
          payload: enabled
        }, 'file://');
      }
    } catch (error) {
      debug(`Failed to set dark mode`, error);
    }
  }
}
