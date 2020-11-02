/**
 * 从package.json获取版本号，并写入version.ts中
 */
const packageJSON = require('./package.json');
const fs = require('fs');

module.exports = function () {
  fs.writeFileSync('version.js', `export default '${packageJSON.version}';\n`);
};
