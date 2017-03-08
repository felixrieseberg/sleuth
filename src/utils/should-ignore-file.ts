  /**
   * Should this file be ignored?
   *
   * @param {string} fileName
   * @returns {boolean}
   */
  export function shouldIgnoreFile(fileName: string): boolean {
    if (fileName === '.DS_Store') {
      return true;
    }

    return false;
  }