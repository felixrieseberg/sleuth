import { observer } from 'mobx-react';
import React from 'react';
import { Card, FormGroup, Button, EditableText } from '@blueprintjs/core';

import { cooperComments } from '../../cooper/comments';
import { SleuthState } from '../../state/sleuth';
import { sendShowMessageBox } from '../../ipc';

const debug = require('debug')('sleuth:cooper');

export interface PostCommentProps {
  state: SleuthState;
  line: string;
  lineId?: string;
  didPost: () => void;
}

export interface PostCommentState {
  isPosting: boolean;
  value: string;
}

@observer
export class PostComment extends React.Component<PostCommentProps, Partial<PostCommentState>> {
  constructor(props: PostCommentProps) {
    super(props);

    this.state = {
      isPosting: false,
      value: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  public handleChange(value: string) {
    this.setState({ value });
  }

  public onClick(e: React.MouseEvent<HTMLButtonElement>) {
    const { line , lineId } = this.props;
    const { value } = this.state;
    const { selectedEntry } = this.props.state;

    e.preventDefault();
    if (!value || !selectedEntry) return;

    const log = selectedEntry.logType;

    this.setState({ isPosting: true });
    cooperComments.postComment(line, value, log, lineId)
      .then(async (result) => {
        debug(`Posted a comment to cooper`, result);

        this.setState({ isPosting: false, value: '' });
        if (this.props.didPost) this.props.didPost();

        debug(await result.text());
      })
      .catch((error) => {
        debug(`Tried to post comment to cooper, but failed`, error);

        sendShowMessageBox({
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
    return (
      <Card className='PostComments'>
        <FormGroup>
          <h2>Report Your Findings</h2>
          <EditableText
            multiline={true}
            placeholder='Got some interesting information about this log line to share?'
            minLines={5}
            value={this.state.value}
            onChange={this.handleChange}
          />
          <Button
            intent='primary'
            icon='comment'
            loading={this.state.isPosting}
            onClick={this.onClick}
          >
            Post
          </Button>
        </FormGroup>
      </Card>
    );
  }
}
