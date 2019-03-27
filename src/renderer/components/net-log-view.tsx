import React from 'react';
import { observer } from 'mobx-react';
import * as fs from 'fs-extra';

import { SleuthState } from '../state/sleuth';
import { UnzippedFile } from '../unzip';

export interface NetLogViewProps {
  state: SleuthState;
  file: UnzippedFile;
}

export interface NetLogViewState {
}

const debug = require('debug')('sleuth:netlogview');

@observer
export class NetLogView extends React.Component<NetLogViewProps, NetLogViewState> {
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
        />
      </div>
    );
  }

  public async loadFile() {
    debug(`NetLogView: iFrame loaded`);

    const { file } = this.props;
    const iframe = document.getElementsByTagName('iframe');

    if (iframe && iframe[0]) {
      const raw = await fs.readFile(file.fullPath, 'utf8');

      (iframe[0].contentWindow as any).log_util.loadLogFile(raw, file.fileName);
    }
  }
}
