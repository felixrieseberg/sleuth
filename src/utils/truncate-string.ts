/**
 * Truncate a string, maybe add an ellipsis
 *
 * @export
 * @param {string} input
 * @param {number} [length=20]
 * @returns
 */
export function truncate(input: string, length: number = 40) {
  return input.length > length
    ? input.substring(0, length - 1) + '…'
    : input;
}
