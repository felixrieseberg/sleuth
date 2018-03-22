import { cooperComments } from '../../cooper/comments';
import { SleuthState } from '../../state/sleuth';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as moment from 'moment';
import * as Ladda from 'react-ladda';
import * as Markdown from 'markdown-it';
import * as emoji from 'markdown-it-emoji';
import * as highlight from 'markdown-it-highlightjs';

const markdown = new Markdown({ linkify: true })
  .use(highlight)
  .use(emoji);

const LaddaButton = Ladda.default;
const debug = require('debug')('sleuth:comment');

export interface CommentProps {
  name: string;
  comment: string;
  commentId: string;
  avatar: string;
  timestamp: number;
  state: SleuthState;
  slackUserId?: string;
  lineId?: string;
  didPost: () => void;
}

export interface CommentState {
  isPosting: boolean;
  isEditing: boolean;
  editValue: string;
}

@observer
export class Comment extends React.Component<CommentProps, Partial<CommentState>> {
  constructor(props: CommentProps) {
    super(props);

    this.state = {
      isPosting: false,
      isEditing: false,
      editValue: props.comment,
    };

    this.toggleEdit = this.toggleEdit.bind(this);
    this.submitEdit = this.submitEdit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  public componentWillReceiveProps(nextProps: CommentProps) {
    if (this.props.commentId !== nextProps.commentId) {
      this.setState({
        isPosting: false,
        isEditing: false,
        editValue: nextProps.comment
      });
    }
  }

  public submitEdit(e: React.FormEvent<HTMLFormElement>) {
    if (!this.props.state.selectedEntry) return;

    const { commentId, lineId } = this.props;
    const { editValue } = this.state;
    const log = this.props.state.selectedEntry.logType;

    e.preventDefault();
    if (!lineId || editValue === undefined) return;

    cooperComments.updateComment(lineId, commentId, editValue, log)
      .then(async (result) => {
        debug(`Posted a comment to cooper`, result);

        this.setState({ isPosting: false, isEditing: false, editValue: '' });
        this.props.didPost();

        debug(await result.text());
      });
  }

  public handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    this.setState({ editValue: (e.target as HTMLTextAreaElement).value });
  }

  public renderEdit() {
    const { isPosting, editValue } = this.state;
    const buttonOptions = { className: 'btn', loading: isPosting, onClick: this.submitEdit };

    return (
      <form className='EditComment' onSubmit={this.submitEdit}>
        <textarea
          id='textarea'
          onChange={this.handleChange}
          value={editValue}
        />
        <LaddaButton type='submit' {...buttonOptions}>
          {editValue ? 'Save' : 'Delete'}
        </LaddaButton>
      </form>
    );
  }

  public toggleEdit() {
    const { isEditing } = this.state;
    const newEditValue = this.props.comment;

    this.setState({ isEditing: !isEditing, editValue: newEditValue });
  }

  public renderEditButton(): JSX.Element | null {
    const { slackUserId } = this.props;
    const { slackUserId: mySlackUserId } = this.props.state;

    if (slackUserId === mySlackUserId) {
      return (<a onClick={this.toggleEdit}>Edit</a>);
    } else {
      return null;
    }
  }

  public renderMarkdown(text: string) {
    return {
      __html : markdown.render(text)
    };
  }

  public render(): JSX.Element {
    const { name, comment, avatar, timestamp } = this.props;
    const { isEditing } = this.state;
    const time = moment(timestamp).format('MMMM Do YYYY');
    const avatarStyle = { backgroundImage: `url(${avatar})` };
    const editBtn = this.renderEditButton();

    if (!isEditing) {
      return (
        <div className='Comment'>
          <div className='Avatar' style={avatarStyle} />
          <div className='Text'>
            <div>
              <span className='Name'>{name}</span>
              <span className='Timestamp'>{time}</span>
            </div>
            <div dangerouslySetInnerHTML={this.renderMarkdown(comment)} />
            {editBtn}
          </div>
        </div>
      );
    } else {
      return this.renderEdit();
    }
  }
}
