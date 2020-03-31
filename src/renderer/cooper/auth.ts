import path from 'path';
import { config } from '../../config';
import { remote } from 'electron';
import { SleuthState } from '../state/sleuth';
import { showMessageBox } from '../ipc';

const { BrowserWindow } = remote;
const debug = require('debug')('sleuth:cooper');

export interface SigninOptions {
  silent: boolean;
}

export class CooperAuth {
  public serverUrl = config.cooperUrl;
  public signInUrl = `${this.serverUrl}/cooper/signin`;
  public signinAttempt = { hasTried: false, result: false };
  private signInWindow: Electron.BrowserWindow;

  constructor(public readonly sleuthState: SleuthState) {
    this.signIn = this.signIn.bind(this);
    this.signOut = this.signOut.bind(this);

    this.getIsSignedIn({silent: true});
  }

  public getIsSignedIn(options?: SigninOptions): Promise<boolean> {
    if (this.signinAttempt.hasTried) return Promise.resolve(this.signinAttempt.result);

    return this.signIn(options);
  }

  public signOut() {
    debug(`Trying to sign out of Cooper`);

    return fetch(`${this.serverUrl}/cooper/signout`, { credentials: 'include' })
      .then(async (response) => response.json())
      .then((response: any) => {
        debug(`Attempted to sign out. Result: ${response.result}`);
        this.sleuthState.isCooperSignedIn = !(!!(response && response.result));

        return response.result;
      })
      .catch((error) => debug(error));
  }

  public showSignInWindowWarning(): Promise<Electron.MessageBoxReturnValue> {
    const options: Electron.MessageBoxOptions = {
      type: 'info',
      buttons: [ 'Okay' ],
      title: 'Sleuth tries to help',
      message: `To sign in, please sign into the Slack team "tinyspeck". ` +
        `If asked which workspace to launch, please select "Global".\n\n` +
        `Sleuth will attempt to click the right buttons automatically.`
    };

    return showMessageBox(options);
  }

  public showSignInWindow(): Promise<boolean> {
    return new Promise(async (resolve) => {
      await this.showSignInWindowWarning();

      const preload = config.isDevMode
        ? path.join(__dirname, '../../src/renderer/cooper/auth-preload.js')
        : path.join(__dirname, 'auth-preload.js');

      this.signInWindow = new BrowserWindow({
        height: 700,
        width: 800,
        parent: remote.getCurrentWindow(),
        webPreferences: {
          preload,
          nodeIntegration: false
        }
      });

      this.maybeShowDevTools();

      const { webContents } = this.signInWindow;
      const detectSlackRegex = [
        /https:\/\/\app.slack.com\$/i,
        /https:\/\/\w*.slack.com\/messages$/i,
        /https:\/\/slack.com\/checkcookie\?redir/i
      ];
      const loadTeamMaybe = (e: any, url: string) => {
        debug(`Sign in window navigation attempt:`, url);

        detectSlackRegex.forEach((rgx) => {
          if (rgx.test(url)) {
            // We ended up on slack.com/messages. Hopefully the cookie
            // is set, but let's restart;
            e.preventDefault();
            setTimeout(() => this.signInWindow.loadURL(this.signInUrl), 400);
          }
        });
      };

      this.signInWindow.on('close', () => {
        debug(`Signin window closed`);
        resolve(false);
      });

      webContents.on('will-navigate', (e, url) => loadTeamMaybe(e, url));
      webContents.on('new-window', (e, url) => loadTeamMaybe(e, url));

      webContents.on('did-finish-load', async () => {
        const url = webContents.getURL();

        if (url.startsWith('https://slack.com/signin?redir')) {
          await this.tryToEnterTeamName();
          this.signInWindow.show();
        } else {
          this.signInWindow.show();
        }

        if (url.startsWith('https://slack.enterprise.slack.com/?redir=')) {
          this.tryToLaunchGlobal();
        }

        if (!url.startsWith(`${this.serverUrl}/cooper/signin/callback?access_token=`)) {
          debug(`Sign in window loaded a page, but not the right one (yet)`, webContents.getURL());
          return;
        } else {
          this.getSignInResults();
        }
      });


      this.signInWindow.loadURL(this.signInUrl);
    });
  }

  public signIn(options?: SigninOptions): Promise<boolean> {
    return new Promise((resolve) => {
      debug(`Trying to sign into Cooper`);

      fetch(this.signInUrl, { credentials: 'include' }).then(async (response) => {
        const { url } = response;

        if (url.includes('slack.com') && (!options || !options.silent)) {
          resolve(this.showSignInWindow());
        } else if (url.startsWith('https://slack.com/signin')) {
          debug(`Tried to silently sign in and couldn't`);
          resolve(false);
        } else {
          debug(`Received response from ${response.url}`);

          const responseObject = await response.json();
          const { result, slackUserId } = responseObject;
          const isSignedIn = !!(result && result === 'You are signed in');

          this.sleuthState.slackUserId = slackUserId;
          this.sleuthState.isCooperSignedIn = isSignedIn;
          resolve(isSignedIn);

          debug(`User is signed into cooper: ${isSignedIn}`, responseObject);
        }
      })
      .catch((error) => {
        resolve(false);
        debug(`Tried sign into Cooper, but failed`, error);
      });
    });
  }

  public tryToEnterTeamName() {
    return new Promise((_resolve, reject) => {
      if (!this.signInWindow) return reject('Tried to get results, but could not find window');

      return this.signInWindow.webContents.executeJavaScript(`tryToEnterTeamDomain()`, false);
    });
  }

  public tryToLaunchGlobal() {
    return new Promise((_resolve, reject) => {
      if (!this.signInWindow) return reject('Tried to get results, but could not find window');

      return this.signInWindow.webContents.executeJavaScript(`tryToLaunchGlobal()`, false);
    });
  }

  public maybeShowDevTools() {
    if (this.signInWindow && config.isDevMode) {
      //this.signInWindow.webContents.toggleDevTools();
    }
  }

  public async getSignInResults() {
    this.signInWindow.hide();
    const result = await this.signInWindow.webContents.executeJavaScript(('document.body.textContent'), false);

    try {
      const parsedResult = JSON.parse(result);

      if (parsedResult.result && parsedResult.result === 'You are signed in') {
        this.sleuthState.isCooperSignedIn = true;
        this.sleuthState.slackUserId = parsedResult.slackUserId;
        this.signInWindow.close();

        return true;
      }
    } catch (error) {
      debug(`Tried to log in - and apparently ended up on Cooper's signin page, but something went wrong`);
      debug(error);

      this.signInWindow.close();
      this.sleuthState.isCooperSignedIn = false;
    }

    return false;
  }
}
