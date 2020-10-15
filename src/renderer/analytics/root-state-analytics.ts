import { UnzippedFile } from '../../interfaces';
import { readJsonFile } from './read-json-file';

export function getRootStateWarnings(file: UnzippedFile): Array<string> {
  const data = readJsonFile(file);
  const result: Array<string> = [];

  if (!data) {
    return result;
  }

  if (data.settings) {
    const { releaseChannelOverride } = data.settings;
    if (releaseChannelOverride !== 'prod') {
      result.push(`Release channel is set to ${releaseChannelOverride}`);
    }
  }

  return result;
}
