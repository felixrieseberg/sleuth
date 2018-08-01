import { ProcessedLogFile, ProcessedLogFiles } from '../renderer/interfaces';

export function getFirstLogFile(files: ProcessedLogFiles | undefined): ProcessedLogFile | undefined {
  if (files) {
    if (files.browser && files.browser.length > 0) return files.browser[0];
    if (files.renderer && files.renderer.length > 0) return files.renderer[0];
    if (files.preload && files.preload.length > 0) return files.preload[0];
    if (files.webapp && files.webapp.length > 0) return files.webapp[0];
    if (files.call && files.call.length > 0) return files.call[0];
  }

  return undefined;
}
