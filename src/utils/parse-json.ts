import dirtyJSON from 'jsonic';

export function parseJSON(input: string) {
  try {
    return dirtyJSON(input);
  } catch (error) {
    return null;
  }
}
