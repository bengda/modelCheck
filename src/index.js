/**
 * 对数组和对象类型数据模型进行验证
 * 具备两个功能：
 * 1、数据校验
 * 2、数据修剪
 * NOTE 注意null被认为是所有数据类型的子类
 * @author huyk<bengda@outlook.com>
 * @version 0.0.1
 * @module modelCheck
 * @example
 * const payload = {
 *  a: 1,
 *  b: 'b',
 *  extra: 's',
 *  arr: ['1', 2, {}],
 * };
 * const model = {
 *  a: {
 *   type: Number,
 *   required: true,
 *  },
 *  b: {
 *   type: [Number, String, '*', null],
 *   default() { return 'bbb'; },
 *   replace(v) { return v + 'replaced'; },
 *  },
 *  c: {
 *    ifNoPropCreate: true,
 *    replace: {},
 *    model: {
 *      c1: {
 *        ifNoPropCreate: true,
 *        default: 1,
 *      },
 *    }, 
 *  },
 *  d: {
 *    ifNoPropCreate: true,
 *  },
 *  arr: {
 *    type: Array,
 *    model: {
 *      type: [String, Number, Object],
 *    },
 *  },
 * };
 * modelCheck(payload, model); // { a:1, b: 'breplaced', c: { c1: 1 }, d: undefined, arr: ['1', 2, {}] }
 */
import {
  hasOwn,
  getFunctionName,
  hasNamespace,
  setNamespaceValue,
  namespace,
  deepClone,
  merge,
  createNestedObject,
  KEYS_RANGE_HOOKS,
} from './utils/helper';

import {
  isObject,
  isArray,
  isFunction,
  isUndefined,
} from './utils/types';

import { composeAssert, assertObject } from './utils/asserts';

import { KEYS_RANGE, MERGE_STRATEGY } from './utils/def';

/**
 * 只校验下列数据类型
 * 通过构造函数判断
 */
const allowedTypes = [
  null,
  Number,
  Boolean,
  String,
  Object,
  Array,
  Symbol,
  Date,
  Set,
  WeakSet,
  Map,
  WeakMap,
  Function,
];

/**
 * normalize error
 * @param {error|string} err
 */
function createError(err, noPrefix) {
  const error = err instanceof Error ? err : new Error(err);

  error.message = `${(noPrefix ? '' : '[modelCheck]')} ${error.message}`;
  // attach detail tag info
  error.detail = { type: 'model_check_error' };

  throw error;
}

/**
 * @param {function|function[]} type
 * @returns {array}
 */
function getType(type) {
  if (type !== null && !type) {
    return [];
  }
  return isArray(type) ? type : [type];
}

/**
 * 获取验证函数名
 * @param {(function|null)[]} types
 */
function getTypesName(types) {
  return types.map((type) => (type === null ? 'null' : getFunctionName(type))).join(',');
}

/**
 * 数据类型判断
 * @param {string} key
 * @param {any} value
 * @param {function[]} types
 * @returns {boolean}
 */
function typeCheck(key, value, types) {
  /**
   * 没有设定类型函数，则判定为可以通过类型验证
   */
  if (!types.length) {
    return true;
  }

  /**
   * 只允许指定数据类型集合
   */
  if (types.some((typer) => !allowedTypes.includes(typer))) {
    createError(`[${key} => ${JSON.stringify(value)}] the type field only support ${getTypesName(allowedTypes)}`);
    return false;
  }

  /**
   * 允许null是所有数据类型的实例
   */
  if (value === null) {
    return true;
  }

  const typeFlag = types.some((type) => {

    if (type === null) {
      return value === null;
    }

    try {
      // 通过构造函数来判断是否是同一种类型
      return value.constructor === type;
    } catch (error) {
      return false;
    }
  });

  if (!typeFlag) {
    createError(`[${key} => ${JSON.stringify(value)}] Expected ${getTypesName(types)}`);
  }
  return typeFlag;
}

/**
 * 数据校验
 * @param {() => boolean|error} validator - 数据校验函数，返回false和Error实例则为数据校验失败
 * @param {string} key
 * @param {any} value
 * @param {string} [message] - 错误提示
 */
function validate(validator, { key, value, message }) {
  const validateRes = validator(value, key);

  // 返回了Error实例或者为false则认为数据验证不通过，抛出错误
  if (validateRes instanceof Error || validateRes === false) {
    // 优先使用message的信息
    if (message instanceof Error) {
     createError(message, true);
    } else {
      const isErrorIns = validateRes instanceof Error;
      if (isErrorIns) {
        validateRes.message = (message || validateRes.message);
      }

      createError(validateRes || message || `validate property ${key} failed`, true);
    }
  }
}

