import React from 'react';
import {observer} from 'mobx-react';
import { Button } from '@blueprintjs/core';

import { SleuthState } from '../../state/sleuth';
import { CooperAuth } from '../../cooper/auth';

export interface SignInOutButtonProps {
  state: SleuthState;
}

export interface SignInOutButtonState {
  isLoading: boolean;
}

@observer
export class CooperSignInOutButton extends React.Component<SignInOutButtonProps, Partial<SignInOutButtonState>> {
  public readonly cooperAuth: CooperAuth;

  constructor(props: SignInOutButtonProps) {
    super(props);

    this.state = { isLoading: false };
    this.onClick = this.onClick.bind(this);
    this.cooperAuth = new CooperAuth(props.state);
  }

  public onClick() {
    const { isCooperSignedIn } = this.props.state;
    const method = isCooperSignedIn ? this.cooperAuth.signOut : this.cooperAuth.signIn;

    this.setState({ isLoading: true });
    method().then(() => this.setState({ isLoading: false }));
  }

  public render(): JSX.Element {
    const { isCooperSignedIn } = this.props.state;
    const { isLoading } = this.state;

    return (
      <div>
        <Button
          loading={isLoading}
          onClick={this.onClick}
          icon='user'
        >
          Sign {isCooperSignedIn ? 'Out' : 'In'}
        </Button>
      </div>
    );
  }
}
