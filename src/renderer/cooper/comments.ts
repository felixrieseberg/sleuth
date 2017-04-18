import { sleuthState } from '../state/sleuth';
import * as queryString from 'query-string';

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
  public serverUrl = 'http://felix.local:8080';
  public logUrl = `${this.serverUrl}/cooper/log`;

  public postComment(line: string, comment: string, id?: string) {
    const body = JSON.stringify({
      line: { line, _id: id },
      comment
    });

    return fetch(`${this.logUrl}/browser-renderer`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      method: 'post',
      body
    });
  }

  public getComments(line: string): Promise<IGetCommentResponse> {
    const qs = queryString.stringify({line});

    return fetch(`${this.logUrl}/browser-renderer?${qs}`, { credentials: 'include' })
      .then((response) => response.json() as Promise<IGetCommentResponse>)
      .catch((error) => {
        debug(`Tried to fetch comments for line ${line} but failed`);
        debug(error);
      });
  }
}

export const cooperComments = new CooperComments();
