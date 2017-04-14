import { SleuthState } from '../../state/sleuth';
import * as React from 'react';
import {observer} from 'mobx-react';
import * as Ladda from 'react-ladda';
import { cooperComments } from '../../cooper/comments';
import { cooperAuth } from '../../cooper/auth';

const LaddaButton = Ladda.default;
const debug = require('debug')('sleuth:cooper');

export interface PostCommentProps {
  state: SleuthState;
  line: string;
  didPost: () => {};
}

export interface PostCommentState {
  isPosting: boolean;
  value: string;
}

@observer
export class PostComment extends React.Component<PostCommentProps, Partial<PostCommentState>> {
  constructor() {
    super();

    this.state = {
      isPosting: false,
      value: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  public handleChange(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    this.setState({ value: (e.target as HTMLTextAreaElement).value });
  }

  public onClick() {
    const { line } = this.props;
    const { value } = this.state;

    if (!value) return;

    this.setState({ isPosting: true });
    cooperComments.postComment(line, value)
      .then(async (result) => {
        this.setState({ isPosting: false });

        debug(await result.text());
      });
  }

  public render() {
    const { isPosting } = this.state;
    const buttonOptions = { className: 'btn', loading: isPosting, onClick: this.onClick };

    return (
      <form className='PostComment' onSubmit={this.onClick}>
        <h4>Report Your Findings</h4>
        <textarea id='textarea' onChange={this.handleChange} placeholder='Got some interesting information about this log line to share?' />
        <LaddaButton type='submit' {...buttonOptions}>Post</LaddaButton>
      </form>
    );
  }
};