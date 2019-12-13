/**
 * 一些常用的数据验证
 * 想要更加强大的功能请使用validator.js{@link https://github.com/chriso/validator.js}
 * @author huyk<bengda@outlook.com>
 * @version 0.0.1
 * @module Validators
 */

import {
  isType,
  isNumeric,
  isInteger,
  isNaN,
  isFloatNumber,
  isString,
  isArray,
  isObject,
  isNull,
  isUndefined,
  isDate,
} from './types';

import { CONDITION_MARK } from './def';

/**
 * @see {@link http://www.regular-expressions.info/email.html}
 */
const EMAIL_RE = /^[a-z0-9\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+(?:\.[a-z0-9\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+)*@(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?$/i;
/**
 * @see {@link https://gist.github.com/dperini/729294}
 */
const URL_RE = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i;

const ipv4Maybe = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const ipv6Block = /^[0-9A-F]{1,4}$/i;

/**
 * 是否是ip地址
 * @private
 * @see {@link https://github.com/chriso/validator.js/blob/master/src/lib/isIP.js}
 * @param {string} str - ip
 * @param {string} [version=4|6] - ipv4 or ipv6
 */
function isIP(str, version = '') {
  if (!isString(str)) {
    return false;
  }
  if (!version) {
    return isIP(str, '4') || isIP(str, '6');
  } else if (version === '4') {
    if (!ipv4Maybe.test(str)) {
      return false;
    }
    const parts = str.split('.').sort((a, b) => a - b);
    return parts[3] <= 255;
  } else if (version === '6') {
    const blocks = str.split(':');
    let foundOmissionBlock = false; // marker to indicate ::

    // At least some OS accept the last 32 bits of an IPv6 address
    // (i.e. 2 of the blocks) in IPv4 notation, and RFC 3493 says
    // that '::ffff:a.b.c.d' is valid for IPv4-mapped IPv6 addresses,
    // and '::a.b.c.d' is deprecated, but also valid.
    const foundIPv4TransitionBlock = isIP(blocks[blocks.length - 1], 4);
    const expectedNumberOfBlocks = foundIPv4TransitionBlock ? 7 : 8;

    if (blocks.length > expectedNumberOfBlocks) {
      return false;
    }
    // initial or final ::
    if (str === '::') {
      return true;
    } else if (str.substr(0, 2) === '::') {
      blocks.shift();
      blocks.shift();
      foundOmissionBlock = true;
    } else if (str.substr(str.length - 2) === '::') {
      blocks.pop();
      blocks.pop();
      foundOmissionBlock = true;
    }

    for (let i = 0; i < blocks.length; ++i) {
      // test for a :: which can not be at the string start/end
      // since those cases have been handled above
      if (blocks[i] === '' && i > 0 && i < blocks.length - 1) {
        if (foundOmissionBlock) {
          return false; // multiple :: in address
        }
        foundOmissionBlock = true;
      } else if (foundIPv4TransitionBlock && i === blocks.length - 1) {
        // it has been checked before that the last
        // block is a valid IPv4 address
      } else if (!ipv6Block.test(blocks[i])) {
        return false;
      }
    }
    if (foundOmissionBlock) {
      return blocks.length >= 1;
    }
    return blocks.length === expectedNumberOfBlocks;
  }
  return false;
}

/**
 * @namespace Validators
 * @type {Object}
 */
const Validators = {
  /**
   * is方法接收两个参数，第一个是规则或比较值，第二个是需要检测的值
   * 对于NaN与NaN判定为true
   * @param {RegExp | *} rule - 正则表达式，其他值则使用 === 比较，NaN 等于 NaN
   * @param {string | *} value - 要验证的值
   */
  is(rule, value) {
    return rule === value || (isType(rule) === 'regexp'
      ? isString(value) && rule.test(value)
      : isNaN(rule) && isNaN(value));
  },

  /**
   * 组合使用校验器，只接受单参数校验器
   * @param {*} value -value
   * @param {string|string[]} validators - validators中除了compose,is的其他校验器
   * @param {symbol} [op=CONDITION_MARK.or] - and 或者 or
   */
  compose(value, validators, op = CONDITION_MARK.or) {
    if (!isString(validators) && !isArray(validators) || ![CONDITION_MARK.and, CONDITION_MARK.or].includes(op)) {
      return false;
    }
    let $validators = isString(validators) ? [validators] : validators;
    // 只接受单参数校验器，无法排除rest参数校验器
    const $includes = Object.keys(Validators).filter(item => Validators[item].length === 1);
    const $excludes = ['compose', 'is'];
    $validators = $validators.filter(item => $includes.includes(item) && !$excludes.includes(item));
    const $looper = op === CONDITION_MARK.and ? Array.prototype.every : Array.prototype.some;
    return $looper.call($validators, item => Validators[item](value));
  },

  /**
   * 检测邮箱地址(foo@bar.com)
   * @param {string} value - value
   */
  isEmail(value) {
    return EMAIL_RE.test(value);
  },

  /**
   * 检测url地址(http://foo.com)
   * 包含ip地址
   * @param {string} value - value
   */
  isUrl(value) {
    return URL_RE.test(value);
  },

  /**
   * 是否是ipv4或ipv6地址
   * @param {string} value - value
   */
  isIP(value) {
    return isIP(value);
  },

  /**
   * 是否是ipv4地址
   * @param {string} value - value 
   */
  isIPv4(value) {
    return isIP(value, '4');
  },

  /**
   * 检测ipv6地址
   * @param {string} value - value
   */
  isIPv6(value) {
    return isIP(value, '6');
  },

  /**
   * 是否是数字型数据
   * @param {string | number} value - value
   */
  isNumeric,

  /**
   * 校验整数
   * @param {string | number} value - value
   */
  isInteger,

  /**
   * @alias isInteger
   */
  isInt(value) {
    return Validators.isInteger(value);
  },

  /**
   * 只校验存在小数位的数字，这里非传统意义上的float数据类型
   * @param {string | number} value -value
   */
  isFloat(value) {
    return isFloatNumber(value, false);
  },

  /**
   * 是否是大于0的数字
   * @param {string | number} value - value
   */
  isPositiveNumber(value) {
    return Validators.isNumeric(value) && value > 0;
  },

  /**
   * 是否是等于0的数字
   * @param {string | number} value - value
   */
  isZero(value) {
    return Validators.isNumeric(value) && Number(value) === 0;
  },

  /**
   * @param {*} value - value 
   */
  notNull(value) {
    return !Validators.isNull(value);
  },

  /**
   * @param {*} value - value
   */
  isNull,

  /**
   * @param {*} value - value 
   */
  notUndefined(value) {
    return !Validators.isUndefined(value);
  },

  /**
   * @param {*} value - value 
   */
  isUndefined,

  isNullOrUndefined(value) {
    return Validators.isNull(value) || Validators.isUndefined(value);
  },

  notNullAndUndefined(value) {
    return !Validators.isNull(value) && !Validators.isUndefined(value);
  },

  /**
   * @alias notNullAndUndefined
   */
  exist(value) {
    return Validators.notNullAndUndefined(value);
  },

  /**
   * 判断目标的长度为0。对于数组和字符串，它检查length属性，对于对象，它检查可枚举属性的数量
   * @param {string|array|object} value - value
   */
  notEmpty(value) {
    return !Validators.isEmpty(value);
  },

  /**
   * 判断目标的长度为0。对于数组和字符串，它检查length属性，对于对象，它检查可枚举属性的数量
   * @param {string|array|object} value - value
   */
  isEmpty(value) {
    if (isString(value) || isArray(value)) {
      return !value.length;
    } else if (isObject(value)) {
      return !Object.keys(value).length;
    }
    return false;
  },

  /**
   * 校验是否全是空白字符
   * js中 \s 等同于 [\f\n\r\t\v\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]
   * @param {string} value - value
   */
  isWhiteSpaceCharacters(value) {
    return isString(value) && /^\s*$/.test(value);
  },

  /**
   * 校验字母
   * @param {string} value - value
   */
  isAlpha(value) {
    return /^[A-z]+$/i.test(value);
  },

  /**
   * 包含字母和数字
   * @param {string} value 
   */
  isAlphanumeric(value) {
    return /^[0-9A-z]+$/i.test(value); 
  },

  /**
   * 只校验大陆手机号，并不一定完全正确，鬼知道运营商以后会开通什么号码段
   * @see {@link https://github.com/chriso/validator.js/blob/master/src/lib/isMobilePhone.js}
   * @param {string} value - phone number
   */
  isMobilePhone(value) {
    return isString(value) && /^((\+|00)86)?1([358][0-9]|4[579]|6[67]|7[0135678]|9[189])[0-9]{8}$/.test(value);
  },

  /**
   * 是否是日期格式
   * 只校验YYYY-MM-DD 或者YYYY/MM/DD
   * @param {string} value
   */
  isDate(value) {
    return isString(value)
    && /^\d{4}-\d{2}-\d{2}$|^\d{4}\/\d{2}\/\d{2}$/.test(value);
  },

  /**
   * 是否是日期时间格式
   * 只校验YYYY-MM-DD HH:mm:ss 或者YYYY/MM/DD HH:mm:ss
   * @param {string} value
   */
  isDateTime(value) {
    return isString(value)
    && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$|^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(value);
  },

  /**
   * 日期宽松判断
   * 包含isDate,isDateTime和Date对象(排除null)
   * @param {string|Date} value
   */
  isLooseDate(value) {
    return isDate(value)
      || Validators.isDate(value)
      || Validators.isDateTime(value)
      || (isString(value) && `${new Date(value)}` !== 'Invalid Date');
  },

  /**
   * 是否是真值
   * @param {*} value 
   */
  isTruthValue(value) {
    return !!value;
  },

  /**
   * 是否是假值
   * @param {*} value 
   */
  isFalseValue(value) {
    return !value;
  },

};

/**
 * module export
 */
export default Validators;