/**
 * 对应于payload的key值，可使用（不建议）namespace 如 'a.b.c' 来指示子级key值，对于数组请使用model字段来描述每项
 * @typedef {object} Model
 * @property {string|string[]} [prop] - 重新指定要校验的属性名
 * @property {function|null} [type] - 数据类型 对构造函数判断来决定类型是否一致，多个类型可使用数组，如[Number, String, Boolean, null]
 * @property {boolean|function} [required=false] - 默认false 是否必需，为true缺少参数时抛出异常
 * @property {function|any} [default] - 可以用function 返回一个值。当键值为undefined时提供默认值
 * @property {boolean} [ifNoPropCreate=false] - 为true，则如果payload中不存在此key则创建，并使用default为默认值
 * @property {function|any} [replace] - (value: any, key: string) => any.替换原值为此值，如果为function则为函数返回的值，function接受一个被替换前的value参数（此值可能是原本的值，也有可能是取自default的值）
 * @property {object|function} [model] - (value: any, key: string|number)。对于子级的描述，对于数组来说就是数组每项的描述。只针对对象和数组。对于数组可使用function返回一个对象来动态配置每一项的model
 * @property {boolean|(value: any, key: string|number) => boolean} [remove] - 只针对数组，如果数组某项指定了remove=true，那么此项会被移除
 * @property {function} [validateBeforeReplace] - - (value: any, key: string) => any.在执行replace操作前进行数据有效性验证。如果返回Error的实例或者为false则表示数据不通过
 * @property {function} [validator] - (value: any, key: string) => any.数据有效性验证。如果返回Error的实例或者为false则表示数据不通过
 * @property {string|error|function} [message] - 自定义validator和validateBeforeReplace错误信息
 * @property {object[]} [elementFormRule] - element-ui的表单组件的rules校验规则
 */

/**
 * 流程
 * 1、遍历model的键值对，每个key（可以使用namespace形式，但是不建议，因为这样会破坏整体数据结构描述的观感，让描述不清晰直白）对应于payload对象的属性，value则是对于目标属性值的描述，对于数组来说没有子级属性这一说，则是对每一项描述，所以形式上了省略了key描述。
 * 以下流程都是针对key的描述校验
 * 2、检测ifNoPropCreate，看是否需要创建目标属性，如果为true并且目标属性不存在则创建
 * 3、检测required,如果为true并且目标属性不存在，抛出错误
 * 4、设定校验值，如果目标属性值为undefined，使用default默认值
 * 5、进行validateBeforeReplace数据有效性验证
 * 6、检测replace，如果存在则将校验值设定为replace数据
 * 7、进行typeCheck数据类型校验
 * 8、进行validator数据有效性校验
 * 9、检测model，递归对子级进行校验。如果父级ifNoPropCreate=true那么子级也会设定ifNoPropCreate=true
 * 10、完成目标属性赋值
 * 11、检测函数onlyModelDesciprtors设置，为true则返回只使用model中定义的key构造的数据结构
 */


/**
 * @param {object|array} payload
 * @param {...Model} model - 对payload进行检测的数据模型描述
 * @param {boolean} [cloneData=true] - 默认:true;是否克隆payload数据
 * @param {boolean} [onlyModelDesciprtors=true] - 默认:true;指定为true，则只返回model中定义的key值
 * @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
 * @param {boolean} [ifNoPropCreate=false] - 全局指定是否要对不存在的属性进行创建
 * @returns {object}
 */
