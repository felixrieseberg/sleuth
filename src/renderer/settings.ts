import { ipcRenderer } from 'electron';

// To keep things simple, settings can only be set from the renderer

export function setSetting(key: string, value: any): Promise<any> {
  return ipcRenderer.invoke('set-settings', key, value);
}
