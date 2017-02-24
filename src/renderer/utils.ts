export function formatArray(arr: Array<any>): string {
    let result = '';

    if (arr.length === 1) {
      result = arr[0];
    } else if (arr.length === 2) {
      // Joins all entries with "and" (no commas)
      // "Bob and Sam"
      result = arr.join(' and ');
    } else if (arr.length > 2) {
      // Joins all entries with commas, but the last one gets ", and" (oxford comma!)
      // "Bob, Joe, and Sam"
      result = arr.slice(0, -1).join(', ') + ', and ' + arr.slice(-1);
    } else {
      result = '';
    }

    return result;
}
