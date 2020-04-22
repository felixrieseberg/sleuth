import { clipboard, ipcRenderer } from 'electron';
import { SleuthState } from './sleuth';
import { LogEntry } from '../interfaces';

export function copy(state: SleuthState) {
  const { selectedRangeEntries, selectedEntry } = state;

  if (!!window.getSelection()?.toString()) {
    ipcRenderer.invoke('webcontents-copy');
  } else if (selectedRangeEntries && selectedRangeEntries?.length > 1) {
    clipboard.writeText(selectedRangeEntries.map(getCopyText).join('\n'));
  } else if (selectedEntry) {
    clipboard.writeText(getCopyText(selectedEntry));
  }
}

function getCopyText(entry: LogEntry) {
  const { message, meta, timestamp } = entry;
  let text = `${timestamp} ${message}`;

  if (meta) {
    text += `\n${meta}`;
  }

  return text;
}
