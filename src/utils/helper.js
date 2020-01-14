/**
 * 一些工具方法
 * @author huyk<bengda@outlook.com>
 * @version 0.0.2
 * @module Helper
 */
import {
  isObject,
  isString,
  isNumber,
  isArray,
  isFunction,
  isNull,
  isStrictObject,
  isUndefined,
  isComplex,
} from './types';

import {
  composeAssert,
  assertComplex,
  assertString,
  assertFunction,
  assertArray,
  assertEnum,
  assertObject,
  assertNumber,
  assertInteger,
  assertNumeric,
  assertBoolean,
} from './asserts';

import {
  MERGE_STRATEGY,
  QUERY_MODE,
  CONDITION_MARK,
  KEYS_RANGE,
} from './def';

/**
 * @typedef {object|array|function} complexValue
 */

/**
 * @typedef {string|number|symbol} propertyKey
 */

// d.ts: type complexValue = object | array | function;
// d.ts: type propertyKey = string | number | symbol;

/**
 * split url to hashUrl and queryUrl
 * NOTE 目前对于foo.com/?a=a&b=/#/view这种形式的地址，忽略 # 两边的 /，这个判定定义为 HASH_SPLIT_REG
 * 更加合法的写法应该是 foo.com?a=a&b=#/view，左边的 / 是不允许存在的
 */
const HASH_SPLIT_REG = /\/?#\/?/;

/**
 * get query name-value strings
 */
const QUERY_REG = /(?:\?(.+))/;

// tips
const TIP_HAS_CIRCULAR_STRUCTURE = 'has circular structure';

/**
 * 创建一个对象
 * @param {object} [prototype=null]
 * @param {object} descriptors
 */
export function objectCreate(prototype = null, descriptors) {
  return Object.create(prototype, descriptors);
}

/**
 * 获取对象原型
 * @returns {object|null}
 */
export function getPrototype(o) {
  return Reflect.getPrototypeOf(o);
}

/**
 * 设置对象原型
 */
export function setPrototype(o, proto) {
  return Reflect.setPrototypeOf(o, proto);
}

/**
 * 对象是否有非继承属性
 * @param {object} obj
 * @param {propertyKey} prop
 * @returns {boolean}
*/
export function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 * 获取对象键名工厂函数
 */
function _getKeysFactory(getKeysNativeFunc) {
  return function getKeysFactory(obj, { containProto = false } = {}) {
    try {
      assertComplex(obj);
    } catch (error) {
      return [];
    }
    const props = [];
    [].push.apply(props, getKeysNativeFunc(obj));
    if (containProto) {
      const proto = getPrototype(obj);
      if (proto) {
        // NOTE 将__proto__属性也包含进去，虽然这不是一个标准属性
        // 只遍历一级原型
        [].push.apply(props, ['__proto__', ...getKeysFactory(proto, { containProto: false })]);
      }
    }
    return props;
  };
}

/**
 * 获取对象的key名
 * 不包含不可枚举属性
 * 不包含symbol
 * 注意此方法不会去查找原型的原型，也就是最多只查找原型链上的第一级
 * @param {complexValue} obj
 * @param {boolean} [containProto=false] - 包含原型上的property，如果包含原型，可能会得到同名property
 * @return {array}
 */
export const getPropertyKeys = _getKeysFactory(Object.keys);

/**
 * 获取对象的key名，包含不可枚举属性，不包含symbol
 * 注意此方法不会去查找原型的原型，也就是最多只查找原型链上的第一级
 * @param {complexValue} obj
 * @param {boolean} [containProto=false] - 包含原型上的property，如果包含原型，可能会得到同名property
 * @return {array}
 */
export const getPropertyNames = _getKeysFactory(Object.getOwnPropertyNames);

/**
 * 获取对象的symbol键名
 * 不包含不可枚举属性
 * 注意此方法不会去查找原型的原型，也就是最多只查找原型链上的第一级
 * @param {complexValue} obj
 * @param {boolean} [containProto=false] - 包含原型上的property，如果包含原型，可能会得到同名property
 * @return {array}
 */
export const getSymbolKeys = _getKeysFactory((obj) => {
  const alls = Object.getOwnPropertySymbols(obj);
  return alls.filter((k) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(obj, k);
    return descriptor.enumerable;
  });
});

/**
 * 获取对象的symbol键名
 * 包含不可枚举属性
 * 注意此方法不会去查找原型的原型，也就是最多只查找原型链上的第一级
 * @param {complexValue} obj
 * @param {boolean} [containProto=false] - 包含原型上的property，如果包含原型，可能会得到同名property
 * @return {array}
 */
export const getSymbolNames = _getKeysFactory(Object.getOwnPropertySymbols);

/**
 * 获取所有键名
 * 包含symbol
 * 不包含不可枚举属性
 * 注意此方法不会去查找原型的原型，也就是最多只查找原型链上的第一级
 * @param {complexValue} obj
 * @param {boolean} [containProto=false] - 如果包含原型，可能会得到同名property
 * @returns {array}
*/
export const getAllKeys = _getKeysFactory((obj) => {
  const alls = Reflect.ownKeys(obj);
  return alls.filter((k) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(obj, k);
    return descriptor.enumerable;
  });
});

/**
 * 获取所有键名
 * 包含symbol
 * 包含不可枚举属性
 * 注意此方法不会去查找原型的原型，也就是最多只查找原型链上的第一级
 * 如果查找原型则返回会自动添加一个__proto__值
 * @param {complexValue} obj
 * @param {boolean} [containProto=false] - 如果包含原型，可能会得到同名property
 * @returns {array}
*/
export const getAllNames = _getKeysFactory(Reflect.ownKeys);

/**
 * 映射遍历键的方法
 * @type {map}
 */
export const KEYS_RANGE_HOOKS = new Map([
  [KEYS_RANGE.keys, getPropertyKeys],
  [KEYS_RANGE.names, getPropertyNames],
  [KEYS_RANGE.symbolKeys, getSymbolKeys],
  [KEYS_RANGE.symbols, getSymbolNames],
  [KEYS_RANGE.enumerable, getAllKeys],
  [KEYS_RANGE.all, getAllNames],
]);

/**
 * 是否在对象内部引用了自身
 * @param {complexValue} arg
 * @param {complexValue} root - 某些时候需要指定顶级入口；如 o = { s: { s1: o } };_isReferencedInsideSelf(o.s.s1, o)
 * @param {set} [stack=new Set()] - 暂存池
 * @param {complexValue} rawArg - arg本身
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
 * @param {boolean} [containProto=false] - 是否包含原型
 */
