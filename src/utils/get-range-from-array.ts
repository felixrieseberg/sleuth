export function getRangeEntries<T>(a: number, b: number, list: Array<T>): Array<T> {
  const lower = Math.min(a, b);
  const upper = Math.max(a, b);
  const result: Array<T> = [];

  if (!list) return result;

  for (let i = lower; i <= upper; i++) {
    result.push(list[i]);
  }

  return result;
}
