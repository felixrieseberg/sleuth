import { lineToCooperLine } from '../../cooper/line-to-cooper-line';
import { SleuthState } from '../../state/sleuth';
import * as React from 'react';
import { cooperComments, IAuthor, IComment, IGetCommentResponse } from '../../cooper/comments';
import { observer } from 'mobx-react';
import { PostComment } from './post';
import { Comment } from './comment';

const debug = require('debug')('sleuth:cooper');

export interface LogLineCommentsProps {
  state: SleuthState;
}

export interface LogLineCommentsState {
  comments: Array<any>;
  authors: Array<IAuthor>;
  line: string;
}

@observer
export class LogLineComments extends React.Component<LogLineCommentsProps, Partial<LogLineCommentsState>> {
  constructor(props: LogLineCommentsProps) {
    super();

    this.state = {
      comments: [],
      authors: [],
      line: props.state.selectedEntry ? lineToCooperLine(props.state.selectedEntry.message) : ''
    };

    this.renderComment = this.renderComment.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  public refresh() {
    this.fetchComments();
  }

  public componentWillReceiveProps(nextProps: LogLineCommentsProps) {
    if (nextProps.state.selectedEntry && nextProps.state.selectedEntry.message) {
      const line = lineToCooperLine(nextProps.state.selectedEntry.message);
      this.setState({ line });
      this.fetchComments(line);
    }
  }

  public async fetchComments(line?: string) {
    line = line || this.state.line;

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
    const author = this.state.authors!.find((a) => a._id === authorId);

    if (!author) return null;
    const { name, avatar, slackUserId } = author;
    const options = { comment, name, avatar, timestamp, slackUserId };

    return <Comment key={timestamp} {...options} />;
  }

  public renderSignInNeccessary() {
    return <div>No soup for you!</div>;
  }

  public render() {
    const { isCooperSignedIn } = this.props.state;
    const { comments, line } = this.state;
    const renderedComments = comments!.map(this.renderComment);

    if (!line) return null;
    if (!isCooperSignedIn) return this.renderSignInNeccessary();

    return (
      <div className='Comments'>
        <h4>Log Intelligence</h4>
        <div className='IntelligenceComment'>
          <label htmlFor='small_input'>To fetch comments, we generalize the log line. This one was understood as:</label>
          <input type='text' id='small_input' value={line} className='small' />
        </div>
        {renderedComments}
        <PostComment line={line} didPost={this.refresh} />
      </div>
    );
  }
}