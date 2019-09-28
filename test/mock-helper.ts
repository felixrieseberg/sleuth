/**
 * `beforeEach` to test fixture setup, setting up mocks automatically for known-module
 * need to be mocked for most of modules such as logger.
 *
 * Jest configuration set to clear mocks automatically for after tests, so do not
 * need to explicitly call `jest.clearAllMocks()`.
 * @param {jest.ProvidesCallback} callback
 */
export function beforeEachWithDefaultMock(callback: jest.ProvidesCallback): void {
  jest.mock('electron', () => require('./__mocks__/electron'), { virtual: true });
  jest.mock('debug', () => (() => jest.fn()));

  beforeEach(callback);
}