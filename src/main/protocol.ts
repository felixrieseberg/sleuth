import { app } from 'electron';

export function installProtocol() {
  if (!app.setAsDefaultProtocolClient('sleuth')) {
    console.log(`Failed to install sleuth:// protocol handler`);
  }
}

