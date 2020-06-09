import { RepeatedCounts } from '../renderer/interfaces';
import { RepeatedLevels } from '../shared-constants';

/**
 * Returns the number of log lines that have been repeated at least at
 * WARNING level.
 *
 * @param {RepeatedCounts} input
 * @returns {number}
 */
export function countExcessiveRepeats(input: RepeatedCounts): number {
  return Object.keys(input).filter((key) => {
    const num = input[key];

    return num >= RepeatedLevels.WARNING;
  }).length;
}
