# modelCheck
对数据进行校验和修剪


--------
## 用法

```js
npm install modelcheck
```

## 示例

```js

  import modelCheck from 'modelcheck';

  const payload = {
    a: 1,
    b: 'b',
    extra: 's',
    arr: ['1', 2, {}],
    arr1: [2, { a: 'a' }, { b: 'c' }],
  };

  const model = {
    a: {
      ifNoPropCreate: true,
      type: Number,
      required: true,
    },
    b: {
      type: [Number, String, null],
      default() { return 'bbb'; },
      replace(v) { return v + 'replaced'; },
    },
    c: {
      ifNoPropCreate: true,
      replace: {},
      model: {
        c1: {
          default: 1,
        },
      }, 
    },
    d: {
      ifNoPropCreate: true,
    },
    'e.e1': {
      prop: ['e', 'a', 'e2'],
      ifNoPropCreate: true,
      type: Object,
      default: {},
      model: {
        e11: {
          type: [String, Number],
          default: 1,
        },
        e12: {
          type: [String, Number, Array],
          default: [1, 2, 5],
        },
      },
    },
    'e.a.e2.e12': {
      replace: [3, 4],
    },
    arr: {
      type: Array,
      model: {
        type: [String, Number, Object],
        remove(val) {
          return !(typeof val === 'number');
        },
      },
    },
    arr1: {
      type: Array,
    },
    '对数组更改': {
      prop: 'arr1.1',
      type: Object,
      replace: { hello: 'world' },
    },
    'arr1.2.b': {
      type: Number,
      replace: 3,
    },
    arr2: {
      ifNoPropCreate: true,
      default: [],
    },
    'arr2.0': {
      ifNoPropCreate: true,
      default: 2,
    },
  };
     
  expect(modelCheck(payload, model)).to.deep.equal({
    a:1,
    b: 'breplaced',
    c: { c1: 1 },
    d: undefined,
    arr: [2],
    arr1: [2, { hello: 'world' }, { b: 3 }],
    arr2: [2],
    e: {
      a: {
        e2: {
          e11: 1,
          e12: [3, 4],
        },
      },
    },
  });

```

