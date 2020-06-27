import { clipboard } from 'electron';
import { SleuthState } from './sleuth';
import { LogEntry } from '../../interfaces';

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
  const hasSelection = !!window.getSelection()?.toString();
  const hasEntries = selectedRangeEntries && selectedRangeEntries?.length > 1;
  const shouldCopy = !hasSelection && isSmartCopy;

  if (shouldCopy && hasEntries) {
    clipboard.writeText(selectedRangeEntries!.map(getCopyText).join('\n'));
    return true;
  } else if (shouldCopy && selectedEntry) {
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
