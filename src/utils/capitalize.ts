export function capitalize(word: string = ''): string {
  return word.replace(/\w/, (c) => c.toUpperCase());
}
