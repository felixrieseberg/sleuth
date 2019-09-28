import {
  remote,
  TouchBarButtonConstructorOptions,
  TouchBarPopoverConstructorOptions,
} from 'electron';

import { getNiceGreeting } from '../utils/get-nice-greeting';
import { SleuthState } from './state/sleuth';
import { autorun } from 'mobx';
import { isLogFile, isProcessedLogFile } from '../utils/is-logfile';
import { levelsHave } from '../utils/level-counts';
import { plural } from '../utils/pluralize';

const { TouchBar } = remote;
const {
  TouchBarButton,
  TouchBarGroup,
  TouchBarPopover,
  TouchBarSpacer,
  TouchBarLabel
} = TouchBar;

export class TouchBarManager {
  public browserWindow: Electron.BrowserWindow;
  public touchBar: Electron.TouchBar;

  public homeBtn = new TouchBarButton(this.getHomeBtnOptions());
  public darkModeBtn = new TouchBarButton(this.getDarkModeBtnOptions());
  public spotlightBtn = new TouchBarButton(this.getSpotlightBtnOptions());
  public sidebarBtn = new TouchBarButton(this.getSidebarBtnOptions());
  public errorsLabel = new TouchBarLabel({ label: '' });

  public leftControls = new TouchBarGroup({
    items: new TouchBar({
      items: [
        this.homeBtn,
        this.darkModeBtn,
        this.sidebarBtn,
        this.spotlightBtn
      ]
    })
  });

  public toggleFilterBtns = {
    error: new TouchBarButton({
      label: '🚨 Error',
      click: () => this.onFilterToggle('error'),
    }),
    warn: new TouchBarButton({
      label: '⚠️ Warning',
      click: () => this.onFilterToggle('warn')
    }),
    info: new TouchBarButton({
      label: 'ℹ️ Info',
      click: () => this.onFilterToggle('info')
    }),
    debug: new TouchBarButton({
      label: '🐛 Debug',
      click: () => this.onFilterToggle('debug')
    })
  };

  public filterBtn = new TouchBarPopover(this.getFilterBtnOptions());

  // Lol have mercy, TS
  public items: Array<Electron.TouchBarButton
    | Electron.TouchBarColorPicker
    | Electron.TouchBarGroup
    | Electron.TouchBarLabel
    | Electron.TouchBarPopover
    | Electron.TouchBarScrubber
    | Electron.TouchBarSegmentedControl
    | Electron.TouchBarSlider
    | Electron.TouchBarSpacer>
    | undefined;

  constructor(public readonly sleuthState: SleuthState) {
    this.setLogFileItems = this.setLogFileItems.bind(this);

    this.setupTouchBar();
  }

  /**
   * This method is called right after we instantiate the manager. It sets up
   * autoruns that respond to state changes and also greets the user with a
   * kind little message.
   */
  public setupTouchBar() {
    // First, the welcome
    this.setWelcomeItems();

    autorun(() => {
      this.setFilterBtnBgColors();
    });

    autorun(() => this.setDarkModeBtn());

    autorun(() => {
      const { selectedLogFile } = this.sleuthState;

      this.setWarningLabel();

      if (isLogFile(selectedLogFile)) {
        this.setLogFileItems();
      }
    });
  }

  /**
   * Safely set the touch bar on the current window
   *
   * @param {Partial<Electron.TouchBarConstructorOptions>} options
   */
  public setTouchBar(options: Partial<Electron.TouchBarConstructorOptions>) {
    try {
      this.items = options.items;
      this.touchBar = new TouchBar(options as Electron.TouchBarConstructorOptions);
      this.browserWindow = this.browserWindow || remote.getCurrentWindow();
      this.browserWindow.setTouchBar(this.touchBar);
    } catch (error) {
      console.warn(`Could not set touch bar`, { error });
    }
  }

  /**
   * A bar that just contains a little welcome message
   */
  public setWelcomeItems() {
    this.setTouchBar({
      items: [
        new TouchBarSpacer({ size: 'flexible' }),
        new TouchBarLabel({ label: getNiceGreeting() }),
        new TouchBarSpacer({ size: 'flexible' })
      ]
    });
  }

  /**
   * A bar with the default items
   */
  public setLogFileItems() {
    this.setTouchBar({
      items: [
        this.leftControls,
        new TouchBarSpacer({ size: 'flexible' }),
        this.errorsLabel,
        new TouchBarSpacer({ size: 'flexible' }),
        this.filterBtn
      ]
    });
  }

