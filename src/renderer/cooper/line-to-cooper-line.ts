export interface Replacer {
  name: string;
  rgx: RegExp;
  replacer: string;
}

const filters: Array<Replacer> = [
  {
    name: 'team-id',
    rgx: /( |^)("{0,1}T[A-Z0-9]{8}"{0,1})( |$)/g,
    replacer: ' {Team ID} '
  },
  {
    name: 'user-id',
    rgx: /( |^)("{0,1}U[A-Z0-9]{8}"{0,1})( |$)/g,
    replacer: ' {User} '
  },
  {
    name: 'channel-id',
    rgx: /( |^)("{0,1}(C|D)[A-Z0-9]{8}"{0,1})( |$)/g,
    replacer: ' {Channel} '
  },
  {
    name: 'url',
    rgx: /( |^)("{0,1}https:\/\/\w{0,30}\.slack\.com[\S]{0,40}"{0,1})( |$)/g,
    replacer: ' {URL} '
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
  }
];

/**
 * This method takes an input log line and transforms it into
 * something more generic - removing team ids and other
 * user-specific information.
 *
 * @export
 * @param {string} input
 * @returns {string}
 */
export function lineToCooperLine(input: string): string {
  let output = input;

  filters.forEach(({ rgx, replacer }) => {
    output = output.replace(rgx, replacer);
  });

  return output.trim();
}
