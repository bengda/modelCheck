/**
 * 一些常量定义
 * @author huyk<bengda@outlook.com>
 * @version 0.0.1
 * @module Def
 */

 /**
  * 合并策略
  */
export const MERGE_STRATEGY = {
  // 只合并一级，类似Object.assign
  shadow: Symbol('shadow'),
  // 递归合并每一级
  deep: Symbol('deep'),
};

/**
 * url querys typedef
 */
export const QUERY_MODE = {
  query: Symbol('query'),
  hash: Symbol('hash'),
};

/**
 * 定义条件判断类型
 */
export const CONDITION_MARK = {
  and: Symbol('and'),
  or: Symbol('or'),
};

/**
 * 定义遍历键的范围
 */
export const KEYS_RANGE = {
  // 不包含不可枚举属性，不包含symbol
  keys: Symbol('keys'),
  // 包含不可枚举属性，不包含symbol
  names: Symbol('names'),
  // 仅symbol属性，不包含不可枚举属性
  symbolKeys: Symbol('symbolKeys'),
  // 仅symbol属性，不管是否可枚举
  symbols: Symbol('symbols'),
  // 可枚举属性，包含symbol
  enumerable: Symbol('enumerable'),
  // 所有属性，不管是否可遍历
  all: Symbol('all'),
};

/**
 * module export
 */
export default {};
