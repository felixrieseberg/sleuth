import * as os from 'os';

export function getSleuth() {
  let sleuths = ['🕵', '🕵️‍♀️', '🕵🏻', '🕵🏼', '🕵🏽', '🕵🏾', '🕵🏿', '🕵🏻‍♀️', '🕵🏼‍♀️', '🕵🏽‍♀️', '🕵🏾‍♀️', '🕵🏿‍♀️'];

  if (process.platform === 'darwin') {
    return sleuths[Math.floor(Math.random() * 11) + 1];
  } else if (process.platform === 'win32' && os.release().startsWith('10')) {
    sleuths = ['🕵', '🕵🏻', '🕵🏼', '🕵🏽', '🕵🏾', '🕵🏿'];
    return sleuths[Math.floor(Math.random() * 5) + 1];
  } else {
    return sleuths[Math.round(Math.random())];
  }
}
