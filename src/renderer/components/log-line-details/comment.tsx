import * as React from 'react';

const debug = require('debug')('sleuth:comment');

export interface CommentProps {
  name: string;
  comment: string;
  avatar: string;
  timestamp: number;
}

export interface CommentState {

}

export class Comment extends React.Component<CommentProps, CommentState> {
  constructor() {
    super();
  }

  public render() {
    const { name, comment, avatar, timestamp } = this.props;

    return (
      <div>
        <img src={avatar} height="256px" width="256px" />
        <p><span>{name}</span><span>{timestamp}</span></p>
        <p>{comment}</p>
      </div>
    );
  }
}