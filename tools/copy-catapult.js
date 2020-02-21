const fs = require('fs-extra');
const path = require('path');

module.exports = {
  async copyCatapult() {
    const copyOps = [
      {
        source: path.join(__dirname, '../catapult/netlog_viewer/netlog_viewer'),
        target: path.join(__dirname, '../dist/catapult')
      }, {
        source: path.join(__dirname, '../catapult/third_party/polymer/components/polymer'),
        target: path.join(__dirname, '../dist/catapult/polymer')
      }, {
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
