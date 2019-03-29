/* tslint:disable */

const options = {
  hooks: {
    generateAssets: require('./tools/generateAssets')
  },
  packagerConfig: {
    icon: './static/img/sleuth-icon',
    asar: true,
    osxSign: {
      identity: '6EAE76A75A316F8CE47BDBC19A95B44536FDCD2D'
    },
    ignore: [
      /^\/\.vscode\//,
      /^\/catapult\//,
      /^\/coverage\//,
      /^\/test\//,
      /^\/tools\//
    ],
    extendInfo: './static/extend.plist',
    win32metadata: {
      ProductName: 'Sleuth',
      CompanyName: 'Felix Rieseberg'
    },
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: {
        name: 'Sleuth',
        packageName: 'Sleuth',
        productName: 'Sleuth',
        certificateFile: process.env.SLEUTH_CERTIFICATE_FILE,
        certificatePassword: process.env.SLEUTH_CERTIFICATE_PASSWORD
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

module.exports = options;
