export function plural(text: string, arr: Array<any>): string {
  if (arr.length > 1) {
    return `${text}s`;
  }

  return text;
}
