/**
 * 数据类型判断
 * @author huyk<bengda@outlook.com>
 * @version 0.0.1
 * @module Types
 */

 /**
  * 获取数据类型
  * @param {any} arg
  */
export function isType(arg) {
  return Object.prototype.toString.call(arg).slice(8, -1).toLowerCase();
}

/**
 * 判断是否是数组
 * @param {any} arg
 */
export function isArray(arg) {
  return isType(arg) === 'array';
}

/**
 * 判断是否是null数据类型
 * @param {any} arg
 */
export function isNull(arg) {
  return isType(arg) === 'null';
}

/**
 * 对象宽松的判断。 不包括null和数组，但是包括HTMLElement，Date等等其他对象
 * @param {any} arg
 */
export function isLooseObject(arg) {
  return typeof arg === 'object' && !isNull(arg) && !isArray(arg);
}

/**
 * 是否是对象，同isLooseObject
 * 很多时候我们只是使用对象这种类型来方便存储数据而已，这里我们在喜好上采用宽松判断
 * @param {any} arg
 */
export function isObject(arg) {
  // return Object.prototype.toString.call(arg) === '[object Object]';
  return isLooseObject(arg);
}

/**
 * 严格的对象判断
 * @param {any} arg
 */
export function isStrictObject(arg) {
  return isType(arg) === 'object';
}

export function isString(arg) {
  return isType(arg) === 'string';
}

export function isNumber(arg) {
  return isType(arg) === 'number';
}

export function isBoolean(arg) {
  return isType(arg) === 'boolean';
}

export function isFunction(arg) {
  return isType(arg) === 'function';
}

export function isDate(arg) {
  return isType(arg) === 'date';
}

export function isNaN(arg) {
  return isNumber(arg) && arg !== arg;
}

export function isUndefined(arg) {
  return isType(arg) === 'undefined';
}

export function isNullOrUndefined(arg) {
  return isNull(arg) || isUndefined(arg);
}

export function isSymbol(arg) {
  return isType(arg) === 'symbol';
}

/**
 * 是否是原始值类型
 * null,undefined,number,string,boolean,symbol
 * @param {any} arg
 */
export function isPrimitive(arg) {
  return isNullOrUndefined(arg)
    || isNumber(arg)
    || isString(arg)
    || isBoolean(arg)
    || isSymbol(arg);
}

/**
 * 是否是复杂数据类型
 * object,array,function
 * @param {any} arg
 */
export function isComplex(arg) {
  return isLooseObject(arg)
    || isArray(arg)
    || isFunction(arg);
}

/**
 * 是否是Dom元素
 * window和document也判定为dom类型，因为它们可以做添加监听事件等其它行为
 * @param {any} arg
 */
export function isDom(arg) {
  return arg === window || arg === document || arg instanceof HTMLElement;
}

/**
 * 是否继承自Object.prototype
 * @param {any} arg
 * @example
 *  var a = { a: 'a' } // true
 *  var b = Object.create(null) // false
 *  function Apple() {}
 *  var apple = new Apple(); // false
 */
export function isPlainObject(arg) {
  return isObject(arg) && Object.getPrototypeOf(arg) === Object.prototype;
}

/**
 * 无可遍历属性视为空对象
 * @param {any} arg
 */
export function isEmptyObject(arg) {
  return isObject(arg) && !Object.keys(arg).length;
}

/**
 * 是否是数字型数据。包含string类型
 * 注意诸如[1], ['1']等会隐式转为字符1,'1'
 * @param {any} arg
 */
export function isNumeric(arg) {
  return !isArray(arg) && /^[+-]?[0-9]\d*$|^[+-]?[0-9]\d*\.\d+$/g.test(arg);
}

/**
* 是否是整数。包含string类型
*/
export function isInteger(arg) {
  return isNumeric(arg) && Math.floor(arg) === Number(arg);
}

/**
* 是否是浮点数。包含string类型
* 基本行为与isNumeric一致
* @param {any} arg
* @param {boolean} [containInteger=false] - 是否包含整数。containInteger为false则当输入是整数时返回false
*/
export function isFloatNumber(arg, containInteger = false) {
  return isNumeric(arg) && (containInteger || /^[+-]?[0-9]\d*\.\d+$/g.test(arg));
}

/**
 * module export
 * @exports
 */
export default {
  isType,
  isArray,
  isNull,
  isLooseObject,
  isObject,
  isStrictObject,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isDate,
  isNaN,
  isUndefined,
  isNullOrUndefined,
  isSymbol,
  isPrimitive,
  isComplex,
  isDom,
  isPlainObject,
  isEmptyObject,
  isNumeric,
  isInteger,
  isFloatNumber,
};
