import * as fs from 'fs-extra';

import { UnzippedFile } from '../../interfaces';

export function readJsonFile(file: UnzippedFile): Record<any, any> | null {
  try {
    return fs.readJSONSync(file.fullPath);
  } catch (error) {
    alert(`Failed to read ${file.fullPath}: ${error}`);
    return null;
  }
}
