import { SleuthState } from '../../state/sleuth';
import * as React from 'react';
import { cooperComments, IAuthor, IComment, IGetCommentResponse } from '../../cooper/comments';
import { observer } from "mobx-react";
import { PostComment } from "./post";
import { Comment } from "./comment";

const debug = require('debug')('sleuth:cooper');

export interface LogLineCommentsProps {
  line?: string;
  state: SleuthState;
}

export interface LogLineCommentsState {
  comments: Array<any>;
  authors: Array<IAuthor>;
}

@observer
export class LogLineComments extends React.Component<LogLineCommentsProps, LogLineCommentsState> {
  constructor() {
    super();

    this.state = {
      comments: [],
      authors: []
    };

    this.renderComment = this.renderComment.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  public refresh() {
    this.fetchComments();
  }

  public componentWillReceiveProps(nextProps: LogLineCommentsProps) {
    if (nextProps.line) {
      this.fetchComments(nextProps.line);
    }
  }

  public async fetchComments(line?: string) {
    line = line || this.props.line;

    if (line) {
      debug(`Fetching comments for line ${line}`);

      cooperComments.getComments(line)
        .then((result: IGetCommentResponse) => {
          debug(result);
          if (result && result.comments) {
            this.setState({
              comments: result.comments,
              authors: result.authors
            });
          }
        });
    } else {
      debug('No line');
    }
  }

  public renderComment(commentObject: IComment) {
    const { comment, authorId, timestamp } = commentObject;
    const author = this.state.authors.find((a) => a._id === authorId);

    if (!author) return null;
    const { name, avatar, slackUserId } = author;
    const options = { comment, name, avatar, timestamp, slackUserId };

    return <Comment {...options} />;
  }

  public renderSignInNeccessary() {
    return <div>No soup for you!</div>;
  }

  public render() {
    const { line } = this.props;
    const { isCooperSignedIn } = this.props.state;
    const { comments } = this.state;
    const renderedComments = comments.map(this.renderComment);

    if (!line) return null;
    if (!isCooperSignedIn) return this.renderSignInNeccessary();

    return (
      <div className='Comments'>
        <h4>Comments</h4>
        {renderedComments}
        <PostComment line={line} didPost={this.refresh} />
      </div>
    );
  }
}