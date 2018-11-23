export function levelsHave(level: string, levels?: Record<string, number>) {
  if (!levels) return 0;
  if (!levels[level]) return 0;

  return levels[level];
}