function _isReferencedInsideSelf(arg, {
  root = null,
  keysRange = KEYS_RANGE.enumerable,
  stack = new Set(),
  containProto = false,
  rawArg,
} = {}) {
  if (rawArg === arg) {
    return true;
  }
  if (stack.has(arg) && rawArg !== arg) {
    return false;
  }
  stack.add(arg);

  const optsSelf = { root, stack, rawArg: rawArg || arg, containProto: false };
  // 这里获取键名传了false是为了避免同名键名，所以后面需要再遍历一次
  const properties = KEYS_RANGE_HOOKS.get(keysRange)(arg, { containProto: false });
  const flag = properties.some((prop) => {
    /**
     * 例如
     * o = { s1: { s2: { s3: o } } }
     * 如果不传root，那么o.s1，o.s1.s2都是循环引用的，这显然不符合预期
     */
    if (root && root === arg[prop]) {
      return false;
    }
    if (isComplex(arg[prop])) {
      return _isReferencedInsideSelf(arg[prop], optsSelf);
    }
    return false;
  });
  const proto = getPrototype(arg);
  if (containProto) {
    // 去遍历一级原型对象
    return flag || _isReferencedInsideSelf(proto, optsSelf);
  }
  return flag;
}

/**
 * 是否在对象内部引用了自身
 * @param {complexValue} arg
 * @param {complexValue} root - 某些时候需要指定顶级入口；如 o = { s: { s1: o } };_isReferencedInsideSelf(o.s.s1, o)
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式。enumerable：只遍历可枚举属性，symbol：只遍历symbol属性，enumerable+symbol：enumerable和symbol属性集合，all：所有属性
 * @param {boolean} [containProto=false] - 是否包含原型
 */
export function isReferencedInsideSelf(arg, { root, keysRange = KEYS_RANGE.enumerable, containProto = false } = {}) {
  assertComplex(arg);
  composeAssert(root, [isComplex, isNull, isUndefined]);
  return _isReferencedInsideSelf(arg, {
    root: arg === root ? undefined : root,
    keysRange,
    containProto,
  });
}

/**
 * 是否有循环引用结构
 * @param {complexValue} arg
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
 * @param {boolean} [containProto=false] - 是否检查原型，只包含arg的一级原型对象
*/
export function hasCircularStructure(arg, { keysRange = KEYS_RANGE.enumerable, containProto = false } = {}) {
  assertComplex(arg);

  const optsSelf = { keysRange, containProto: false };
  // 这里获取键名传了false是为了避免同名键名，所以后面需要再遍历一次
  const keys = KEYS_RANGE_HOOKS.get(keysRange)(arg, { containProto: false });

  const flag = isReferencedInsideSelf(arg, optsSelf) || keys.some((k) => {
    const v = arg[k];
    // NOTE fn.prototype.constructor === fn
    if (isFunction(arg) && k === 'prototype' && isObject(v) && v.constructor === arg) {
      return false;
    }
    if (isComplex(v)) {
      return hasCircularStructure(v, optsSelf);
    }
    return false;
  });
  const proto = getPrototype(arg);
  if (containProto && proto) {
    // 去遍历一级原型对象
    return flag || hasCircularStructure(proto, optsSelf);
  }
  return flag;
}

/**
 * 获取循环引用结构
 * @param {complexValue} arg
 * @param {complexValue} rawArg
 * @param {string[]} [key] - 循环结构的key名
 * @param {[][]} [result] - 结果，[[[k], v]]
 * @param {boolean} [containProto=false] - 是否包含原型
 * @param {boolean} [checkReferContainProto=false] - 使用isReferencedInsideSelf判断时是否包含原型
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
 * @returns {string[]any[]}
 * @private
*/
function _getCircularStructure(arg, {
  rawArg,
  key,
  result = [],
  containProto = false,
  checkReferContainProto = false,
  keysRange = KEYS_RANGE.enumerable,
}) {
  const optsInside = { root: rawArg || arg, keysRange, containProto: checkReferContainProto };
  const optsSelf = { rawArg: rawArg || arg, result, containProto: false, checkReferContainProto, keysRange };

  if (isReferencedInsideSelf(arg, optsInside)) {
    result.push([key || [], arg]);
  }

  // 这里获取键名传了false是为了避免同名键名，所以后面需要再遍历一次
  const properties = KEYS_RANGE_HOOKS.get(keysRange)(arg, { containProto: false });
  properties.forEach((prop) => {
    if (isComplex(arg[prop])) {
      const keyPath = (key || []).concat(prop);
      if (isReferencedInsideSelf(arg[prop], optsInside)) {
        result.push([keyPath, arg[prop]]);
      } else {
        _getCircularStructure(arg[prop], { ...optsSelf, key: keyPath });
      }
    }
  });
  const proto = getPrototype(arg);
  if (containProto && proto) {
    // 去遍历一级原型对象
    return _getCircularStructure(proto, { ...optsSelf, key: ['__proto__'] });
  }
  return result;
}

/**
 * 获取循环引用结构
 * @param {complexValue} arg
 * @param {complexValue} root - 根节点对象
 * @param {boolean} [containProto=false] - 是否包含原型
 * @param {boolean} [checkReferContainProto=false] - 使用isReferencedInsideSelf判断时是否包含原型
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
 */
export function getCircularStructure(arg, { root, containProto = false, checkReferContainProto = false, keysRange = KEYS_RANGE.enumerable } = {}) {
  assertComplex(arg);

  return _getCircularStructure(arg, {
    rawArg: root,
    key: undefined,
    result: [],
    containProto,
    checkReferContainProto,
    keysRange,
  });
}

/**
 * 首字母大写, 其它的小写
 * @param {string} word
 */
export function capitalize(word) {
  assertString(word);
  return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
}

/**
 * 第一个字母大写
 * @param {string} word
 */
 export function capitalizeFirstLetter(word) {
  assertString(word);
  return word.replace(/([a-zA-Z])/, letter => letter.toUpperCase());
}

/**
 * 获取函数名称
 * @param {function} fn
 * @return {string}
 * @example
 * var result = getFunctionName(Object) // 'Object'
 * function A() {}
 * result = getFunctionName(A) // 'A'
 */
