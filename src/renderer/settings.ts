import { ipcRenderer } from 'electron';

// List of settings we don't want in main
const SETTING_DENY_LIST = [
  'serializedBookmarks'
];

// To keep things simple, settings can only be set from the renderer
export async function setSetting(key: string, value: any): Promise<any> {
  if (SETTING_DENY_LIST.includes(key)) return;

  try {
    ipcRenderer.invoke('set-settings', key, value);
  } catch (error) {
    console.error(`Failed to set key ${key} in main`, {
      error,
      value
    });
  }
}
