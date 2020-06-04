import { clipboard, ipcRenderer } from 'electron';
import { SleuthState } from './sleuth';
import { LogEntry } from '../interfaces';

/**
 * Performs a copy operation. Returns true if it did something,
 * false if it didn't.
 *
 * @export
 * @param {SleuthState} state
 * @returns {boolean}
 */
export function copy(state: SleuthState): boolean {
  const { selectedRangeEntries, selectedEntry, isSmartCopy } = state;

  if (!!window.getSelection()?.toString()) {
    ipcRenderer.invoke('webcontents-copy');
    return true;
  } else if (isSmartCopy && selectedRangeEntries && selectedRangeEntries?.length > 1) {
    clipboard.writeText(selectedRangeEntries.map(getCopyText).join('\n'));
    return true;
  } else if (isSmartCopy && selectedEntry) {
    clipboard.writeText(getCopyText(selectedEntry));
    return true;
  }

  return false;
}

function getCopyText(entry: LogEntry) {
  const { message, meta, timestamp } = entry;
  let text = `${timestamp} ${message}`;

  if (meta) {
    text += `\n${meta}`;
  }

  return text;
}