export function getFunctionName(fn) {
  assertFunction(fn);
  return fn.name || fn.toString().match(/^function\s*?(\w+)\(/) || 'anonymous';
}

/**
 * 驼峰式命名
 * 将aa-bb-xx 转为aaBbXx
 * @param {string} str
 */
export function camelCase(str) {
  assertString(str);
  return str.replace(/([:\-_]+(.))/g, (_, separator, letter, offset) => (offset ? letter.toUpperCase() : letter));
}

/**
 * 帕斯卡命名
 * 将aa-bb-xx转为AaBbXx
 * @param {string} str - input
*/
export function pascalCase(str) {
  assertString(str);
  return capitalizeFirstLetter(camelCase(str));
}

/**
 * 短折线命名
 * 将aaBbXx 转为 aa-bb-xx
 * @param {boolean} trimHeadKebab - AaBbXx => -aa-bb-xx;trimHeadKebab=true则舍弃首部-字符
*/
export function kebabCase(str, trimHeadKebab = false) {
  assertString(str);
  const res = str.replace(/([A-Z])/g, letter => (`-${letter.toLowerCase()}`));
  return trimHeadKebab ? res.replace(/^-/, '') : res;
}

/**
 * 合并两个复杂数据类型
 * @param {complexValue} target
 * @param {complexValue} source
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
 * @param {symbol} [mergeStrategy=MERGE_STRATEGY.shadow] - 合并策略
 */
function _merge(target, source, { keysRange = KEYS_RANGE.enumerable, mergeStrategy = MERGE_STRATEGY.shadow }) {
  assertComplex(target);
  assertComplex(source);

  const opts = { keysRange, mergeStrategy };
  const sourceKeys = KEYS_RANGE_HOOKS.get(keysRange)(source, { containProto: false });

  sourceKeys.forEach((prop) => {
    const descriptors = Reflect.getOwnPropertyDescriptor(source, prop);
    switch (mergeStrategy) {
      case MERGE_STRATEGY.shadow:
        // 只合并一级属性，行为类似Object.assign
        // NOTE 这里采用定义属性而不是set操作
        Reflect.defineProperty(target, prop, descriptors);
        break;
      case MERGE_STRATEGY.deep:
        if (isComplex(target[prop]) && isComplex(source[prop])) {
          _merge(target[prop], source[prop], opts);
        } else {
          Reflect.defineProperty(target, prop, descriptors);
        }
        break;
      default:
        break;
    }
  });
  return target;
}

/**
 * 合并多个复杂类型数据
 * NOTE 这相当于浅拷贝，而且会影响第一个复杂类型数据。使用时建议第一个数据传空对象{}或空数组[]
 * @param {complexValue[]} toMergeArr - 复杂数据类型集合
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
 * @param {symbol} [mergeStrategy=MERGE_STRATEGY.shadow] - 合并策略
 * @param {complextValue|null}
 */
export function merge(toMergeArr, { keysRange = KEYS_RANGE.enumerable, mergeStrategy = MERGE_STRATEGY.shadow } = {}) {
  assertArray(toMergeArr);

  const opts = { keysRange, mergeStrategy };
  const result = toMergeArr.reduce((acc, cur) => {
    if (isComplex(acc) && isComplex(cur)) {
      return _merge(acc, cur, opts);
    }
    if (isComplex(acc)) {
      return acc;
    }
    return cur;
  });
  return isComplex(result) ? result : null;
}

/**
 * 数组填充默认数据
 * @param {array} arr - 要填充的数组
 * @param {any} fill - 填充值。如果是一个工厂函数则使用返回值
 * @returns {array}
 */
export function arrayFill(arr, fill) {
  assertArray(arr);
  for (let i = 0; i < arr.length; i += 1) {
    arr[i] = isFunction(fill) ? fill(i) : fill;
  }
  return arr;
}

/**
 * 数组去重
 * 利用ES6的Set去重。引用地址相同的对象视为重复对象
 * @param {array} arr
 * @param {propertyKey} [key] - 如果数组的项是对象，key作为每一项的唯一标记
 * @returns {array} - 返回一个新数组
*/
export function arrayUnique(arr, key) {
  assertArray(arr);
  if (key) {
    const hash = [];
    const keys = [];
    arr.forEach((item) => {
      if (!keys.includes(item[key])) {
        keys.push(item[key]);
        hash.push(item);
      }
    });
    return hash;
  }
  return [...new Set(arr)];
}

/**
 * 对数组做并集
 * arr2的数据合并到arr1
 * NOTE 数据合并行为会对原始arr1造成影响
 * @param {array} arr1
 * @param {array} arr2
 * @param {propertyKey} [key] - 如果数组的项是对象，key作为每一项的唯一标记
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
 * @param {symbol} [mergeStrategy=MERGE_STRATEGY.shadow] - [MERGE_STRATEGY] 合并策略
 * @returns {array}
*/
export function arrayUnion(arr1, arr2, { key, keysRange = KEYS_RANGE.enumerable, mergeStrategy = MERGE_STRATEGY.shadow } = {}) {
  assertArray(arr1);
  assertArray(arr2);

  const hasKey = !!key;
  arr2.forEach((item) => {
    const keyValue = hasKey ? item[key] : item;
    const tarIdx = arr1.findIndex((p) => (keyValue === (hasKey ? p[key] : p)));
    if (tarIdx > -1) {
      const tar = arr1[tarIdx];
      // 合并数据
      if (isComplex(item) && isComplex(tar)) {
        merge([tar, item], { keysRange, mergeStrategy });
      } else {
        arr1[tarIdx] = item;
      }
    } else {
      // 新元素
      arr1.push(item);
    }
  });
  return arr1;
}

/**
 * 对数组做差集
 * arr1 - arr2
 * @param {array} arr1
 * @param {array} arr2
 * @param {propertyKey} [key] - 如果数组的项是对象，key作为每一项的唯一标记
 * @returns {array} - 返回一个新的数组
*/
export function arrayDiffer(arr1, arr2, { key } = {}) {
  assertArray(arr1);
  assertArray(arr2);

  const hasKey = !!key;
  const arr1Keys = arr1.map(item => (key ? item[key] : item));
  const arr2Keys = arr2.map(item => (key ? item[key] : item));

  return arr1.concat(arr2).filter((v) => arr1Keys.includes((hasKey ? v[key] : v))
    && !arr2Keys.includes((hasKey ? v[key] : v)));
}

/**
 * 对数组做交集
 * NOTE 会对原始arr1数据造成影响
 * @param {array} arr1
 * @param {array} arr2
 * @param {propertyKey} [key] - 如果数组的项是对象，key作为每一项的唯一标记
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
 * @param {symbol} [mergeStrategy=MERGE_STRATEGY.shadow] - [MERGE_STRATEGY] 合并策略
 * @returns {array} - 返回一个新的数组
*/
export function arrayInter(arr1, arr2, { key, keysRange = KEYS_RANGE.enumerable, mergeStrategy = MERGE_STRATEGY.shadow } = {}) {
  assertArray(arr1);
  assertArray(arr2);

  const opts = { key, keysRange, mergeStrategy };
  const hasKey = !!key;
  const arr1Keys = arr1.map(item => (key ? item[key] : item));
  const arr2Keys = arr2.map(item => (key ? item[key] : item));
  return arrayUnion(arr1, arr2, opts).filter(v => arr1Keys.includes((hasKey ? v[key] : v))
    && arr2Keys.includes((hasKey ? v[key] : v)));
}

/**
 * 获取目标属性节点引用
 * @param {complexValue} root - 目标对象
 * @param {string|propertyKey[]} scheme - 属性路径。建议使用数组形式，描述最精确。
 * @param {boolean} [containProto=false] - 是否包含一级原型对象，不包含子级属性的原型
 * @param {symbol} [keysRange = KEYS_RANGE.enumerable] - 遍历键范围
 * @returns {{result: complexValue|null, key: any}}
*/
function _getNamespaceReference(root, scheme, { containProto = false, keysRange = KEYS_RANGE.enumerable } = {}) {
  assertComplex(root);
  composeAssert(scheme, [isString, isArray]);

  const opts = { containProto: false, keysRange };
  const props = isArray(scheme) ? scheme : scheme.split('.');
  const checkNativeKey = isString(scheme);
  const refer = { result: null, key: null };
  let tar = root;

  props.some((key, index) => {
    const properties = KEYS_RANGE_HOOKS.get(keysRange)(tar, { containProto: false });
    if (checkNativeKey) {
      // 对诸如 a.b.c 属性名进行支持
      const nativeKey = props.slice(index).join('.');
      if (properties.includes(nativeKey)) {
        refer.result = tar;
        refer.key = nativeKey;
        return true;
      }
    }
    if (properties.includes(key)) {
      if (index === props.length - 1) {
        refer.result = tar;
        refer.key = key;
        return true;
      }
      tar = tar[key];
      // 中断遍历
      if (!isComplex(tar)) {
        refer.result = null;
        refer.key = key;
        return true;
      }
    } else {
      refer.result = null;
      refer.key = key;
      return true;
    }
    return false;
  });

  const proto = getPrototype(root);
  if (containProto && proto && !refer.result) {
    return _getNamespaceReference(proto, scheme, opts);
  }
  return refer;
}

/**
 * 获取目标属性节点引用，属性路径不存在则返回null
 * @param {complexValue} root - 目标对象
 * @param {string|propertyKey[]} scheme - 属性路径。建议使用数组形式，描述最精确。
 * 如果使用字符串如: a.b.c，那么有可能表示的是a.b.c这个属性，或a下的b.c属性或a下的b属性下的c字段，或a.b下的c字段。
 * 使用数组我们可以将上述情况精确表示出来，['a.b.c'], ['a', 'b.c'], ['a', 'b', 'c'], ['a.b', 'c']
 * @param {boolean} [containProto=false] - 是否包含一级原型对象，不包含子级属性的原型
 * @param {symbol} [keysRange = KEYS_RANGE.enumerable] - 遍历键范围
 * @returns {complexValue|null}
 * @example
 * var o = { a: { b: 'b' }, 'b.c': 'hhhh', b: { 'c.d': 'sss' } }
 * getNamespaceReference(o, 'a') // 返回 o
 * getNamespaceReference(o, 'c') // 返回 null
 * getNamespaceReference(o, 'a.b') // 返回 o.a
 * getNamespaceReference(o, 'a.c') // 返回 null
 * getNamespaceReference(o, 'b.c') // 返回 o
 * getNamespaceReference(o, 'b.c.d') // 返回 o.b
 * getNamespaceReference(o, ['b', 'c.d']); // 返回o.b
*/
export function getNamespaceReference(root, scheme, { containProto = false, keysRange = KEYS_RANGE.enumerable } = {}) {
  const tar = _getNamespaceReference(root, scheme, { containProto, keysRange });
  return tar.result;
}

/**
 * 某个复杂数据类型是否存在某个指定命名空间（属性路径）
 * @param {complexValue} root - 目标对象
 * @param {string|propertyKey[]} scheme - 属性路径。建议使用数组形式，描述最精确。
 * 如果使用字符串如: a.b.c，那么有可能表示的是a.b.c这个属性，或a下的b.c属性或a下的b属性下的c字段。
 * 使用数组我们可以将上述情况精确表示出来，['a.b.c'], ['a', 'b.c'], ['a', 'b', 'c']
 * @param {boolean} [containProto=false] - 是否包含一级原型对象，不包含子级属性的原型
 * @param {symbol} [keysRange = KEYS_RANGE.enumerable] - 遍历键范围
 * @returns {boolean}
 * @example
 * var o = { a: { b: 'b' }, 'b.c': 'hhhh', b: { 'c.d': 'sss' } }
 * hasNamespace(o, 'a') // true
 * hasNamespace(o, 'c') // false
 * hasNamespace(o, 'a.b') // true
 * hasNamespace(o, 'a.c') // false
 * hasNamespace(o, 'b.c') // true
 * hasNamespace(o, 'b.c.d') // true
 * hasNamespace(o, ['b', 'c.d']); // true
*/
export function hasNamespace(root, scheme, { containProto = false, keysRange = KEYS_RANGE.enumerable } = {}) {
  return !!getNamespaceReference(root, scheme, { containProto, keysRange });
}

/**
 * 获取某个指定命名空间（属性路径）的值，属性路径不存在则返回undefined
 * @param {complexValue} root - 目标对象
 * @param {string|propertyKey[]} scheme - 属性路径。建议使用数组形式，描述最精确。
 * 如果使用字符串如: a.b.c，那么有可能表示的是a.b.c这个属性，或a下的b.c属性或a下的b属性下的c字段。
 * 使用数组我们可以将上述情况精确表示出来，['a.b.c'], ['a', 'b.c'], ['a', 'b', 'c']
 * @param {boolean} [containProto=false] - 是否包含一级原型对象，不包含子级属性的原型
 * @param {symbol} [keysRange = KEYS_RANGE.enumerable] - 遍历键范围
 * @returns {any|undefined}
 * @example
 * var o = { a: { b: 'b' }, 'b.c': 'hhhh', b: { 'c.d': 'sss' } }
 * namespace(o, 'a') // { b: 'b' }
 * namespace(o, 'c') // undefined
 * namespace(o, 'a.b') // 'b'
 * namespace(o, 'a.c') // undefined
 * namespace(o, 'b.c') // 'hhhh'
 * namespace(o, 'b.c.d') // 'sss'
 * namespace(o, ['b', 'c.d']); // 'sss'
*/
export function namespace(root, scheme, { containProto = false, keysRange = KEYS_RANGE.enumerable } = {}) {
  const refer = _getNamespaceReference(root, scheme, { containProto, keysRange });
  return !!refer.result ? refer.result[refer.key] : undefined;
}

/**
 * 对某个指定命名空间（属性路径）进行赋值，属性路径不存在则抛出ReferenceError
 * 使用前最好判断路径是否存在
 * @param {complexValue} root - 目标对象
 * @param {string|propertyKey[]} scheme - 属性路径。建议使用数组形式，描述最精确。
 * 如果使用字符串如: a.b.c，那么有可能表示的是a.b.c这个属性，或a下的b.c属性或a下的b属性下的c字段。
 * 使用数组我们可以将上述情况精确表示出来，['a.b.c'], ['a', 'b.c'], ['a', 'b', 'c']
 * @param {any} value - 要设置的值
 * @param {boolean} [containProto=false] - 是否包含一级原型对象，不包含子级属性的原型
 * @param {symbol} [keysRange = KEYS_RANGE.enumerable] - 遍历键范围
 * @returns {boolean}
 * @example
 * var o = { a: { b: 'b' }, 'b.c': 'hhhh', b: { 'c.d': 'sss' } }
 * setNamespaceValue(o, 'a', { b: 'b', b1: 'b1' }) // { a: { b: 'b', b1: 'b1' }, 'b.c': 'hhhh', b: { 'c.d': 'sss' } }
 * setNamespaceValue(o, 'c') // ReferenceError
 * setNamespaceValue(o, 'a.b', 'B') // { a: { b: 'B', b1: 'b1' }, 'b.c': 'hhhh', b: { 'c.d': 'sss' } }
 * setNamespaceValue(o, 'a.c') // ReferenceError
 * setNamespaceValue(o, 'b.c', 'hello word!') // { a: { b: 'B', b1: 'b1' }, 'b.c': 'hello word!', b: { 'c.d': 'sss' } }
 * setNamespaceValue(o, 'b.c.d', 'this is the way') // { a: { b: 'B', b1: 'b1' }, 'b.c': 'hello word!', b: { 'c.d': 'this is the way' } }
 * setNamespaceValue(o, ['b', 'c.d']); // { a: { b: 'B', b1: 'b1' }, 'b.c': 'hello word!', b: { 'c.d': 'i have spoken' } }
*/
export function setNamespaceValue(root, scheme, value, { containProto = false, keysRange = KEYS_RANGE.enumerable } = {}) {
  const refer = _getNamespaceReference(root, scheme, { containProto, keysRange });
  if (!refer.result) {
    throw new ReferenceError(`you can not set value on a not exist namespace ${scheme}`);
  }
  return Reflect.set(refer.result, refer.key, value);
}

/**
 * 创建一个形如 { a : { a1: '' } } 对象
 * 属性名建议使用数组来描述
 * @param {[][]} descriptors - 每项都是一个数组，arr[0]表示key名，arr[1]表示key值
 * @example
 * descriptors = [ ['a', 'aaaa'], ['b.c', 'sssss'] ] // 请不要使用让人困惑的属性描述。例如 b..c 或 .b.c等
 * createNestedObject(descriptors) // 输出 { a: 'aaaa', b: { c: 'sssss' } }
*/
export function createNestedObject(descriptors) {
  assertArray(descriptors);

  const hoster = {};
  descriptors.forEach(([k, v]) => {
    const keys = isArray(k) ? k : k.split('.');
    if (keys.length > 1) {
      keys.reduce((o, k1, idx1) => {
        o[k1] = (isObject(o[k1]) || isArray(o[k1])) ? o[k1] : {};
        o[k1] = idx1 === keys.length - 1 ? v : o[k1];
        return o[k1];
      }, hoster);
    } else {
      hoster[keys[0]] = v;
    }
  });
  return hoster;
}

/**
 * 保留指定的键值
 * 属性名建议使用数组来描述
 * @param {object|array} data
 * @param {propertyKey[]} properties - 键名。如['a', 'b', 'c.d']
 */
export function reserveProperties(data, properties) {
  composeAssert(data, [isArray, isObject]);

  const result = isObject(data) ? {} : [];

  properties.forEach((prop) => {
    const keys = isArray(prop) ? prop : prop.split('.');
    keys.reduce((acc, k1, idx1) => {
      if (isObject(acc.new) || isArray(acc.new) && (isObject(acc.raw) || isArray(acc.raw))) {
        if (idx1 === keys.length - 1) {
          acc.new[k1] = acc.raw[k1];
        } else {
          const temp = acc.raw[k1];

          if (isArray(temp)) {
            acc.new[k1] = acc.new[k1] || [];
          } else if (isObject(temp)) {
            acc.new[k1] = acc.new[k1] || {};
          } else {
            acc.new[k1] = acc.raw[k1];
          }
        }
        return { new: acc.new[k1], raw: acc.raw[k1] };
      }
      return { new: null, raw: null };
    }, { new: result, raw: data });
  });
  return result;
}

/**
 * 变换对象的key名。key值支持namespace形式，如果目标key不可配置则无法替换
 * @param {complexValue} root - 目标对象
 * @param {[][]} model - 二维数组。每一项为[k, v]，k表示将要被替换的root中的key（支持使用数组描述），v表示将要替换成的key名
 * @param {boolean} [containProto=false] - 是否包含一级原型对象，不包含子级属性的原型
 * @param {symbol} [keysRange = KEYS_RANGE.enumerable] - 遍历键范围
 * @returns {boolean} 所有的键名替换都成功才返回true否则返回false
 * @example
* root = { a: 'a', b: 'b', c: { c1: 'c1' } } // 请不要使用让人困惑的属性描述。例如 b..c 或 .b.c等
* transformObjectKeys(root, [['a', 'A'], ['b', 'B'], ['c.c1', 'C1']]); // 返回：{ A: 'a', B: 'b', c: { C1: 'c1' } }
* // 注意先后顺序
* transformObjectKeys(root, [['a', 'A'], ['b', 'B'], ['c', 'C'], ['c.c1', 'C1']]); // 返回：{ A: 'a', B: 'b', C: { c1: 'c1' } }
* transformObjectKeys(root, [['a', 'A'], ['b', 'B'], ['c.c1', 'C1'], ['c', 'C']]); // 返回：{ A: 'a', B: 'b', C: { C1: 'c1' } }
*/
export function transformObjectKeys(root, model, { containProto = false, keysRange = KEYS_RANGE.enumerable } = {}) {
  assertComplex(root);
  assertArray(model);

  const opts = { containProto, keysRange };
  let success = true;

  model.forEach(([k, v]) => {
    const tar = _getNamespaceReference(root, k, opts);
    if (tar.result) {
      const descriptor = Reflect.getOwnPropertyDescriptor(tar.result, tar.key);
      if (Reflect.deleteProperty(tar.result, tar.key)) {
        success = Reflect.defineProperty(tar.result, v, descriptor) && success;
      } else {
        success = false;
      }
    } else {
      success = false;
    }
  });

  return success;
}

/**
 * 深度克隆，解除引用
 * 目标： 只对strictObject和数组解除引用
 * 注意：
 * 1.对于循环引用对象抛出错误
 * 2.原型的处理只会对自己本身的原型进行处理，不处理内部属性对象的原型
 * 3.数组的原型永远是Array.prototype，并且不论copyAll是否为true，数组总是会有length属性
 * 4.舍弃set和get方法。
 * 5.没有做尾递归优化，拷贝层级深的对象，可能会出现堆栈溢出情况
 * 对于vue等框架变量是响应式的，这里舍弃set和get方法，毕竟是只关心拷贝后的值，一般只做数据备份而已
 * @param {any} target - 要克隆的目标
 * @param {symbol} [keysRange = KEYS_RANGE.enumerable] - 遍历键范围
 * @param {boolean} [copyProto=true] - 是否复制原型（注意这不是说会对原型解除引用，只是复用了原来的原型），否则会使用Object.create(null)创建一个没有原型的对象;
 * @param {object} [theNewProto=null] - 当copyProto=false时，如果提供了此值则会作为新的原型
 * @returns {any}
*/
export function deepClone(target, { keysRange = KEYS_RANGE.enumerable, copyProto = true, theNewProto = null } = {}) {
  // 非array或isType !== 'object' 返回本身
  if (!isStrictObject(target) && !isArray(target)) {
    return target;
  }

  // check circular structure
  if (hasCircularStructure(target, { keysRange, containProto: false })) {
    throw new Error(TIP_HAS_CIRCULAR_STRUCTURE);
  }

  const descriptors = {};

  const keys = KEYS_RANGE_HOOKS.get(keysRange)(target, { containProto: false });
  keys.forEach((prop) => descriptors[prop] = Reflect.getOwnPropertyDescriptor(target, prop));

  Object.entries(descriptors).forEach(([prop, descriptor]) => {
    const value = hasOwn(descriptor, 'get') && isFunction(descriptor.get) ? descriptor.get() : descriptor.value;
    // 对内部属性值解除引用
    merge([
      descriptor,
      {
        value: deepClone(value, { keysRange, copyProto: true, theNewProto: null }),
      }
    ]);

    // 舍弃get
    Reflect.deleteProperty(descriptor, 'get');
    if (hasOwn(descriptor, 'set')) {
      // 舍弃set
      Reflect.deleteProperty(descriptor, 'set');
      // 设置可写属性
      merge([descriptor, { writable: true }]);
    }
  });
  if (isArray(target)) {
    // 对于数组单独设置不可遍历的属性length
    descriptors.length = descriptors.length || {
      value: target.length,
      enumerable: false,
      configurable: false,
      writable: true,
    };
    return Array.from(Object.create(Array.prototype, descriptors));
  }
  const prototype = (() => {
    if (copyProto) {
      return getPrototype(target);
    }
    return theNewProto || null;
  })();

  return Object.create(prototype, descriptors);
}

/**
 * 根据URL获取参数对象
 * NOTE 目前对于foo.com/?a=a&b=/#/view这种形式的地址，忽略 # 两边的 /，这个判定定义为 HASH_SPLIT_REG
 * 更加合法的写法应该是 foo.com?a=a&b=#/view，左边的 / 是不允许存在的
 * @param {string} url
 * @param {boolean} [decode=true] - 是否解码
 * @param {string} [mode=QUERY_MODE.query] - 模式。[query|hash]
 * query:普通的?后面的参数
 * hash:#后面字符串的参数
 * @returns {object}
*/
export function getUrlQuery(url, { mode = QUERY_MODE.query, decode = true } = {}) {
  assertString(url);
  assertEnum(mode, [QUERY_MODE.query, QUERY_MODE.hash]);

  const urlSplits = url.split(HASH_SPLIT_REG);
  if (mode === QUERY_MODE.hash) {
    return getUrlQuery(urlSplits[1] || '', { mode: QUERY_MODE.query, decode });
  }
  const theRequest = {};

  const urlPath = urlSplits[0] || '';
  const queryStrRes = QUERY_REG.exec(urlPath);
  const queryStrings = queryStrRes ? queryStrRes[1] : '';
  const strs = queryStrings ? queryStrings.split('&') : [];

  strs.forEach((unitStr) => {
    const { 1: name, 2: value } = /^([^=]+)=(.*)$/.exec(unitStr) || [];
    if (name) {
      theRequest[name] = decode  ? decodeURIComponent(value) : value;
    }
  });

  return theRequest;
}

/**
 * 解析query和hash参数
 * @param {string} url - 合理的url地址
 * @param {boolean} [decode=true]
 * @returns {object}
 */
export function urlParser(url, decode = true) {
  assertString(url);

  return {
    url,
    query: getUrlQuery(url, { mode: QUERY_MODE.query, decode }),
    hash: getUrlQuery(url, { mode: QUERY_MODE.hash, decode }),
  };
}

/**
 * 扩展url
 * @param {string} url
 * @param {object} [query] 往url中添加参数
 * @param {object[]} [remove] 移除url中的参数，可以是正则表达式（必需为正则对象）
 * @param {boolean} [encode=true] 是否对键值编码 默认true
 * @param {string} [mode=QUERY_MODE.query] - 模式.[query|hash]
 * @return {string}
 */
export function extendUrl(url, { query = {}, remove = [], mode = QUERY_MODE.query, encode = true } = {}) {
  assertString(url);
  assertObject(query);
  assertArray(remove);
  assertEnum(mode, [QUERY_MODE.query, QUERY_MODE.hash]);

  const urlRawQuery = getUrlQuery(url, { mode, decode: encode });
  const querys = [];

  const { 0: queryUrl = '', 1: hashUrl = '' } = url.split(HASH_SPLIT_REG);

  const hashMatchRes = url.match(HASH_SPLIT_REG);
  const hashSplitChar = hashMatchRes ? hashMatchRes[0] : '';

  const queryRes = QUERY_REG.exec(queryUrl);

  const queryMark = `@query${Date.now()}@`;

  let queryStr = queryRes ? queryRes [1] : '';

  let $queryUrl = queryUrl;

  if (queryStr) {
    $queryUrl = $queryUrl.replace(queryStr, queryMark)
  }


  merge([urlRawQuery, query]);

  Object.keys(urlRawQuery).forEach((key) => {
    const flag = remove.some((item) => {
      if (Object.prototype.toString.call(item) === '[object RegExp]') {
        return item.test(key);
      }
      return item === key;
    });
    if (!flag) {
      querys.push([`${key}=${encode ? encodeURIComponent(urlRawQuery[key]) : urlRawQuery[key]}`]);
    }
  });

  const path = querys.join('&');

  switch(mode) {
    case QUERY_MODE.query: {
      queryStr = path;
      if ($queryUrl.indexOf(queryMark) < 0) {
        $queryUrl = queryUrl + queryMark
      }
      if (path && !/\?$/.test($queryUrl.split(queryMark)[0])) {
        queryStr = `?${queryStr}`;
      }
      return $queryUrl.replace(queryMark, queryStr) + hashSplitChar + hashUrl;
    }
    case QUERY_MODE.hash: {
      const hashUrlResult = extendUrl(hashUrl, { query, remove, mode: QUERY_MODE.query, encode });
      return queryUrl + (!!hashUrlResult ? (hashSplitChar || '#') : hashSplitChar) + hashUrlResult;
    }
  }
  return url;
}

/**
 * 产生唯一标识 uuid
 * @param {number} len
 * @param {number} rad - 基数 2~62。只需要数字和大写字母使用36就可以了
 * @returns {string}
 */
export function generateUuid(len, rad) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  const radix = rad || chars.length;

  if (len) {
    const uuid = [];
    // Compact form
    for (let i = 0; i < len; i += 1) {
      // eslint-disable no-bitwise
      uuid[i] = chars[0 | Math.random() * radix];
    }

    return uuid.join('');
  }

  const format = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';

  return format.replace(/X+/g, (m) => generateUuid(m.length, 62));
}

