export function between(value: number, first: number, last: number) {
  const lower = Math.min(first, last);
  const upper = Math.max(first, last);

  return value >= lower &&  value <= upper;
}
