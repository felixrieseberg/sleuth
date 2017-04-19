import { config } from '../../config';
import { remote } from 'electron';
import { sleuthState } from '../state/sleuth';

const { BrowserWindow } = remote;
const debug = require('debug')('sleuth:cooper');

export interface SigninOptions {
  silent: boolean;
}

export class CooperAuth {
  public serverUrl = config.cooperUrl;
  public signInUrl = `${this.serverUrl}/cooper/signin`;
  public signinAttempt = { hasTried: false, result: false };

  constructor() {
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
        sleuthState.isCooperSignedIn = !(!!(response && response.result));

        return response.result;
      })
      .catch((error) => debug(error));
  }

  public showSignInWindow() {
    return new Promise((resolve) => {
      const signInWindow = new BrowserWindow({
        height: 700,
        width: 800,
        webPreferences: { nodeIntegration: false }
      });

      const { webContents } = signInWindow;
      const detectSlackRegex = [
        /https:\/\/\w*.slack.com\/messages$/i,
        /https:\/\/slack.com\/checkcookie\?redir/i
      ];

      signInWindow.on('close', () => {
        debug(`Signin window closed`);
        resolve(false);
      });

      webContents.on('will-navigate', (e, navigatedUrl) => {
        debug(`Sign in window navigation attempt:`, navigatedUrl);

        detectSlackRegex.forEach((rgx => {
          if (rgx.test(navigatedUrl)) {
            // We ended up on slack.com/messages. Hopefully the cookie
            // is set, but let's restart;
            e.preventDefault();
            setTimeout(() => signInWindow.loadURL(this.signInUrl), 400);
          }
        }));
      });

      webContents.on('did-finish-load', () => {
        if (!signInWindow.isVisible()) signInWindow.show();

        if (!webContents.getURL().startsWith(`${this.serverUrl}/cooper/signin/callback?access_token=`)) {
          debug(`Sign in window loaded a page, but not the right one`);
          return;
        }

        signInWindow.hide();
        webContents.executeJavaScript(('document.body.textContent'), false, (result) => {
          try {
            const parsedResult = JSON.parse(result);

            if (parsedResult.result && parsedResult.result === 'You are signed in') {
              sleuthState.isCooperSignedIn = true;
              sleuthState.slackUserId = parsedResult.slackUserId;

              resolve(true);
              signInWindow.close();
            }
          } catch (error) {
            debug(`Tried to log in - and apparently ended up on Cooper's signin page, but something went wrong`);
            debug(error);

            signInWindow.close();
            sleuthState.isCooperSignedIn = false;
            resolve(false);
          }
        });
      });

      signInWindow.loadURL(this.signInUrl);
    });
  }

  public signIn(options?: SigninOptions) {
    return new Promise((resolve) => {
      debug(`Trying to sign into Cooper`);

      fetch(this.signInUrl, { credentials: 'include' }).then(async (response) => {
        const { url } = response;

        if (url.includes('slack.com') && (!options || !options.silent) ) {
          resolve(this.showSignInWindow());
        } else if (url.startsWith('https://slack.com/signin')) {
          debug(`Tried to silently sign in and couldn't`);
          resolve(false);
        } else {
          const responseObject = await response.json();
          const { result, slackUserId } = responseObject;
          const isSignedIn = !!(result && result === 'You are signed in');

          sleuthState.slackUserId = slackUserId;
          sleuthState.isCooperSignedIn = isSignedIn;
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
}

export const cooperAuth = new CooperAuth();