/**
 * 产生唯一id
 * NOTE 使用此方法来生成作为HTMLElement元素的唯一id时会有一个trap，因为生成的id可能首位是数字，而id命名是不允许首位是数字的
 * @param {string} format - 使用大写X表示占位
 * @param {number} radix - 基数 2~62。只需要数字和大写字母使用36就可以了
 */
export function guid(format = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', radix = 62) {
  return format.replace(/X+/g, (m) => generateUuid(m.length, radix));
}

 /**
  * 转义正则表达式元字符
  * NOTE 使用RegExp构造函数来生成正则表达式时请务必使用此方法来转义元字符
  * @param {string} raw
  */
 export function transferMetaCharacters (raw) {
  return raw.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$&");
}

/**
 * 获取树形数据完整路径
 * @param {array} tree - 原始数据
 * @param {propertyKey} InodeId - 查找的节点id
 * @param {string} [id=id] - id映射键名
 * @param {string} [value=value] - 同id，优先使用id字段
 * @param {string} [children=children] - 子级键名映射
 * @returns {array}
 */
export function getTreeFullPath(tree, nodeId, { id, value, children } = {}) {
  assertArray(tree);
  composeAssert(nodeId, [isString, isNumber]);

  if (!isString(id) && !isString(value)) {
    throw new Error('[getTreeFullPath] needs id or value field');
  }
  if (!isString(children)) {
    throw new Error('[getTreeFullPath] needs children field');
  }
  if (!tree || !tree.length) {
    return [];
  }

  const opts = { id, value, children };
  const idField = id || value;

  const result = [];
  const flag = tree.some((item) => {
    if (item[idField] === nodeId) {
      result.push(item);
      return true;
    }
    const childrenTree = item[children];
    if (childrenTree && childrenTree.length) {
      const res = getTreeFullPath(childrenTree, nodeId, opts);
      if (res.length > 0) {
        [].push.call(result, item, ...res);
      }
      return res.length > 0;
    }
    return false;
  });
  return flag ? result : [];
}

