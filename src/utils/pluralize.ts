export function plural(text: string, input: Array<any> | number): string {
  let pluralize = false;

  if (typeof input === 'number' && input > 1) {
    pluralize = true;
  } else if (Array.isArray(input) && input.length > 1) {
    pluralize = true;
  }

  return pluralize
    ? `${text}s`
    : text;
}
