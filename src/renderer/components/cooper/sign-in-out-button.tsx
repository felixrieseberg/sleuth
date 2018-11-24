import React from 'react';
import {observer} from 'mobx-react';
import { Button } from '@blueprintjs/core';

import { SleuthState } from '../../state/sleuth';
import { cooperAuth } from '../../cooper/auth';

export interface SignInOutButtonProps {
  state: SleuthState;
}

export interface SignInOutButtonState {
  isLoading: boolean;
}

@observer
export class CooperSignInOutButton extends React.Component<SignInOutButtonProps, Partial<SignInOutButtonState>> {
  constructor(props: SignInOutButtonProps) {
    super(props);

    this.state = { isLoading: false };
    this.onClick = this.onClick.bind(this);
  }

  public onClick(e: React.MouseEvent<HTMLButtonElement>) {
    const isSignIn = (e.target as HTMLButtonElement).textContent === 'Sign In';
    const method = isSignIn ? cooperAuth.signIn : cooperAuth.signOut;

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