/**
 * 根据唯一树节点id查找此节点的数据
 * @param {array} tree - 原始数据
 * @param {propertyKey} InodeId - 查找的节点id
 * @param {string} [id=id] - id映射键名
 * @param {string} [value=value] - 同id，优先使用id字段
 * @param {string} [children=children] - 子级键名映射
 * @returns {object|null}
 */
export function getTreeNodeDataById(tree, nodeId, { id, value, children } = {}) {
  const treeFullPath = getTreeFullPath(tree, nodeId, { id, value, children });
  const { [treeFullPath.length - 1]: nodeData = null } = treeFullPath;

  return nodeData;
}

/**
 * 获取树高度
 * @param {array} tree
 * @param {string} childrenProp - 子级字段名
 * @returns {number}
*/
function _getTreeHeight(tree, childrenProp, level = 0, height = 0) {
  assertArray(tree);
  assertString(childrenProp);

  if (tree.length) {
    level += 1;
    tree.forEach((item) => {
      const children = item[childrenProp];
      if (children && children.length) {
        height = _getTreeHeight(children, childrenProp, level, height);
      }
    });
  }

  return Math.max(level, height);
}

/**
 * 获取树高度
 * @param {array} tree
 * @param {string} childrenProp - 子级字段名
 * @returns {number}
*/
export function getTreeHeight(tree, childrenProp) {
  return _getTreeHeight(tree, childrenProp, 0, 0);
}

