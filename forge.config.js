/* tslint:disable */

const options = {
  hooks: {
    generateAssets: require('./tools/generateAssets')
  },
  packagerConfig: {
    icon: './src/static/sleuth-icon',
    asar: true,
    osxSign: {
      identity: '6EAE76A75A316F8CE47BDBC19A95B44536FDCD2D'
    },
    extendInfo: './src/static/extend.plist',
    win32metadata: {
      ProductName: 'Sleuth',
      CompanyName: 'Felix Rieseberg'
    }
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: {
        name: 'Sleuth',
        packageName: 'Sleuth',
        productName: 'Sleuth'
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"]
    },
    {
      name: "@electron-forge/maker-deb",
      platforms: ["linux"]
    },
    {
      name: "@electron-forge/maker-rpm",
      platforms: ["linux"]
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'electron',
          name: 'fiddle'
        },
        prerelease: true
      }
    }
  ]
};

if (process.env.SLEUTH_CERTIFICATE_FILE && process.env.SLEUTH_CERTIFICATE_PASSWORD) {
  options.electronWinstallerConfig.certificateFile = process.env.SLEUTH_CERTIFICATE_FILE;
  options.electronWinstallerConfig.certificatePassword = process.env.SLEUTH_CERTIFICATE_PASSWORD;
} else if (process.platform === 'win32') {
  console.log(`Warning: Password or certificate missing`);
  console.log(`You can set it with SLEUTH_CERTIFICATE_FILE and SLEUTH_CERTIFICATE_PASSWORD`);
  console.log(`Currently set:`);
  console.log(`SLEUTH_CERTIFICATE_FILE: ${process.env.SLEUTH_CERTIFICATE_FILE}`);
  console.log(`SLEUTH_CERTIFICATE_PASSWORD: ${process.env.SLEUTH_CERTIFICATE_PASSWORD}`);
}

module.exports = options;
