export function isCacheDir(input: Array<string>) {
  return input.includes('index')
    && input.includes('index-dir');
}
