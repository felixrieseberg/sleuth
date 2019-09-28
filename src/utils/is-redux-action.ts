const regex = /^[A-Z_]*$/;

/**
 * Does this string contain something that looks like a Redux action?
 *
 * @export
 * @param {string} input
 * @returns {string|undefined} The Redux action or undefined
 */
export function isReduxAction(input: string): boolean {
  const words = input.split(' ');
  const action = words.find((w) => w.includes('_') && regex.test(w));

  return !!action;
}