  /**
   * Creates a button wired up to control the filters for the log table
   *
   * @returns {TouchBarButtonConstructorOptions}
   */
  public getFilterBtnOptions(): TouchBarPopoverConstructorOptions {
    const label = '🔖 Filter';
    const items = [
      this.toggleFilterBtns.error,
      this.toggleFilterBtns.warn,
      this.toggleFilterBtns.info,
      this.toggleFilterBtns.debug
    ];

    return { label, items: new TouchBar({ items }) };
  }

  /**
   * Creates a button wired up to take you home
   *
   * @returns {TouchBarButtonConstructorOptions}
   */
  public getHomeBtnOptions(): TouchBarButtonConstructorOptions {
    const label = '🏠';
    const click = () => this.sleuthState.reset(true);

    return { label, click };
  }

  /**
   * Creates a button wired up to switch the theme
   *
   * @returns {TouchBarButtonConstructorOptions}
   */
  public getDarkModeBtnOptions(): TouchBarButtonConstructorOptions {
    const label = '🌙';
    const click = () => this.sleuthState.toggleDarkMode();

    return { label, click };
  }

  /**
   * Creates a button wired up to toggle spotlight
   *
   * @returns {TouchBarButtonConstructorOptions}
   */
  public getSpotlightBtnOptions(): TouchBarButtonConstructorOptions {
    const label = '🔍';
    const click = () => this.sleuthState.toggleSpotlight();

    return { label, click };
  }

  /**
   * Creates a button wired up to toggle the sidebar
   *
   * @returns {TouchBarButtonConstructorOptions}
   */
  public getSidebarBtnOptions(): TouchBarButtonConstructorOptions {
    const label = '🗂';
    const click = () => this.sleuthState.toggleSidebar();

    return { label, click };
  }

  public setFilterBtnBgColors() {
    Object.keys(this.sleuthState.levelFilter)
      .forEach((key) => {
        this.toggleFilterBtns[key].backgroundColor = this.sleuthState.levelFilter[key]
          ? '#ffffff'
          : '#4d5a68';
      });
  }

  public setDarkModeBtn() {
    this.darkModeBtn.label = this.sleuthState.isDarkMode
      ? '🌙'
      : '☀️';
  }

  public setSpotlightBtn() {
    this.darkModeBtn.label = this.sleuthState.isSpotlightOpen
      ? '👀'
      : '🔍';
  }

  public setWarningLabel() {
    const { selectedLogFile } = this.sleuthState;

    if (isProcessedLogFile(selectedLogFile)) {
      const { levelCounts } = selectedLogFile;
      const { error, warn } = levelCounts;

      const errorCount = levelsHave('error', levelCounts);
      const warnCount = levelsHave('warn', levelCounts);
      const errorLabel = plural('error', error);
      const warnLabel = plural('warning', warn);

      if (errorCount === 0 && warnCount === 0) {
        this.errorsLabel.label = `😇 No errors or warnings`;
      } else if (errorCount < 10 && warnCount < 10) {
        this.errorsLabel.label = `😨 ${errorCount} ${errorLabel} and ${warnCount} ${warnLabel}`;
      } else if (errorCount < 100 && warnCount < 100) {
        this.errorsLabel.label = `😰 ${errorCount} ${errorLabel} and ${warnCount} ${warnLabel}`;
      } else if (errorCount < 250 && warnCount < 250) {
        this.errorsLabel.label = `😭 ${errorCount} ${errorLabel} and ${warnCount} ${warnLabel}`;
      } else if (errorCount < 800 && warnCount < 800) {
        this.errorsLabel.label = `😱 ${errorCount} ${errorLabel} and ${warnCount} ${warnLabel}`;
      } else {
        this.errorsLabel.label = `🚨 Dear god, ${errorCount} ${errorLabel} and ${warnCount} ${warnLabel}`;
      }
    } else {
      this.errorsLabel.label = '';
    }
  }

  public onFilterToggle(level: string) {
    if (this.sleuthState.levelFilter![level] !== undefined) {
      const filter = {...this.sleuthState.levelFilter};
      filter[level] = !filter[level];

      this.sleuthState.levelFilter = filter;
    }
  }
}
