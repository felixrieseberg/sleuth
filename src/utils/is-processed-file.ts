import { UnzippedFile } from '../renderer/unzip';
import { ProcessedLogFile } from '../renderer/interfaces';

export function isProcessedFile(
  file: UnzippedFile | ProcessedLogFile
): file is ProcessedLogFile {
  return !!(file as ProcessedLogFile).logFile;
}
