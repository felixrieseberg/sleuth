const fs = require('fs-extra');
const path = require('path');

module.exports = {
  async copyCatapult() {
    const hasSubmodules = fs.existsSync(path.join(__dirname, '../catapult/netlog_viewer/netlog_viewer'));
    const isCI = process.env.CI;

    if (!hasSubmodules && isCI) {
      throw new Error('Catapult missing');
    } else if (!hasSubmodules) {
      console.warn(`Building WITHOUT catapult!`);
    }

    const gitSubmodules = hasSubmodules ? [
      {
        source: path.join(__dirname, '../catapult/netlog_viewer/netlog_viewer'),
        target: path.join(__dirname, '../dist/catapult')
      }, {
        source: path.join(__dirname, '../catapult/third_party/polymer/components/polymer'),
        target: path.join(__dirname, '../dist/catapult/polymer')
      }
    ] : []

    const copyOps = [
      ...gitSubmodules,
      {
        source: path.join(__dirname, '../static/catapult.html'),
        target: path.join(__dirname, '../dist/static/catapult.html')
      }, {
        source: path.join(__dirname, '../static/catapult-overrides'),
        target: path.join(__dirname, '../dist/catapult')
      }, {
        source: path.join(__dirname, '../static/img'),
        target: path.join(__dirname, '../dist/static/img')
      }
    ]

    for (const op of copyOps) {
      await fs.copy(op.source, op.target);
    }
  }
}
