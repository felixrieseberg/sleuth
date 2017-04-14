import * as React from 'react';
import * as moment from 'moment';

const debug = require('debug')('sleuth:comment');

export interface CommentProps {
  name: string;
  comment: string;
  avatar: string;
  timestamp: number;
  id: string;
}

export interface CommentState {

}

export class Comment extends React.Component<CommentProps, CommentState> {
  constructor() {
    super();
  }

  public render() {
    const { name, comment, avatar, timestamp, id } = this.props;
    const time = moment(timestamp).format('MMMM Do YYYY');
    const avatarStyle = { backgroundImage: `url(${avatar})` };

    return (
      <div className='Comment' key={id}>
        <div className='Avatar' style={avatarStyle} />
        <div className='Text'>
          <div>
            <span className='Name'>{name}</span>
            <span className='Timestamp'>{time}</span>
          </div>
          <div>{comment}</div>
        </div>
      </div>
    );
  }
}
