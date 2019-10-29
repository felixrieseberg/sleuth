export function getOSInfo(data?: Record<string, any>): string {
  if (!data) {
    return 'Unknown';
  }

  const os = getPlatform(data);
  const { platformVersion, pretendNotReallyWindows10 } = data;
  const osVersion = platformVersion && platformVersion.major ? `(${platformVersion.major}.${platformVersion.minor})` : '(unknown version)';
  let windowsInfo = '';

  if (os === 'Windows' && platformVersion) {
    const niceName = getWindowsVersion(platformVersion);
    windowsInfo = pretendNotReallyWindows10
      ? ` We're pretending it's an older version, but the user is running on ${niceName}`
      : ` That's ${niceName}`;
  }

  return `${os} ${osVersion}.${windowsInfo}`;
}

export function getVersionInfo({ appVersion, versionName }: any): string {
  return appVersion ? `${appVersion} (${versionName || 'no name'})` : '';
}

function getPlatform(data?: Record<string, any>): string {
  if (!data) {
    return 'unknown';
  }

  const { platform } = data;
  let os = platform ? platform.replace('darwin', 'macOS').replace('win32', 'Windows').replace('linux', 'Linux') : null;

  if (!os) {
    if (data.win32) {
      os = 'Windows';
    } else if (data.darwin) {
      os = 'macOS';
    } else if (data.linux) {
      os = 'Linux';
    }

  }

  return os;
}

function getWindowsVersion({ major, minor, build }: { major: number, minor: number, build: number }): string {
  if (major === 10 && minor === 0) {
    let buildName = '';

    if (build <= 10240) buildName = 'Original Release (RTM), ';
    if (build >= 10586) buildName = 'Threshold 2 (First major round of updates in 2015), ';
    if (build >= 14393) buildName = 'Anniversary Update, ';
    if (build >= 15063) buildName = 'Creators Update, ';
    if (build >= 16299) buildName = 'Fall Creators Update, ';
    if (build >= 17000) buildName = 'April 2018 Update, ';
    if (build >= 17600) buildName = 'October 2018 Update, ';

    return `Windows 10 (${buildName}Build ${build})`;
  }

  // Windows NT 6 and up
  if (major === 6) {
    if (minor === 0) return (`Windows Vista (NT 6.0, Build ${build})`);
    if (minor === 1) return (`Windows 7 (NT 6.1, Build ${build})`);
    if (minor === 2) return (`Windows 8 (NT 6.2, Build ${build})`);
    if (minor === 3) return (`Windows 8.1 (NT 6.3, Build ${build})`);
  }

  return `an unknown Windows version (${major}.${minor}, Build ${build})`;
}
