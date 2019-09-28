export function isTruthy<T>(input: null | undefined | T): input is T {
  return !!input;
}
