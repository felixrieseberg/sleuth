import * as path from 'path';

export function getWindowTitle(source?: string) {
  return source
    ? `${path.basename(source)} — Sleuth`
    : `Sleuth`;
}
