import { MergedLogFile, ProcessedLogFile, Tool } from '../renderer/interfaces';
import { UnzippedFile } from '../renderer/unzip';

export function isProcessedLogFile(file?: UnzippedFile | MergedLogFile | ProcessedLogFile | Tool): file is ProcessedLogFile {
  if (file && (file as ProcessedLogFile).type) {
    return (file as ProcessedLogFile).type && (file as ProcessedLogFile).type === 'ProcessedLogFile';
  }

  return false;
}

export function isMergedLogFile(file?: UnzippedFile | MergedLogFile | ProcessedLogFile | Tool): file is MergedLogFile {
  if (file && (file as MergedLogFile).type) {
    return (file as MergedLogFile).type && (file as MergedLogFile).type === 'MergedLogFile';
  }

  return false;
}

export function isUnzippedFile(file?: UnzippedFile | MergedLogFile | ProcessedLogFile | Tool): file is UnzippedFile {
  if (file && (file as UnzippedFile).fullPath) {
    return !!((file as UnzippedFile).fileName !== undefined && (file as UnzippedFile).fullPath !== undefined);
  }

  return false;
}

export function isTool(file?: UnzippedFile | MergedLogFile | ProcessedLogFile | Tool): file is Tool {
  return !!(file && (file in Tool));
}

export function isLogFile(file?: UnzippedFile | MergedLogFile | ProcessedLogFile | Tool): file is (MergedLogFile | ProcessedLogFile) {
  return !!(isProcessedLogFile(file) || isMergedLogFile(file));
}
