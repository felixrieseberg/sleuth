const TEAM_ID = ' {Team ID} ';
const teamIdFilter = /( |^)("{0,1}T[A-Z0-9]{8}"{0,1})( |$)/g;
const USER = ' {User} ';
const userFilter = /( |^)("{0,1}U[A-Z0-9]{8}"{0,1})( |$)/g;
const CHANNEL = ' {Channel} ';
const channelFilter = /( |^)("{0,1}(C|D)[A-Z0-9]{8}"{0,1})( |$)/g;
const URL = ' {URL} ';
const urlFilter = /( |^)("{0,1}https:\/\/\w{0,30}\.slack\.com[\S]{0,40}"{0,1})( |$)/g;
const WAS_ACTIVE = '$1{Time}';
const wasActiveFilter = /(was active for )\d{1,12}/g;
const doubleSpace = /  /g;

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

  output = output.replace(teamIdFilter, TEAM_ID);
  output = output.replace(urlFilter, URL);
  output = output.replace(userFilter, USER);
  output = output.replace(channelFilter, CHANNEL);
  output = output.replace(wasActiveFilter, WAS_ACTIVE);
  output = output.replace(doubleSpace, ' ');

  return output.trim();
}
