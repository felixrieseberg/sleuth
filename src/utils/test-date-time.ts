import { format } from 'date-fns';

/**
 * date-fns will throw if we pass it an invalid (or old) format. This method
 * checks if we can use it to format and returns a fallback value if we cannot.
 *
 * @param {string} input
 * @param {string} fallback
 * @returns {string}
 */
export function testDateTimeFormat(input: string, fallback: string): string {
  try {
    format(Date.now(), input);

    return input;
  } catch (error) {
    return fallback;
  }
}
