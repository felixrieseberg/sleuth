/* tslint:disable */

const path = require('path');
const fs = require('fs');

const iconDir = path.join(__dirname, 'static/img');
const version = require('./package.json').version;

const options = {
  hooks: {
    generateAssets: require('./tools/generateAssets')
  },
  packagerConfig: {
    name: 'Sleuth',
    executableName: process.platform === 'linux' ? 'sleuth' : 'Sleuth',
    icon: './static/img/sleuth-icon',
    appBundleId: 'com.felixrieseberg.sleuth',
    appCategoryType: 'public.app-category.developer-tools',
    asar: true,
    osxSign: {
      identity: '6EAE76A75A316F8CE47BDBC19A95B44536FDCD2D'
    },
    ignore: [
      /^\/\.vscode/,
      /^\/catapult/,
      /^\/coverage/,
      /^\/test/,
      /^\/tools/,
      /^\/src\//,
      /^\/static\/catapult-overrides/,
      /^\/static\/img\/sleuth/,
      /\/test\//,
      /\/[A-Za-z0-0]+\.md$/,
      /package-lock.json/,
      /react.development.js/,
    ],
    extendInfo: './static/extend.plist',
    win32metadata: {
      ProductName: 'Sleuth',
      CompanyName: 'Felix Rieseberg'
    },
    osxSign: {
      identity: 'Developer ID Application: Felix Rieseberg (LT94ZKYDCJ)'
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: (arch) => {
        const certificateFile = process.env.CI
          ? path.join(__dirname, 'cert.p12')
          : process.env.WINDOWS_CERTIFICATE_FILE;

        if (!certificateFile || !fs.existsSync(certificateFile)) {
          console.warn(`Warning: Could not find certificate file at ${certificateFile}`)
        }

        return {
          name: 'sleuth',
          authors: 'Felix Rieseberg',
          exe: 'sleuth.exe',
          loadingGif: './assets/loading.gif',
          noMsi: true,
          remoteReleases: '',
          setupExe: `sleuth-${version}-${arch}-setup.exe`,
          setupIcon: path.resolve(iconDir, 'sleuth-icon.ico'),
          certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
          certificateFile
        }
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
          owner: 'felixrieseberg',
          name: 'sleuth'
        },
        prerelease: false
      }
    }
  ]
};

module.exports = options;