/**
 * 平铺树结构数据
 * @returns {array}
 */
function _flatTreeData(tree, childrenProp, result = []) {
  assertArray(tree);
  assertString(childrenProp);

  tree.forEach((child) => {
    result.push(child);
    const children = child[childrenProp];
    if (isArray(children)) {
      _flatTreeData(children, childrenProp, result);
    }
  });
  return result;
}

/**
 * 平铺树结构数据
 * @param {array} tree
 * @param {string} childrenProp - 子级字段名
 * @returns {array}
 */
export function flatTreeData(tree, childrenProp) {
  return _flatTreeData(tree, childrenProp);
}

/**
 * @typedef {object} SearchTreeInput
 */

/*
d.ts
interface SearchTreeInput {
  [prop: string]: (arg: any) => boolean,
}
 */

/**
 * 搜索树所有结果
 * @param {array} tree
 * @param {SearchTreeInput} input
 * @param {string} children - 子级字段名
 * @param {boolean} [onlyLeaf=true] - 是否只查找叶子节点数据
 * @param {symbol} [condition=CONDITION_MARK.or] - 结果的判断方式
 * @returns {array}
 */
export function searchTree(tree, input, { condition = CONDITION_MARK.or, children = 'children', onlyLeaf = true } = {}) {
  assertArray(tree);
  assertObject(input);
  assertString(children);
  assertBoolean(onlyLeaf);
  assertEnum(condition, [CONDITION_MARK.and, CONDITION_MARK.or]);

  const opts = { condition, children, onlyLeaf };
  const results = [];
  const inputProps = getPropertyKeys(input);
  const conditionHandler = CONDITION_MARK.and === condition ? Array.prototype.every : Array.prototype.some;

  tree.forEach((item) => {
    const isLeaf = !item[children] || !item[children].length;
    if ((isLeaf && onlyLeaf) || !onlyLeaf) {
      const isSatisfied = conditionHandler.call(inputProps, (prop) => input[prop](item[prop]));
      if (isSatisfied) {
        results.push(item);
      }
    }
    [].push.apply(results, searchTree(item[children] || [], input, opts));
  })
  return results;
}

