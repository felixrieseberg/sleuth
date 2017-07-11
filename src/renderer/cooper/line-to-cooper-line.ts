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
    name: 'team-id',
    rgx: /( |^|')("{0,1}T[A-Z0-9]{8}"{0,1})( |'|$)/g,
    replacer: ' {Team ID} '
  },
  {
    name: 'user-id',
    rgx: /( |^)("{0,1}U[A-Z0-9]{8}"{0,1})( |$)/g,
    replacer: ' {User} '
  },
  {
    name: 'ms',
    rgx: /( |^)(\d{1,20}ms)( |$)/g,
    replacer: ' {time period} '
  },
  {
    name: 'id',
    rgx: /( |^)id (\d{1,5})( |$)/g,
    replacer: ' {id} '
  },
  {
    name: 'channel-id',
    rgx: /( |^)("{0,1}(C|D)[A-Z0-9]{8}"{0,1})( |$)/g,
    replacer: ' {Channel} '
  },
  {
    name: 'was-active',
    rgx: /(was active for )\d{1,12}/g,
    replacer: '$1{Time}'
  },
  {
    name: 'usage',
    rgx: /({Team ID} usage: )\d{0,20}/g,
    replacer: '$1{Time}'
  },
  {
    name: 'deep-link',
    rgx: /slack:\/\/channel\?team=(T[A-Z0-9]{8})&id=(C|D)[A-Z0-9]{8}/,
    replacer: 'slack://channel?team={Team ID}&id={Channel ID}'
  },
  {
    name: 'double-space',
    rgx: /  /g,
    replacer: ' '
  },
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

    return output.trim();
  }

}

export const lineToCooperLine = new LineToCooperLine();
