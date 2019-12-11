/**
 * 断言器
 * @author huyk<bengda@outlook.com>
 * @version 0.0.1
 * @module Asserts
 */
import {
  isArray,
  isObject,
  isLooseObject,
  isStrictObject,
  isPlainObject,
  isEmptyObject,
  isNull,
  isUndefined,
  isNullOrUndefined,
  isNaN,
  isString,
  isNumber,
  isNumeric,
  isInteger,
  isFloatNumber,
  isBoolean,
  isFunction,
  isDate,
  isSymbol,
  isDom,
  isPrimitive,
  isComplex,
} from './types';

import { CONDITION_MARK } from './def';

/**
 * @const
 * @type {map}
 */
export const assertsMap = new Map([
  [isArray, 'Array'],
  [isObject, 'Object'],
  [isLooseObject, 'LooseObject'],
  [isStrictObject, 'StrictObject'],
  [isPlainObject, 'PlainObject'],
  [isEmptyObject, 'EmptyObject'],
  [isNull, 'Null'],
  [isUndefined, 'Undefined'],
  [isNullOrUndefined, 'Null or Undefined'],
  [isNaN, 'NaN'],
  [isString, 'String'],
  [isNumber, 'Number'],
  [isNumeric, 'Numeric-Value'],
  [isInteger, 'Integer Number'],
  [isFloatNumber, 'Float Number'],
  [isBoolean, 'Boolean'],
  [isFunction, 'Function'],
  [isDate, 'Date'],
  [isSymbol, 'Symbol'],
  [isDom, 'Element'],
  [isPrimitive, 'Primitive-Value'],
  [isComplex, 'Complex-Value(object|array|function)'],
]);

/**
 * 验证器工厂函数
 * @param {(any) => boolean} validator
 * @param {string} [type] 数据类型
 * @returns {(arg: any, msg?: string) => boolean}
 */
export function assertFactory(validator, type) {
  return function(arg, msg) {
    if (!validator(arg)) {
      throw new TypeError(msg || `${arg} Expected ${type || assertsMap.get(validator)}`);
    }
    return true;
  }
}

export const assertArray = assertFactory(isArray);

export const assertObject = assertFactory(isObject);

export const assertLooseObject = assertFactory(isLooseObject);

export const assertStrictObject = assertFactory(isStrictObject);

export const assertPlainObject = assertFactory(isPlainObject);

export const assertEmptyObject = assertFactory(isEmptyObject);

export const assertNull = assertFactory(isNull);

export const assertUndefined = assertFactory(isUndefined);

export const assertNullOrUndefined = assertFactory(isNullOrUndefined);

export const assertNaN = assertFactory(isNaN);

export const assertString = assertFactory(isString);

export const assertNumber = assertFactory(isNumber);

export const assertNumeric = assertFactory(isNumeric);

export const assertInteger = assertFactory(isInteger);

export const assertFloatNumber = assertFactory(isFloatNumber);

export const assertBoolean = assertFactory(isBoolean);

export const assertFunction = assertFactory(isFunction);

export const assertDate = assertFactory(isDate);

export const assertSymbol = assertFactory(isSymbol);

export const assertDom = assertFactory(isDom);

export const assertPrimitive = assertFactory(isPrimitive);

export const assertComplex = assertFactory(isComplex);

/**
 * 断言值是否在给定列表里
 * @param {any} arg - input
 * @param {any[]} enums - 枚举列表
 */
export const assertEnum = function assertEnum(arg, enums) {
  assertArray(enums);
  if (!enums.includes(arg)) {
    throw new ReferenceError(`${arg} should in the given list: [${enums}]`);
  }
  return true;
};

/**
 * 组合使用验证器断言
 * @param {any} arg
 * @param {function|function[]} validator - 接收单参数并返回boolean值的验证器
 * @param {symbol} [condition=CONDITION_MARK.or] - [CONDITION_MARK]
 * @param {string} [message] - message
 */
export function composeAssert(arg, validator, { condition = CONDITION_MARK.or, message } = {}) {
  if (!isFunction(validator) && !isArray(validator)) {
    throw new TypeError(`${validator} Expected Function or Function[]`);
  }
  assertEnum(condition, [CONDITION_MARK.and, CONDITION_MARK.or]);

  const validators = isFunction(validator) ? [validator] : validator;
  const handler = CONDITION_MARK.and === condition ? Array.prototype.every : Array.prototype.some;
  const tipMap = {
    [CONDITION_MARK.and]: 'and',
    [CONDITION_MARK.or]: 'or',
  };
  const text = message || `${arg} Expected ${validators.map((item) => assertsMap.get(item)).join(` ${tipMap[condition]} `)}`;
  if (!handler.call(validators, (invoke) => invoke(arg))) {
    throw new TypeError(text);
  }
  return true;
}

/**
 * module export
 * @exports
 */
export default {
  assertsMap,
  assertFactory,
  assertArray,
  assertObject,
  assertLooseObject,
  assertStrictObject,
  assertPlainObject,
  assertEmptyObject,
  assertNull,
  assertUndefined,
  assertNullOrUndefined,
  assertNaN,
  assertString,
  assertNumber,
  assertNumeric,
  assertInteger,
  assertFloatNumber,
  assertBoolean,
  assertFunction,
  assertDate,
  assertSymbol,
  assertDom,
  assertPrimitive,
  assertComplex,
  assertEnum,
  composeAssert,
};
