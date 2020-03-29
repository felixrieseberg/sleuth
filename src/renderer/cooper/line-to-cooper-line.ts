import { config } from '../../config';

const debug = require('debug')('sleuth:cooper');

export interface Replacer {
  name: string;
  rgx: RegExp;
  replacer: string;
}

export interface ExtraReplacer {
  name: string;
  rgx: string;
  flags: Array<string>;
  replacer: string;
}

const filters: Array<Replacer> = [
  {
    name: 'team-ids',
    rgx: /((?:\(| |^|')*(?:"{0,1}T[A-Z0-9]{8,}"{0,1})(?:\)|,| |'|$)){2,}/g,
    replacer: ` {Team IDs} `
  }, {
    name: 'user-ids',
    rgx: /((?:\(| |^|')*(?:"{0,1}(?:U|W|B)[A-Z0-9]{8,}"{0,1})(?:\)|,| |'|$)){2,}/g,
    replacer: ` {User IDs} `
  }, {
    name: 'channel-ids',
    rgx: /((?:\(| |^|')*(?:"{0,1}C[A-Z0-9]{8,}"{0,1})(?:\)|,| |'|$)){2,}/g,
    replacer: ` {Channel IDs} `
  }, {
    name: 'team-id',
    rgx: /(\(| |^|')("{0,1}T[A-Z0-9]{8,}"{0,1})(\)| |'|$)/g,
    replacer: ' {Team ID} '
  }, {
    name: 'user-id',
    rgx: /( |^)("{0,1}(?:U|W|B)[A-Z0-9]{8,}"{0,1})( |$)/g,
    replacer: ' {User} '
  }, {
    name: 'ms',
    rgx: /( |^)([\d\.]{1,20}(?: )?ms)( |$)/g,
    replacer: ' {Time period} '
  }, {
    name: 'old-timestamp',
    rgx: /\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}.\d{3}/g,
    replacer: ` {Timestamp} `
  }, {
    name: 'number',
    rgx: /( |^)(\d+(,|\.)?\d*)( |$)/g,
    replacer: ' {number} '
  }, {
    name: 'id',
    rgx: /( |^)id (\d{1,5})( |$)/g,
    replacer: ' {id} '
  }, {
    name: 'channel-id',
    rgx: /( |^|\()("{0,1}(C|D)[A-Z0-9]{8,}"{0,1})( |\)|:|$)/g,
    replacer: ' {Channel} '
  }, {
    name: 'was-active',
    rgx: /(was active for )\d{1,12}/g,
    replacer: '$1{Time}'
  }, {
    name: 'usage',
    rgx: /({Team ID} usage: )\d{0,20}/g,
    replacer: '$1{Time}'
  }, {
    name: 'deep-link',
    rgx: /slack:\/\/channel\?team=(T[A-Z0-9]{8,})&id=(C|D)[A-Z0-9]{8,}/,
    replacer: 'slack://channel?team={Team ID}&id={Channel ID}'
  }, {
    name: 'double-space',
    rgx: /  /g,
    replacer: ' '
  }, {
    name: 'emoji',
    rgx: /(?: |^):[a-z-_]{1,}:(?: |$)/g,
    replacer: ' {Emoji} '
  }, {
    name: 'shipit-line',
    rgx: /^ShipIt\[\d+:\d+\] /g,
    replacer: ' {ShipIt Line} '
  }, {
    name: 'webapp-hash',
    rgx: /( +|^)(?:[a-z0-9]{8}-\d{10}\.\d{3})(?: +|$)/g,
    replacer: ' {Hash} '
  }, {
    name: 'file-url',
    rgx: /(?:^| |")file:\/\/[\S]+(?:$| |")/g,
    replacer: ` {File Path} `
  }, {
    name: 'file-url',
    rgx: /(?:^| |")https?:\/\/[\S]+(?:$| |")/g,
    replacer: ` {HTTP URL} `
  }, {
    name: 'notification-id',
    rgx: / [a-zA-Z0-9]{14}$/g,
    replacer: ` {ID} `
  }, {
    name: 'api-descriptor',
    rgx: /noversion-[\d]{10}\.[\d]{3}/g,
    replacer: `{API Version}-{Timestamp}`
  }
];

export class LineToCooperLine {
  private filters: Array<Replacer> = [];

  constructor() {
    this.filters = filters;

    fetch(`${config.cooperUrl}/cooper/filters`)
      .then((response) => response.json())
      .then((response: any) => {
        const extraFilters = response as Array<ExtraReplacer>;

        if (extraFilters && extraFilters.length > 0) {
          extraFilters.forEach(({ flags, name, replacer, rgx }) => {
            this.filters.push({
              name,
              rgx: new RegExp(rgx, flags.join('')),
              replacer
            });
          });
        }
      })
      .catch((error) => {
        debug(`Tried to get additional filters, but failed`, error);
      });
  }

  /**
   * This method takes an input log line and transforms it into
   * something more generic - removing team ids and other
   * user-specific information.
   *
   * @export
   * @param {string} input
   * @returns {string}
   */
  public convert(input: string): string {
    let output = input;

    filters.forEach(({ rgx, replacer }) => {
      output = output.replace(rgx, replacer);
    });

    filters.forEach(({ rgx }) => (rgx.lastIndex = 0));

    return output.trim();
  }

}

export const lineToCooperLine = new LineToCooperLine();
