import { IEnableDisablePosition } from 'tslint/lib';
import * as React from 'react';
import * as Ladda from 'react-ladda';
import { remote } from 'electron';
import { cooperComments } from '../../cooper/comments';

const LaddaButton = Ladda.default;
const debug = require('debug')('sleuth:cooper');

export interface PostCommentProps {
  line: string;
  lineId?: string;
  didPost: () => void;
}

export interface PostCommentState {
  isPosting: boolean;
  value: string;
}

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
    const { line , lineId } = this.props;
    const { value } = this.state;

    if (!value) return;

    this.setState({ isPosting: true });
    cooperComments.postComment(line, value, lineId)
      .then(async (result) => {
        debug(`Posted a comment to cooper`, result);

        this.setState({ isPosting: false, value: '' });
        if (this.props.didPost) this.props.didPost();

        debug(await result.text());
      })
      .catch((error) => {
        debug(`Tried to post commen to cooper, but failed`, error);

        remote.dialog.showMessageBox({
          title: `Posting Failed`,
          type: 'error',
          message: `We could not reach the log service and failed to post your comment 😢`,
          // tslint:disable-next-line:max-line-length
          detail: `Thank you so much for trying to post a comment... We failed to get in touch with the server. That means we're either down or you don't have a working internet connection.`
        });

        this.setState({ isPosting: false });
      });
  }

  public render() {
    const { isPosting, value } = this.state;
    const buttonOptions = { className: 'btn', loading: isPosting, onClick: this.onClick };

    return (
      <form className='PostComment' onSubmit={this.onClick}>
        <h4>Report Your Findings</h4>
        <textarea id='textarea' onChange={this.handleChange} value={value} placeholder='Got some interesting information about this log line to share?' />
        <LaddaButton type='submit' {...buttonOptions}>Post</LaddaButton>
      </form>
    );
  }
};