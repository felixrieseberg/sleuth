/**
 * Compares two arrays, returning true if equal, false if not equal.
 * Why not lodash? We got modern JS and can just use `every`.
 *
 * @param {Array} [value=[]]
 * @param {Array} [other=[]]
 * @returns {boolean} - The two arrays are equal
 */
export function isEqualArrays(value: Array<any> = [], other: Array<any> = []): boolean {
  if (value === other) return true;
  if (!value.length || !other.length || value.length !== other.length) return false;
  return value.every((e, i) => e === other[i]);
}
