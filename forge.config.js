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
    },
    extendInfo: './src/static/extend.plist',
    win32metadata: {
      ProductName: 'Sleuth',
      CompanyName: 'Felix Rieseberg'
    }
  },
  electronWinstallerConfig: {
    name: 'Sleuth',
    packageName: 'Sleuth',
    productName: 'Sleuth'
  },
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  windowsStoreConfig: {
    packageName: 'Sleuth',
    name: 'Sleuth'
  }
};

if (process.env.SLEUTH_CERTIFICATE_FILE && process.env.SLEUTH_CERTIFICATE_PASSWORD) {
  options.electronWinstallerConfig.certificateFile = process.env.SLEUTH_CERTIFICATE_FILE;
  options.electronWinstallerConfig.certificatePassword = process.env.SLEUTH_CERTIFICATE_PASSWORD;
}

module.exports = options;