export default function modelCheck (payload, model, {
  onlyModelDesciprtors = true,
  cloneData = true,
  keysRange = KEYS_RANGE.enumerable,
  ifNoPropCreate = false,
} = {}) {
  composeAssert(payload, [isObject, isArray], { message: '[modelCheck] payload Expected Object or Array' });
  assertObject(model, '[modelCheck] model Expected Object');


  const options = {
    onlyModelDesciprtors,
    cloneData,
    keysRange,
    ifNoPropCreate,
  };


  const nameSpaceOpts = { keysRange, containProto: false };

  // 对payload是数组的情况也进行支持
  if (isArray(payload)) {
    return modelCheck({ 0: payload }, { 0: model }, options)[0];
  }

  // 解除引用
  const data = cloneData ? deepClone(payload, { keysRange }) : payload;
  const modelProperties = KEYS_RANGE_HOOKS.get(keysRange)(model, { containProto: false });

  modelProperties.forEach((field) => {
    let prop = field;
    const fieldValue = model[field];

    const descriptor = {
      required: false,
      type: [],
      default: undefined,
      ifNoPropCreate: ifNoPropCreate || false,
      // prop?: string,
      // replace?: any,
      // model?: object,
      // validateBeforeReplace?: (value, key) => any
      // validator?: (value, key) => any,
      // message?: string|error|(() => string|error),
      // remove?: boolean|(value, key) => boolean, // only for array model
    };

    if (isObject(fieldValue)) {
      // 合并配置
      merge([descriptor, fieldValue]);

      descriptor.required = isFunction(fieldValue.required) ? fieldValue.required() : !!fieldValue.required;

      descriptor.type = getType(fieldValue.type);

      descriptor.default = isFunction(fieldValue.default) ? fieldValue.default() :  fieldValue.default;

      // descriptor.errorMsg = isFunction(fieldValue.errorMsg) ? fieldValue.errorMsg() : fieldValue.errorMsg;

      descriptor.message = isFunction(fieldValue.message) ? fieldValue.message() : fieldValue.message;

      /**
       * 存在prop字段则使用prop作为目标属性
       * @example
       * const payload = {
       *  b: 'b'
       * };
       * const model = {
       *  a: {
       *   // 这里重新指定了键名，所以会去校验payload中的属性b而不是a
       *   prop: 'b',
       *   type: String,
       *  },
       * }
       */
      if (fieldValue.prop) {
        prop = fieldValue.prop;
      }

    } else {
      // 认为是默认值
      // descriptor.default = isFunction(fieldValue) ? fieldValue() : fieldValue;
      // descriptor.type = [];

      // 默认是类型
      descriptor.type = getType(fieldValue);
    }

    // 创建新字段
    if (descriptor.ifNoPropCreate) {
      const isExistKey = hasNamespace(data, prop, nameSpaceOpts);
      if (!isExistKey) {
        // 创建一个对象
        const nested = createNestedObject([[prop, descriptor.default]]);
        // 深度合并到原有数据上
        merge([data, nested], { keysRange, mergeStrategy: MERGE_STRATEGY.deep });
      }
    }

    const isExistKey = hasNamespace(data, prop, nameSpaceOpts);

    // 键名不存在
    if (descriptor.required && !isExistKey) {
      createError(`property ${prop} is required`);
    }

    let valueToCheck = namespace(data, prop, nameSpaceOpts);

    // 目标值为undefined则使用默认值
    if (isUndefined(valueToCheck)) {
      valueToCheck = descriptor.default;
    }

    // 在replace前验证数据有效性
    if (isFunction(descriptor.validateBeforeReplace)) {
      validate(descriptor.validateBeforeReplace, {
        value: valueToCheck,
        key: prop,
        message: descriptor.message,
      });
    }

    // 使用replace替换为新的值
    if (hasOwn(descriptor, 'replace')) {
      valueToCheck = isFunction(descriptor.replace) ? descriptor.replace(valueToCheck, prop) : descriptor.replace;
    }

    // 开始校验数据类型
    typeCheck(prop, valueToCheck, descriptor.type);

    // 验证数据有效性
    if (isFunction(descriptor.validator)) {
      validate(descriptor.validator, {
        value: valueToCheck,
        key: prop,
        message: descriptor.message,
      });
    }

    // 如果存在子级model字段描述，可以是object和function
    if (isObject(descriptor.model) || isFunction(descriptor.model)) {
      if (isArray(valueToCheck)) {
        const itemsToRemove = [];
        // 对数组每一项使用model验证
        for (let i = 0; i < valueToCheck.length; i += 1) {
          const itemModel = isFunction(descriptor.model) ? descriptor.model(valueToCheck[i], i) : descriptor.model;
          // 如果有remove字段标识，则数组此项会被移除
          const wouldRemove = isFunction(itemModel.remove) ? itemModel.remove(valueToCheck[i], i) : itemModel.remove;
          if (wouldRemove) {
            itemsToRemove.push(i);
          } else {
            // 对数组的每一项使用model描述进行验证
            // 如果父级不存在并指定了要被创建，那么子级也应该自动被创建
            valueToCheck[i] = modelCheck({ [i]: valueToCheck[i] }, { [i]: itemModel }, { ...options, ifNoPropCreate: descriptor.ifNoPropCreate })[i];
          }
        }
        valueToCheck = valueToCheck.filter((item, idx) => !itemsToRemove.includes(idx));
      } else if (isObject(valueToCheck)) {
        const $model = isFunction(descriptor.model) ? descriptor.model(valueToCheck, prop) : descriptor.model;
        // 如果父级不存在并指定了要被创建，那么子级也应该自动被创建
        valueToCheck = modelCheck(valueToCheck, $model, { ...options, ifNoPropCreate: descriptor.ifNoPropCreate });
      }
    }
    
    // 完成属性赋值
    if (hasNamespace(data, prop, nameSpaceOpts)) {
      setNamespaceValue(data, prop, valueToCheck, nameSpaceOpts);
    }

  });
  
  // 只使用model中定义的key来构造数据结构
  if (onlyModelDesciprtors) {
    const tData = [];
    modelProperties.forEach((key) => {
      const realKey = isObject(model[key]) ? (model[key].prop || key) : key;
      tData.push([realKey, namespace(data, realKey, nameSpaceOpts)]);
    });
    
    return createNestedObject(tData);
  }

  return data;
}
