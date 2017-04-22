import * as os from 'os';

export function getSleuth(platform: string = process.platform, release: string = os.release()) {
  let sleuths = ['🕵', '🕵️‍♀️', '🕵🏻', '🕵🏼', '🕵🏽', '🕵🏾', '🕵🏿', '🕵🏻‍♀️', '🕵🏼‍♀️', '🕵🏽‍♀️', '🕵🏾‍♀️', '🕵🏿‍♀️'];

  if (platform === 'darwin') {
    return sleuths[Math.floor(Math.random() * 11) + 1];
  } else if (platform === 'win32' && release.startsWith('10')) {
    sleuths = ['🕵', '🕵🏻', '🕵🏼', '🕵🏽', '🕵🏾', '🕵🏿'];
    return sleuths[Math.floor(Math.random() * 5) + 1];
  } else {
    return sleuths[Math.round(Math.random())];
  }
}
