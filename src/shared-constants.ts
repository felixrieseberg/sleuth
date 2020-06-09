export interface StringMap<T> {
  [key: string]: T;
}

export const enum RepeatedLevels {
  NOTIFY = 10,
  WARNING = 100,
  ERROR = 500
}
