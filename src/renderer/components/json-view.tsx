import React from 'react';
import { observer } from 'mobx-react';
import JSONTree from 'react-json-tree';

import { SleuthState } from '../state/sleuth';
import { getTheme } from './theme';
import { parseJSON } from '../../utils/parse-json';

export interface JSONViewProps {
  state: SleuthState;
  raw?: string;
  data?: any;
}

export interface JSONViewState {
  data?: any;
}

@observer
export class JSONView extends React.Component<JSONViewProps, JSONViewState> {
  public render() {
    const data = this.props.data || parseJSON(this.props.raw || '');

    if (data) {
      const theme = getTheme(this.props.state.isDarkMode);

      return (
        <div className='Monospace'>
          <JSONTree
            invertTheme={!this.props.state.isDarkMode}
            data={data}
            theme={theme}
            hideRoot={true}
            shouldExpandNode={() => true}
          />
        </div>
      );
    } else {
      return (
        <div className='Monospace'>
          <code>{this.props.raw}</code>
        </div>
      );
    }
  }
}