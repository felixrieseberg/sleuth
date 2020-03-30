import { SelectableLogFile } from '../renderer/interfaces';
import { isTool } from './is-logfile';

export function getIdForLogFiles(input: Array<SelectableLogFile>): string {
  return input.map(getIdForLogFile).join();
}

export function getIdForLogFile(input: SelectableLogFile): string {
  // Tools don't implement the BaseFile class
  if (isTool(input)) return input;

  // All other files do
  return input.id;
}