/**
 * 将整数分割为对应的进制加数因子
 * @param {number} n
 * @param {number} radix - 2 ~ 36
 * @returns {number[]}
 * @example
 * decomposeInteger(112, 2) // [16, 32, 64]
 * decomposeInteger(112, 3) // [1, 3, 27, 81]
 * decomposeInteger(112, 8) // [48, 64]
 * decomposeInteger(112, 10) // [2, 10, 100]
 * decomposeInteger(112, 16) // [112]
 * decomposeInteger(112, 32) // [96]
 * decomposeInteger(112, 36) // [4, 108]
*/
export function decomposeInteger(n, radix = 10) {
  assertInteger(n);

  // step1.将n转为rdix进制字符串,并转为数组，再将数组倒序
  const binaryCharArr = [...n.toString(radix)].reverse();
  // step2.计算每个字符对应的radix进制值
  const results = [];
  binaryCharArr.forEach((num, idx) => {
    const res = num * (radix ** idx);
    if (res > 0) {
      results.push(res);
    }
  });
  return results;
}

/**
 * 延时函数
 * @param {number} t - 毫秒数
 * @param {function} callback
 * @returns {object}
 */
export function delay(t, callback) {
  let tId = null;
  let timeEnded = true;
  let resolver = null;
  return {
    start() {
      if (!tId) {
        timeEnded = false;
        tId = setTimeout(() => {
          timeEnded = true;
          if (isFunction(callback)) {
            callback();
          }
          if (resolver) {
            resolver();
          }
        }, t);
      }
      return this;
    },
    stop() {
      if (tId) {
        clearTimeout(tId);
        tId = null;
        timeEnded = true;
        resolver = null;
      }
      return this;
    },
    /**
     * @returns {promise}
     */
    untilEnd() {
      return new Promise((resolve) => {
        if (timeEnded) {
          resolve();
        }
        resolver = resolve;
      });
    },
  };
}

