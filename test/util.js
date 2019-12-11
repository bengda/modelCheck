const expect = require('chai').expect;

/**
 * @typedef {object} TetstUnit
 * @property {any[]} input - 输入参数
 * @property {any|function} expect - 期望值
 */

/**
 * 测试批量执行函数
 * @param {function} func - 被测试的方法
 * @param {TestUnit[]} tests - 测试单元集合
 */
exports.actuator = function actuator(func, tests) {
  tests.forEach(function (test) {
    if (typeof test.expect === 'function') {
      test.expect.call(this, func, test.input);
    } else {
      const result = func.apply(null, test.input);
      expect(result).to.deep.equal(test.expect);
    }
  });
};
