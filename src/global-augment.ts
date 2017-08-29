declare module 'fs-extra' {
  function statSyncNoException(path: string | Buffer): any;
}

export {};