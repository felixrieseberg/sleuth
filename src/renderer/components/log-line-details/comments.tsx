import React from 'react';
import autobind from 'react-autobind';
import { observer } from 'mobx-react';
import { FormGroup, InputGroup, Button, ControlGroup, Classes } from '@blueprintjs/core';

import { cooperComments, IAuthor, IComment, IGetCommentResponse } from '../../cooper/comments';
import { PostComment } from './post';
import { Comment } from './comment';
import { CooperSignInOutButton } from '../cooper/sign-in-out-button';
import { lineToCooperLine } from '../../cooper/line-to-cooper-line';
import { SleuthState, sleuthState } from '../../state/sleuth';

const debug = require('debug')('sleuth:cooper');

export interface LogLineCommentsProps {
  state: SleuthState;
}

export interface LogLineCommentsState {
  comments: Array<any>;
  authors: Array<IAuthor>;
  line: string;
  lineId: string;
  searchLine: string;
}

@observer
export class LogLineComments extends React.Component<LogLineCommentsProps, Partial<LogLineCommentsState>> {
  constructor(props: LogLineCommentsProps) {
    super(props);

    const line = props.state.selectedEntry
      ? lineToCooperLine.convert(props.state.selectedEntry.message)
      : '';

    this.state = {
      comments: [],
      authors: [],
      line,
      searchLine: line
    };

    autobind(this);

    if (props.state.selectedEntry) {
      this.fetchComments(this.state.line, props.state.isCooperSignedIn, props.state.selectedEntry.logType);
    }
  }

  public refresh() {
    this.fetchComments();
  }

  public componentWillReceiveProps(nextProps: LogLineCommentsProps) {
    const newSignInStatus = nextProps.state.isCooperSignedIn !== this.props.state.isCooperSignedIn;

    if (nextProps.state.selectedEntry && nextProps.state.selectedEntry.message || newSignInStatus && nextProps.state.selectedEntry) {
      const line = lineToCooperLine.convert(nextProps.state.selectedEntry.message);
      this.setState({ line, searchLine: line });
      this.fetchComments(line, nextProps.state.isCooperSignedIn, nextProps.state.selectedEntry.logType);
    }
  }

  public updateSearch() {
    this.fetchComments(this.state.searchLine);
  }

  public async fetchComments(line?: string, isSignedIn?: boolean, log?: string) {
    log = log || this.props.state.selectedEntry ? this.props.state.selectedEntry!.logType : 'browser';
    line = line || this.state.line;
    isSignedIn = isSignedIn || this.props.state.isCooperSignedIn;

    if (line && isSignedIn) {
      debug(`Fetching comments for line ${line}`);

      cooperComments.getComments(line, log)
        .then((result: IGetCommentResponse) => {
          debug(result);
          if (result && result.comments) {
            this.setState({
              comments: result.comments,
              authors: result.authors,
              lineId: result._id
            });
          }
        });
    } else {
      debug('No line');
    }
  }

  public renderComment(commentObject: IComment) {
    const { comment, authorId, timestamp, id } = commentObject;
    const { lineId } = this.state;
    const author = this.state.authors!.find((a) => a._id === authorId);

    if (!author) return null;
    const { name, avatar, slackUserId } = author;
    const options = { lineId, comment, name, avatar, timestamp, slackUserId, commentId: id };

    return <Comment didPost={this.refresh} state={sleuthState} key={timestamp} {...options} />;
  }

  public renderSignInNeccessary() {
    return (
      <div className='Comments'>
        <h4>Log Intelligence</h4>
        <p>Sign in to see and post information about this log line left by fellow Slack employees.</p>
        <CooperSignInOutButton state={sleuthState} />
      </div>
    );
  }

  public render() {
    const { isCooperSignedIn } = this.props.state;
    const { comments, line, lineId, searchLine } = this.state;
    const renderedComments = comments!.map(this.renderComment);

    if (!line) return null;
    if (!isCooperSignedIn) return this.renderSignInNeccessary();

    return (
      <div className='Comments'>
        <h2>Log Intelligence</h2>
        <div className='IntelligenceComment'>
          <FormGroup
            label='We generalize the log line. Searched for comments for:'
          >
            <ControlGroup
              fill={true}
              vertical={false}
            >
              <InputGroup
                onChange={this.onChangeSearchLine}
                value={searchLine}
              />
              <Button
                className={Classes.FIXED}
                icon='path-search'
                type='button'
                onClick={this.updateSearch}
              >
                Change Search
              </Button>
            </ControlGroup>
          </FormGroup>
        </div>
        {renderedComments}
        <PostComment
          lineId={lineId}
          line={line}
          didPost={this.refresh}
          state={sleuthState}
        />
      </div>
    );
  }

  /**
   * Handles the user changing the search line. Does not actually
   * submit a search, the user needs to hit the search button for that.
   *
   * @private
   * @param {React.FormEvent<HTMLInputElement>} event
   */
  private onChangeSearchLine(event: React.FormEvent<HTMLInputElement>) {
    if (event.currentTarget && event.currentTarget.value) {
      this.setState({ searchLine: event.currentTarget.value });
    }
  }
}