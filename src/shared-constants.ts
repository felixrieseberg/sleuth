export interface StringMap<T> {
  [key: string]: T;
}

export const enum RepeatedLevels {
  NOTIFY = 10,
  WARNING = 100,
  ERROR = 500
}

export const enum ICON_NAMES {
  default = 'sleuth-icon',
  mark = 'sleuth-icon-mark'
}