## 接收参数
- @param {object|array} payload - 要校验的数据
- @param {[Model](#model)} model - 数据模型描述
- @param {[MoreOption](#moreoption)} option

### Model
字段|类型|默认值|备注|举例
|--|--|--|--|--|
prop|string,string[]||重新指定要校验的属性名|{ a: { prop: 'b' } }这时会校验b属性而不是a属性
type|null,Number,Boolean,String,Object,Array,Symbol,Date,Set,WeakSet,Map,WeakMap,Function|\[\]|对构造函数constructor判断来决定类型是否一致。[]表示不限定类型。多个类型可使用数组，如[Number, String]。注意null被认为属于任何类型|
required|boolean,function|false|默认false。是否必需，为true缺少参数时抛出异常。可使用一个工厂函数返回布尔值
default|function,any|undefined|可以用function 返回一个值。当键值为undefined时提供默认值
ifNoPropCreate|boolean|false|为true，则如果payload中不存在此key则创建，并使用default作为默认值。如果父级指定了ifNoPropCreate，那么子级自动也会设定ifNoPropCreate=true
replace|function,any||替换原值为此值，如果为function则为函数返回的值，function接受一个被替换前的value参数（此值可能是原本的值，也有可能是取自default的值）
remove|boolean，(value: any, key: string\|number) => boolean||只针对数组，如果数组某项指定了remove=true，那么此项会被移除
validateBeforeReplace|function||(value: any, key: string\|number) => boolean\|error.在执行replace操作前进行数据有效性验证。如果返回Error的实例或者为false则表示数据不通过。
validator|function||(value: any, key: string\|number) => boolean\|error.数据有效性验证。如果返回Error的实例或者为false则表示数据不通过。
message|string,error,function||自定义validate错误信息。注意message只是针对validator和validateBeforeReplace校验失败的情况。 这是对用户输入数据校验，如果是数据类型有误，那是开发者的问题，开发者应该自己解决好
model|object,function||(value: any, key: string\|number)。对于子级的描述，对于数组来说就是数组每项的描述。只针对对象和数组。对于数组可使用function返回一个对象来动态配置每一项的model

### MoreOption
- @param {boolean} [cloneData=true] - 默认:true;是否克隆payload数据
- @param {boolean} [onlyModelDesciprtors=true] - 默认:true;指定为true，则只返回model中定义的数据结构
- @param {symbol} [keysRange=KEYS_RANGE.enumerable] - 遍历键的方式
- @param {boolean} [ifNoPropCreate=false] - 全局指定是否要对不存在的属性进行创建

#### keysRange
指定遍历键的方式

```js
import { KEYS_RANGE } from 'modelcheck/dist/utils/def';

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

```

## 数据校验
- type：数据类型校验    

```js
  const data = {
    id: '123',
  };
  const descriptors = {
    id: {
      type: String,
    },
  };
  // 校验通过
  modelCheck(data, descriptors);

  const descriptors1 = {
    id: {
      type: Number,
    },
  };
  // Error: [modelCheck] [id => "123"] Expected Number
  modelCheck(data, descriptors1);

  const descriptors2 = {
    // 只要满足其中任意一种数据类型
    id: {
      type: [Number, String],
    },
  };
  // 校验通过
  modelCheck(data, descriptors2);
```
- required：字段是否必需，传入的数据没有指定属性时会抛出错误  
<b>注意：required是校验传入的数据是否存在属性，并不会对属性值是否是真值(truth-value)或是否是空数组校验</b>

```js
  const data = {
    id: '123',
  };
  const descriptors = {
    id: {
      type: String,
    },
    name: {
      required: true,
    },
  };

  // Error: [modelCheck] property name is required
  modelCheck(data, descriptors);
```

- validateBeforeReplace: (value: any, key: string|number) => boolean|error 在执行replace前进行数据验证。如果返回Error的实例或者为false则表示数据不通过。如果指定了message字段则错误信息使用message。  

```js
  const data = {
    id: '123',
  };
  const descriptors = {
    id: {
      type: [String, Number],
      replace(val) {
        return +val;
      },
      validateBeforeReplace(val) {
        return Object.prototype.toString.call(val) === '[object Number]';
      },
    },
  };

  // Error: [modelCheck] validate property id failed
  modelCheck(data, descriptors);
```
- validator：(value: any, key: string|number) => boolean|error 数据有效性验证。如果返回Error的实例或者为false则表示数据不通过。如果指定了message字段则错误信息使用message。  

```js
  const data = {
    id: '123',
  };
  const descriptors1 = {
    id: {
      type: [String, Number],
      replace(val) {
        return +val;
      },
      validator(val) {
        return Object.prototype.toString.call(val) === '[object String]';
      },
    },
  };

  const descriptors2 = {
    id: {
      type: [String, Number],
      replace(val) {
        return +val;
      },
      validator(val) {
        return Object.prototype.toString.call(val) === '[object Number]';
      },
    },
  };

  // Error: [modelCheck] validate property id failed
  modelCheck(data, descriptors1);

  // 通过
  modelCheck(data, descriptors2);
```

- message: string|error| () => string|error 错误信息  
<b>注意：message只是针对validator校验结果的提示，这是因为validator通常是针对用户输入数据的校验，而type，required等字段校验错误应该是开发者开发过程中就处理好</b>。

```js
const data = {
  name: '',
};
const descriptors = {
  name: {
    type: String,
    message: '请填写姓名',
    validator(val) {
      return !!val;
    },
  },
};

// Error:  请填写姓名
modelCheck(data, descriptors);
```
### 数据修剪

- default：当字段的键值为undefined时则会使用default值，一般配合ifNoPropCreate使用  

```js
  const data = {
    id: '123',
    name: undefined
  };
  const descriptors = {
    id: {
      type: String,
    },
    name: {
      default: '张三',
      required: true,
    },
  };

  expect(modelCheck(data, descriptors)).to.deep.equal({ id: '123', name: '张三' });

```

- replace：any | (value: any, key: string | number) => any.替换原值为此值，如果为function则为函数返回的值，function接受一个被替换前的value参数（此值可能是原本的值，也有可能是取自default的值）  

```js
  const data = {
    id: '123',
    name: undefined
  };
  const descriptors = {
    id: {
      type: String,
    },
    name: {
      default: '张三',
      required: true,
      replace: '李四',
    },
  };

  expect(modelCheck(data, descriptors)).to.deep.equal({ id: '123', name: '李四' });

```

- ifNoPropCreate：默认false；当为true，则如果payload中不存在此key则创建，并使用default为默认值 

```js
  const data = {
    id: '123',
  };
  const descriptors = {
    id: {
      type: String,
    },
    name: {
      ifNoPropCreate: true,
      default: '张三',
    },
    foo: {
      ifNoPropCreate: true,
      default: {},
      model: {
        bar: {
          type: String,
          default: 'modelCheck',
        },
      },
    },
  };
  
  const descriptors2 = {
    id: {
      type: String,
    },
    name: {
      default: '张三',
    },
    foo: {
      default: {},
      model: {
        bar: {
          type: String,
          default: 'modelCheck',
        },
      },
    },
  };

  expect(modelCheck(data, descriptors)).to.deep.equal({ id: '123', name: '张三', foo: { bar: 'modelCheck' } });

  expect(modelCheck(data, descriptors2, { ifNoPropCreate: true })).to.deep.equal({ id: '123', name: '张三', foo: { bar: 'modelCheck' } });
```

- remove: boolean | (value: any, key: string | number) => boolean 只针对数组，如果数组某项指定了remove=true，那么此项会被移除
  
```js
  const data = [1, 2, 3];
  const descriptors = {
    model(value, idx) {
      return {
        remove: idx === 1,
      };
    },
  };
  // 第1项将会被移除
  expect(modelCheck(data, descriptors)).to.deep.equal([1, 3]);
```

- onlyModelDesciprtors 如果指定了[MoreOption](#moreoption)中的onlyModelDesciprtors=true(默认为true)，那么只返回model中定义的key值

```js
  const data = {
    s1: '111',
    s2: '222',
  };
  const descriptors = {
    s1: String,
  };
  // data中的s2会被舍弃掉
  expect(modelCheck(data, descriptors)).to.deep.equal({ s1: '111' });
```