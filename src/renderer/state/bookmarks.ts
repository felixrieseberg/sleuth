import { Bookmark, SerializedBookmark, ProcessedLogFile, LogFile, LogEntry, CompressedBookmark } from '../interfaces';
import { isTool, isUnzippedFile } from '../../utils/is-logfile';
import { SleuthState } from './sleuth';

import lzString from 'lz-string';
import * as path from 'path';
import { clipboard } from 'electron';
import { showMessageBox } from '../ipc';
import { plural } from '../../utils/pluralize';

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
 * Drop all bookmarks
 *
 * @export
 * @param {SleuthState} state
 */
export function deleteAllBookmarks(state: SleuthState) {
  state.bookmarks = [];
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

/**
 * Takes serialized bookmarks (usually found in localStorage) and
 * tries to get the corresponding logFile and logEntry objects
 *
 * @export
 * @param {SleuthState} state
 * @returns
 */
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

export const CompressedLogTypes = {
  ProcessedLogFile: 0,
  MergedLogFile: 1
};

/**
 * Tries to get the SerializedBookmark down to a smaller size.
 *
 * @param {SerializedBookmark} input
 * @returns {CompressedBookmark}
 */
export function compressBookmark(input: SerializedBookmark): CompressedBookmark {
  return [input.logEntry.line, input.logEntry.index, input.logFile.id, CompressedLogTypes[input.logFile.type]];
}

/**
 * Turn a compressed bookmark into a SerializedBookmark
 *
 * @param {CompressedBookmark} input
 * @returns {SerializedBookmark}
 */
export function decompressBookmark(input: CompressedBookmark): SerializedBookmark {
  const logFileType = Object.keys(CompressedLogTypes).find((key) => {
    return input[3] === CompressedLogTypes[key];
  }) as 'MergedLogFile' | 'ProcessedLogFile';

  return {
    logEntry: {
      line: input[0],
      index: input[1]
    },
    logFile: {
      id: input[2],
      type: logFileType
    }
  };
}

/**
 * Export bookmarks to the clipboard
 *
 * @param {SleuthState} state
 */
export function exportBookmarks(state: SleuthState) {
  const source = path.basename(state.source || '');
  const serialized = state.bookmarks
    .map(serializeBookmark)
    .map(compressBookmark);

  const data = JSON.stringify({
    s: source,
    b: serialized
  });

  const compressed = lzString.compressToEncodedURIComponent(data);
  const link = `sleuth://bookmarks?data=${compressed}`;

  console.group(`Exporting bookmarks`);
  console.log(`Serialized`, serialized);
  console.log(`Data`, data);
  console.log(`Link`, link);
  console.groupEnd();

  clipboard.writeText(link);
  alert(`A link containing the bookmarks has been written to your clipboard.`);
}

/**
 * Import bookmarks
 *
 * @export
 * @param {SleuthState} state
 * @param {string} input
 */
export async function importBookmarks(state: SleuthState, input: string) {
  try {
    const raw = lzString.decompressFromEncodedURIComponent(input);
    const data = JSON.parse(raw);
    const deserialized: Array<Bookmark> = data.b
      .map(decompressBookmark)
      .map((v: SerializedBookmark) => deserializeBookmark(state, v))
      .filter((v: Bookmark) => !!v);

    if (deserialized.length === 0) {
      throw new Error('We could parse the data, but we could not find any matching bookmarks.');
    }

    // Let's first see if the user actually wants this
    const { response } = await showMessageBox({
      type: 'question',
      title: 'Import bookmarks?',
      message: `We're ready to import ${deserialized.length} ${plural('bookmark', deserialized.length)}.`,
      buttons: [ 'Merge with my bookmarks', 'Replace my bookmarks', 'Cancel' ],
      defaultId: 0,
    });

    // Merge
    if (response === 0) {
      deserialized.forEach((v) => saveBookmark(state, v));
    } else if (response === 1) {
      state.bookmarks = deserialized;
    }
  } catch (error) {
    alert(`We tried to parse the bookmark data, but failed. The error was: ${error}`);
  }
}

