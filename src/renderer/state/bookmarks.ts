import { Bookmark, SerializedBookmark, ProcessedLogFile, LogFile, LogEntry } from '../interfaces';
import { isTool, isUnzippedFile } from '../../utils/is-logfile';
import { SleuthState } from './sleuth';

/**
 * Go to the given bookmark
 *
 * @param {Bookmark} bookmark
 */
export function goToBookmark(state: SleuthState, bookmark: Bookmark) {
  state.selectedLogFile = bookmark.logFile;
  state.selectedEntry = bookmark.logEntry;
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

  // Don't bookmark tools and unzipped files
  if (isTool(state.selectedLogFile) || isUnzippedFile(state.selectedLogFile)) {
    return;
  }

  const bookmark: Bookmark = {
    logEntry: state.selectedEntry,
    logFile: state.selectedLogFile
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

  (window as any).requestIdleCallback(() => {
    saveBookmarks(state);
  }, { timeout: 2000 });
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
    return v.logFile.id === bookmark.logFile.id &&
      v.logEntry.line === bookmark.logEntry.line;
  });
}

export function saveBookmarks(state: SleuthState) {
  const serialized = state.bookmarks.map(serializeBookmark);
  const { source } = state;

  if (!source) {
    console.warn(`Tried to save bookmarks, but no "source" available`);
    return;
  }

  state.serializedBookmarks[source] = serialized;
}

export function rehydrateBookmarks(state: SleuthState) {
  const { source, serializedBookmarks } = state;

  if (!source) {
    console.warn(`Tried to rehydrate bookmarks, but no "source" available`);
    return;
  }

  if (!serializedBookmarks) {
    console.warn(`Tried to rehydrate bookmarks, but no "serializedBookmarks" available`);
    return;
  }

  if (Object.keys(serializedBookmarks).length === 0) {
    console.log(`Tried to rehydrate bookmarks, but "serializedBookmarks" is empty`);
    return;
  }

  const serialized = (serializedBookmarks[source] || [])
    .map((v) => deserializeBookmark(state, v))
    .filter((v) => !!v);

  state.bookmarks = serialized as Array<Bookmark>;
}

export function serializeBookmark(bookmark: Bookmark): SerializedBookmark {
  return {
    logEntry: {
      line: bookmark.logEntry.line,
      index: bookmark.logEntry.index
    },
    logFile: {
      id: bookmark.logFile.id,
      type: bookmark.logFile.type
    }
  };
}

export function deserializeBookmark(state: SleuthState, serialized: SerializedBookmark): Bookmark | undefined {
  let logFile: LogFile | undefined;
  let logEntry: LogEntry | undefined;

  // Let's find the file
  if (serialized.logFile.type === 'ProcessedLogFile') {
    if (!state.processedLogFiles) return;

    Object.keys(state.processedLogFiles).some((key) => {
      const files = state.processedLogFiles![key];
      const foundFile = files.find((file: ProcessedLogFile) => file.id === serialized.logFile.id);

      if (foundFile) {
        logFile = foundFile;
        return true;
      }

      return false;
    });
  } else if (serialized.logFile.type === 'MergedLogFile') {
      if (!state.mergedLogFiles) return;

    Object.keys(state.mergedLogFiles).some((key) => {
      const file = state.mergedLogFiles![key];

      if (file.id === serialized.logFile.id) {
        logFile = file;
        return true;
      }

      return false;
    });
  }


  // If we didn't find the file, stop here
  if (!logFile) {
    return;
  }

  // Let's find the entry. Start with the index.
  const entryCandidate = logFile.logEntries[serialized.logEntry.index];

  // Do we have a candidate?
  if (entryCandidate && entryCandidate.line === serialized.logEntry.line) {
    logEntry = entryCandidate;
  } else {
    return;
  }

  return {
    logFile,
    logEntry
  };
}
