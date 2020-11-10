import { config } from '../../config';
import queryString from 'query-string';

const debug = require('debug')('sleuth:cooper');

export interface ILine {
  _id?: string;
  line?: string;
  log?: string;
}

export interface IComment {
  name: string;
  authorId: string;
  comment: string;
  avatar: string;
  timestamp: number;
  id: string;
}

export interface IAuthor {
  _id: string;
  name: string;
  slackUserId: string;
  avatar: string;
}

export interface IGetCommentResponse {
  comments: Array<any>;
  authors: Array<any>;
  line: string;
  _id?: string;
}

export class CooperComments {
  public serverUrl = config.cooperUrl;
  public logUrl = `${this.serverUrl}/cooper/log`;

  public postComment(line: string, comment: string, log: string, id?: string) {
    const body = JSON.stringify({
      line: { line, _id: id },
      comment
    });

    log = log === 'browser' || log === 'mobile' || log === 'renderer' ? 'browser-renderer' : log;

    debug(`Posting comment for log ${log}, line ${line}`);

    return fetch(`${this.logUrl}/${log}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      method: 'post',
      body
    });
  }

  public updateComment(lineId: string, commentId: string, comment: string, log: string) {
    const body = JSON.stringify({
      line: { _id: lineId },
      comment: {
        id: commentId,
        comment
      }
    });

    log = log === 'browser' || log === 'mobile' || log === 'renderer' ? 'browser-renderer' : log;

    debug(`Updating comment for log ${log}, line ${lineId}, comment ${commentId}`);

    return fetch(`${this.logUrl}/${log}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      method: 'PATCH',
      body
    });
  }

  public getComments(line: string, log: string): Promise<void | IGetCommentResponse> {
    const qs = queryString.stringify({line});

    log = log === 'browser' || log === 'mobile' || log === 'renderer' ? 'browser-renderer' : log;

    debug(`Grabbing comments for log ${log}, line ${line}`);

    return fetch(`${this.logUrl}/${log}?${qs}`, { credentials: 'include' })
      .then((response) => response.json() as Promise<IGetCommentResponse>)
      .catch((error) => {
        debug(`Tried to fetch comments for line ${line} but failed`);
        debug(error);
      });
  }
}

export const cooperComments = new CooperComments();
