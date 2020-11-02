interface TypedModelCheckMessageParam {
  // 接管所有错误提示
  all: string | Error;
  // 类型错误时的提示
  type: string | Error;
  // 缺少字段时的提示
  required: string | Error;
  // validateBeforeReplace不通过时的提示
  validateBeforeReplace: string | Error;
  // validator不通过时的提示
  validator: string | Error;
}

interface TypedModelCheckModel {
  // 重新指定要校验的属性名
  prop?: string | string[];
  // 数据类型 对构造函数判断来决定类型是否一致，多个类型可使用数组，如[Number, String, Boolean, null]
  type?: Function | null | undefined | (Function | null | undefined)[]
  // 默认false 是否必需，为true缺少参数时抛出异常
  required?: boolean | (() => boolean);
  // 可以用function 返回一个值。当键值为undefined时提供默认值
  default?: Function | any;
  // 为true，则如果payload中不存在此key则创建，并使用default为默认值。默认false
  ifNoPropCreate?: boolean;
  // 替换原值为此值，如果为function则为函数返回的值，function接受一个被替换前的value参数（此值可能是原本的值，也有可能是取自default的值）
  replace?: ((value: any, key: string | number) => any) | any;
  // 对于子级的描述，对于数组来说就是数组每项的描述。只针对对象和数组。对于数组可使用function返回一个对象来动态配置每一项的model
  model?: ((value: any, key: string | number) => TypedModelCheckModelParam)
    | ((value: any, key: string | number) => TypedModelCheckModel)
    | (TypedModelCheckModelParam)
    | TypedModelCheckModel;
  // 只针对数组，如果数组某项指定了remove=true，那么此项会被移除
  remove?: boolean | ((value: any, key: string | number) => boolean);
  // 在执行replace操作前进行数据有效性验证。如果返回Error的实例或者为false则表示数据不通过
  validateBeforeReplace?: string | ((value: any, key: string | number) => Error | boolean | string);
  // 数据有效性验证。如果返回Error的实例或者为false则表示数据不通过
  validator?: string | ((value: any, key: string) => Error | boolean | string);
  // 自定义错误信息，默认为validator和validateBeforeReplace的错误提示
  message?: string | Error | TypedModelCheckMessageParam | ((value, key: string | number) => string | Error | TypedModelCheckMessageParam);
}

type TypedModelCheckModelParam = { [x: string]: TypedModelCheckModel | (Function | null | undefined) | (Function | null | undefined)[]}

enum TypedKeysRangeEnum {
  keys = Symbol('keys'),
  names = Symbol('names'),
  symbolKeys = Symbol('symbolKeys'),
  symbols = Symbol('symbols'),
  enumerable = Symbol('enumerable'),
  all = Symbol('all'),
}

export const KEYS_RANGE = TypedKeysRangeEnum;

export const version: string;

declare function modelCheck<T extends object | Array<any>>(payload: T, model: TypedModelCheckModelParam, config?: {
  onlyModelDesciprtors: boolean = true;
  cloneData: boolean = true;
  keysRange: TypedKeysRangeEnum = TypedKeysRangeEnum.keys,
  ifNoPropCreate: boolean = false;
}): T;

export = modelCheck;
