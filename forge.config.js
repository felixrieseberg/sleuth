const options = {
  make_targets: {
    win32: [ 'squirrel' ],
    darwin: [ 'zip' ],
    linux: [ 'deb', 'rpm' ]
  },
  electronPackagerConfig: {
    icon: './src/static/sleuth-icon',
    asar: true,
    osxSign: {
      identity: 'LT94ZKYDCJ'
    }
  },
  electronWinstallerConfig: {
    name: 'Sleuth'
  },
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  windowsStoreConfig: {
    packageName: '',
    name: 'Sleuth'
  }
};

if (process.env.SLEUTH_CERTIFICATE_FILE && process.env.SLEUTH_CERTIFICATE_PASSWORD) {
  options.electronWinstallerConfig.certificateFile = process.env.SLEUTH_CERTIFICATE_FILE;
  options.electronWinstallerConfig.certificatePassword = process.env.SLEUTH_CERTIFICATE_PASSWORD;
}

module.exports = options;
