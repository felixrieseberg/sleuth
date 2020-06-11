import { ipcRenderer } from 'electron';
import { ICON_NAMES } from '../shared-constants';

// This file handles sending IPC events. Other classes might
// listen to IPC events.


type name = 'home' | 'appData' | 'userData' | 'cache' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'logs' | 'pepperFlashSystemPlugin';
export function getPath(
  path: name
): Promise<string> {
  return ipcRenderer.invoke('get-path', path);
}

export function sendWindowReady() {
  ipcRenderer.send('window-ready');
}

export function showOpenDialog(): Promise<Electron.OpenDialogReturnValue> {
  return ipcRenderer.invoke('show-open-dialog');
}

export function showSaveDialog(filename: string): Promise<Electron.SaveDialogReturnValue> {
  return ipcRenderer.invoke('show-save-dialog', filename);
}

export function showMessageBox(
  options: Electron.MessageBoxOptions
): Promise<Electron.MessageBoxReturnValue> {
  return ipcRenderer.invoke('message-box', options);
}

export function changeIcon(iconName: ICON_NAMES) {
  return ipcRenderer.invoke('change-icon', iconName);
}
