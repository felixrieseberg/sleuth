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

export const enum TOUCHBAR_IPC {
  LEVEL_FILTER_UPDATE = 'LEVEL_FILTER_UPDATE',
  DARK_MODE_UPDATE = 'DARK_MODE_UPDATE',
  LOG_FILE_UPDATE = 'LOG_FILE_UPDATE',
}

export const enum STATE_IPC {
  TOGGLE_SPOTLIGHT = 'TOGGLE_SPOTLIGHT',
  TOGGLE_SIDEBAR = 'TOGGLE_SIDEBAR',
  TOGGLE_DARKMODE = 'TOGGLE_DARKMODE',
  OPEN_BOOKMARKS = 'OPEN_BOOKMARKS',
  TOGGLE_FILTER = 'TOGGLE_FILTER',
  COPY = 'COPY',
  RESET = 'RESET',
}