/**
 * 简单实现顺序预先填充参数，想要更加完善的功能请使用lodash或underscore
 * @param {function} func
 * @param  {...any} partials
 * @returns {function}
 */
export function partial(func, ...partials) {
  assertFunction(func);

  return function (...args) {
    return func.call(this, ...partials, ...args);
  }
}

/**
 * 简单实现预先填充右边参数，想要更加完善的功能请使用lodash或underscore
 * @param {function} func
 * @param  {...any} partials
 * @returns {function}
 */
export function partialRight(func, ...partials) {
  assertFunction(func);

  return function (...args) {
    return func.call(this, ...args, ...partials);
  }
}

/**
 * 顺序舍弃参数
 * @param {function} func
 * @param  {number} [len=1] - 要舍弃的参数个数
 * @returns {function}
 */
export function dropParams(func, len = 1) {
  assertFunction(func);
  assertNumber(len);

  return function (...args) {
    return func.apply(this, args.slice(Math.max(len, 0)));
  }
}

/**
 * 舍弃右边参数
 * @param {function} func
 * @param  {number} [len=1] - 要舍弃的参数个数
 * @returns {function}
 */
export function dropRightParams(func, len = 1) {
  assertFunction(func);
  assertNumber(len);

  return function (...args) {
    return func.apply(this, args.slice(0, (- Math.max(len, 0)) || args.length));
  }
}

/**
 * 保留指定参数位
 * @param {function} func
 * @param {number[]} [indexArr] - 要保留的参数索引列表
 * @returns {function}
 * @example
 * function A(a, b, c) {
 *  return [a, b, c];
 * }
 * const reserveA = reserveParams(A, [0, 2]); // 只保留传递的参数的0和2位置的参数
 * console.log(reserveA(1, 2, 3, 4, 5)); // [1, 3, undefined]
 */
export function reserveParams(func, indexArr) {
  assertFunction(func);
  assertArray(indexArr);

  return function(...args) {
    return func.apply(this, args.filter((item, idx) => (indexArr).includes(idx)));
  }
}

/**
 * 数字千分位展示，例如1234567.001 => 1,234,567.001
 * @param {string|number} num
 * @param {number} [fixed=2] - 小数保留位数
 */
export function numberThousandthDisplay(num, { fixed = 2 } = {}) {
  assertNumeric(num);

  const $0 = `${Number(num).toFixed(fixed)}`.split('.');
  const $1 = $0[0];
  const $2 = $0[1] || '';
  return [...[...$1].reverse().join('').replace(/\d{3}/g, '$&,')]
    .reverse().join('').replace(/^,|,$/g, '')
    + ($2 ? `.${$2}` : '');
}

/**
 * module export
 */
export default 'MODIFY_THIS_SCRIPT_CAREFULLY';
