/* tslint:disable */

const { compileParcel } = require('./parcel-build');
const { copyCatapult } = require('./copy-catapult');

module.exports = async () => {
  await Promise.all([ compileParcel({ production: true }), copyCatapult() ]);
}
