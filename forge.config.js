/* tslint:disable */

const path = require('path');
const fs = require('fs');

const iconDir = path.join(__dirname, 'static/img');
const version = require('./package.json').version;

if (process.env['WINDOWS_CODESIGN_FILE']) {
  const certPath = path.join(__dirname, 'win-certificate.pfx');
  const certExists = fs.existsSync(certPath);

  if (certExists) {
    process.env['WINDOWS_CODESIGN_FILE'] = certPath;
  }
}

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
    asar: {
      unpackDir: '**/cachetool'
    },
    osxSign: {
      identity: 'Developer ID Application: Felix Rieseberg (LT94ZKYDCJ)',
      hardenedRuntime: true,
      'gatekeeper-assess': true,
      'entitlements': 'static/entitlements.plist',
      'entitlements-inherit': 'static/entitlements.plist',
      'signature-flags': 'library',
      requirements: path.resolve(__dirname, 'tools', 'certs', 'designated-requirements')
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
    }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: (arch) => {
        return {
          name: 'sleuth',
          authors: 'Felix Rieseberg',
          exe: 'sleuth.exe',
          noMsi: true,
          setupExe: `sleuth-${version}-${arch}-setup.exe`,
          setupIcon: path.resolve(iconDir, 'sleuth-icon.ico'),
          certificateFile: process.env['WINDOWS_CODESIGN_FILE'],
          certificatePassword: process.env['WINDOWS_CODESIGN_PASSWORD'],
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

function notarizeMaybe() {
  if (process.platform !== 'darwin') {
    return;
  }

  if (!process.env.CI && !process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.log(`Not in CI, skipping notarization`);
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.warn('Should be notarizing, but environment variables APPLE_ID or APPLE_ID_PASSWORD are missing!');
    return;
  }

  options.packagerConfig.osxNotarize = {
    appBundleId: 'com.felixrieseberg.sleuth',
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    ascProvider: 'LT94ZKYDCJ'
  }

  console.log(`Notarization enabled`);
}

notarizeMaybe()

module.exports = options;
