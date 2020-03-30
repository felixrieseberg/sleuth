import { Bookmark } from '../interfaces';
import { isTool } from '../../utils/is-logfile';
import { SleuthState } from './sleuth';

/**
 * Go to the given bookmark
 *
 * @param {Bookmark} bookmark
 */
export function goToBookmark(state: SleuthState, bookmark: Bookmark) {
  state.selectedLogFile = bookmark.logFile;
  state.selectedEntry = bookmark.logEntry;
  state.selectedIndex = bookmark.index;
}

/**
 * Get a bookmark
 *
 * @export
 * @param {SleuthState} state
 * @returns {(Bookmark | undefined)}
 */
export function getBookmark(state: SleuthState): Bookmark | undefined {
  // No point in saving a bookmark unless we have
  // a path
  if (!state.selectedEntry || !state.selectedLogFile || !state.selectedIndex) {
    return;
  }

  // Don't bookmark tools
  if (isTool(state.selectedLogFile)) {
    return;
  }

  const bookmark: Bookmark = {
    logEntry: state.selectedEntry,
    logFile: state.selectedLogFile,
    index: state.selectedIndex
  };

  return bookmark;
}

/**
 * Delete or create a bookmark
 *
 * @param {SleuthState} state
 * @param {(Bookmark | undefined)} [bookmark=getBookmark(state)]
 */
export function toggleBookmark(state: SleuthState, bookmark: Bookmark | undefined = getBookmark(state)): void {
  if (getIsBookmark(state, bookmark)) {
    deleteBookmark(state, bookmark);
  } else {
    saveBookmark(state, bookmark);
  }
}

/**
 * Save the currently selected line as a bookmark.
 *
 * Returns undefined if no bookmark was created.
 */
export function saveBookmark(state: SleuthState, bookmark: Bookmark | undefined = getBookmark(state)): void {
  const hasBookmark = getIsBookmark(state, bookmark);

  if (bookmark && !hasBookmark) {
    state.bookmarks.push(bookmark);
  }
}

/**
 * Delete a given bookmark
 *
 * @param {SleuthState} state
 * @param {Bookmark} bookmark
 */
export function deleteBookmark(state: SleuthState, bookmark: Bookmark | undefined = getBookmark(state)): void {
  const index = getBookmarkIndex(state, bookmark);

  if (index > -1) {
    state.bookmarks.splice(index, 1);
  }
}

/**
 * Is the currently selected line (or passed bookmark) a bookmark?
 *
 * @param {Bookmark} [bookmark=state.getBookmark()]
 * @returns {boolean}
 */
export function getIsBookmark(state: SleuthState, bookmark: Bookmark | undefined = getBookmark(state)): boolean {
  return getBookmarkIndex(state, bookmark) > -1;
}

/**
 * Get the index for the currently selected line or passed bookmark
 *
 * @param {SleuthState} stat
 * @param {(Bookmark | undefined)} [bookmark=getBookmark(state)]
 * @returns {number}
 */
export function getBookmarkIndex(state: SleuthState, bookmark: Bookmark | undefined = getBookmark(state)): number {
  if (!bookmark) return -1;

  return state.bookmarks.findIndex((v) => {
    return v.index === bookmark.index &&
      v.logFile.id === bookmark.logFile.id &&
      v.logEntry.line === bookmark.logEntry.line;
  });
}
