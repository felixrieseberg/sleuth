import { LevelFilter } from '../renderer/interfaces';

export function didFilterChange(oldFilter: LevelFilter, newFilter: LevelFilter) {
  return (oldFilter.error !== newFilter.error ||
      oldFilter.debug !== newFilter.debug ||
      oldFilter.info !== newFilter.info ||
      oldFilter.warn !== newFilter.warn);
}
