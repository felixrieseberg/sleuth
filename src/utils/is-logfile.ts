import { Tool, SelectableLogFile, UnzippedFile, ProcessedLogFile, MergedLogFile } from '../interfaces';

export function isProcessedLogFile(file?: SelectableLogFile): file is ProcessedLogFile {
  if (file && (file as ProcessedLogFile).type) {
    return (file as ProcessedLogFile).type && (file as ProcessedLogFile).type === 'ProcessedLogFile';
  }

  return false;
}

export function isMergedLogFile(file?: SelectableLogFile): file is MergedLogFile {
  if (file && (file as MergedLogFile).type) {
    return (file as MergedLogFile).type && (file as MergedLogFile).type === 'MergedLogFile';
  }

  return false;
}

export function isUnzippedFile(file?: SelectableLogFile): file is UnzippedFile {
  if (file && (file as UnzippedFile).fullPath) {
    return !!((file as UnzippedFile).fileName !== undefined && (file as UnzippedFile).fullPath !== undefined);
  }

  return false;
}

export function isTool(file?: SelectableLogFile): file is Tool {
  return !!(file && (file in Tool));
}

export function isLogFile(file?: SelectableLogFile): file is (MergedLogFile | ProcessedLogFile) {
  return !!(isProcessedLogFile(file) || isMergedLogFile(file));
}
