import { getRandomNumber } from './random';

/**
 * Get a random nice greeting
 *
 * @export
 * @returns
 */
export function getNiceGreeting() {
  const greetings = [
    '👋 Thanks for checking out logs',
    '💖 You got this',
    `💖 We think you're great`,
    '🤘 Your rock, we know it',
    '🙇‍♀️ Thanks for trying out Sleuth',
    '🐕 Go pet a dog today',
    '🐈 Go pet a cat today',
    '💧 Stay hydrated',
    '🙇‍♂️ Many thanks from the desktop team'
  ];

  const min = 0;
  const max = greetings.length;

  return greetings[getRandomNumber(min, max)];
}
