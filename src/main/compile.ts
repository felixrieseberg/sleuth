import * as electronCompile from 'electron-compile';

export function allowLoadGpuFile() {
  const { addBypassChecker } = (electronCompile as any);

  addBypassChecker((filePath: string) => {
    return filePath.endsWith('gpu-log.html');
  });
}
