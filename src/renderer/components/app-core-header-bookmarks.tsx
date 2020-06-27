import { observer } from 'mobx-react';
import React from 'react';
import {
  Button,
  Popover,
  Menu,
  Position
} from '@blueprintjs/core';
import autoBind from 'react-autobind';

import { SleuthState } from '../state/sleuth';
import { Bookmark } from '../../interfaces';
import { getFileName } from '../../utils/get-file-name';
import { truncate } from '../../utils/truncate-string';
import { saveBookmark, goToBookmark, exportBookmarks, deleteAllBookmarks } from '../state/bookmarks';

export interface BookmarksProps {
  state: SleuthState;
}

export interface BookmarksState {
}

@observer
export class Bookmarks extends React.Component<BookmarksProps, Partial<BookmarksState>> {
  constructor(props: BookmarksProps) {
    super(props);
    autoBind(this);
  }

  public render() {
    const menu = <Menu>{this.renderMenu()}</Menu>;

    return (
      <Popover content={menu} position={Position.BOTTOM}>
        <Button icon='star'/>
      </Popover>
    );
  }

  public renderMenu() {
    const { bookmarks } = this.props.state;
    const items = bookmarks.map(this.renderBookmark);

    if (items.length > 0) {
      items.push(
        <Menu.Divider />,
        (
          <Menu.Item
            icon='trash'
            text='Delete all bookmarks'
            onClick={() => deleteAllBookmarks(this.props.state)}
          />
        ),
        (
          <Menu.Item
            icon='export'
            text='Export bookmarks'
            onClick={() => exportBookmarks(this.props.state)}
          />
        ),
      );
    }

    items.push(
      (
        <Menu.Item
          icon='star'
          text='Add this log message to bookmarks'
          onClick={() => saveBookmark(this.props.state)}
        />
      )
    );

    return items;
  }

  public renderBookmark(bookmark: Bookmark) {
    const { logFile, logEntry } = bookmark;
    const fileName = getFileName(logFile);
    const shortLine = truncate(logEntry.message);
    const text = `${fileName}:${logEntry.line} "${shortLine}"`;

    return (
      <Menu.Item
        icon='star'
        text={text}
        onClick={() => goToBookmark(this.props.state, bookmark)}
      />
    );
  }
}
