import { ProcessedLogFiles, Tool, SelectableLogFile } from '../interfaces';

export function getFirstLogFile(files: ProcessedLogFiles | undefined): SelectableLogFile {
  if (files) {
    if (files.browser && files.browser.length > 0) return files.browser[0];
    if (files.renderer && files.renderer.length > 0) return files.renderer[0];
    if (files.preload && files.preload.length > 0) return files.preload[0];
    if (files.webapp && files.webapp.length > 0) return files.webapp[0];
    if (files.call && files.call.length > 0) return files.call[0];
    if (files.netlog && files.netlog.length > 0) return files.netlog[0];
    if (files.installer && files.installer.length > 0) return files.installer[0];
    if (files.state && files.state.length > 0) return files.state[0];
  }

  return Tool.cache;
}
