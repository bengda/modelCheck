# modelCheck
对数据进行校验和修剪


## 安装

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

<table style="display:table;width:100%;text-align:center;word-break:break-all;">
  <colgroup>
    <col width="220px">
    <col width="300px">
    <col width="160px">
    <col width="300px">
    <col width="200px">
  </colgroup>
  <theader>
    <tr style="background-color:#eee;">
      <th>字段</th>
      <th>类型</th>
      <th>默认值</th>
      <th>备注</th>
      <th>举例</th>
    </tr>
  </theader>
  <tbody>
    <tr>
      <td>prop</td>
      <td>string,string[]</td>
      <td></td>
      <td>重新指定要校验的属性名</td>
      <td>{ a: { prop: 'b' } }这时会校验b属性而不是a属性</td>
    </tr>
    <tr>
      <td>type</td>
      <td>null,Number,Boolean,String,Object,Array,Symbol,Date,Set,WeakSet,Map,WeakMap,Function</td>
      <td>[]</td>
      <td>对构造函数constructor判断来决定类型是否一致。[]表示不限定类型。多个类型可使用数组，如[Number, String]。注意null被认为属于任何类型</td>
      <td>{ type: String }或{ type: [String, Number] }</td>
    </tr>
    <tr>
      <td>required</td>
      <td>boolean,() => boolean</td>
      <td>false</td>
      <td>是否必需，为true缺少参数时抛出异常。可使用一个工厂函数返回布尔值</td>
      <td></td>
    </tr>
    <tr>
      <td>default</td>
      <td>any,() => any</td>
      <td>undefined</td>
      <td>当键值为undefined时提供默认值</td>
      <td></td>
    </tr>
    <tr>
      <td>ifNoPropCreate</td>
      <td>boolean</td>
      <td>false</td>
      <td>为true，则如果payload中不存在此key则创建，并使用default作为默认值。如果父级指定了ifNoPropCreate，那么子级自动也会设定ifNoPropCreate=true</td>
      <td></td>
    </tr>
    <tr>
      <td>replace</td>
      <td>any,(value: any, key: string|number) => any</td>
      <td></td>
      <td>替换原值为此值，如果为function则为函数返回的值，方法接收一个被替换前的value参数（此值可能是原本的值，也有可能是取自default的值）</td>
      <td></td>
    </tr>
    <tr>
      <td>remove</td>
      <td>boolean，(value: any, key: string|number) => boolean</td>
      <td></td>
      <td>只针对数组，如果数组某项指定了remove=true，那么此项会被移除</td>
      <td></td>
    </tr>
    <tr>
      <td>validateBeforeReplace</td>
      <td>(value: any, key: string|number) => boolean|error</td>
      <td></td>
      <td>在执行replace操作前进行数据有效性验证。如果返回Error的实例或者为false则表示数据不通过。</td>
      <td></td>
    </tr>
    <tr>
      <td>validator</td>
      <td>(value: any, key: string|number) => boolean|error</td>
      <td></td>
      <td>数据有效性验证。如果返回Error的实例或者为false则表示数据不通过。</td>
      <td></td>
    </tr>
    <tr>
      <td>message</td>
      <td>string,error,() => string|error</td>
      <td></td>
      <td>自定义validate错误信息。注意message只是针对validator和validateBeforeReplace校验失败的情况。 这是对用户输入数据校验，如果是数据类型有误，那是开发者的问题，开发者应该自己解决好</td>
      <td></td>
    </tr>
    <tr>
      <td>model</td>
      <td>object,(value: any, key: string|number) => object</td>
      <td></td>
      <td>对于子级的描述，对于数组来说就是数组每项的描述。只针对对象和数组。对于数组可使用function返回一个对象来动态配置每一项的model</td>
      <td></td>
    </tr>
  </tbody>
</table>


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
<b>注意：数据null总是会通过类型验证</b>

```js
  const data = {
    id: '123',
  };
  const descriptors = {
    id: {
      type: String,
    },
  };

  const data1 = {
    id: null,
  };


  // 校验通过
  modelCheck(data, descriptors);

  // 校验通过
  modelCheck(data1, descriptors);

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

const descriptors1 = {
  name: {
    type: String,
    validator(val) {
      return new Error('请填写姓名');
    },
  },
};

// Error:  请填写姓名
modelCheck(data, descriptors);

// Error:  请填写姓名
modelCheck(data, descriptors1);
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

## 对子级数据描述
我们可以指定model字段来对子级进行描述。<b>对于对象则需要指出需要描述的key，对于数组则不需要</b>。model字段支持使用一个工厂函数返回一个对象，工厂函数接收两个参数，第一个为当前项的值，第二个为数组索引值或对象的key。

- 对象的子级描述
```js
  const data = {
    o: {
      o1: {
        o11: {
          text: 'hello world!',
        },
      },
      o2: {
        o21: {
          text: 'wow!!!',
        },
      },
    },
  };
  const descriptors = {
    o: {
      type: Object,
      model: {
        o1: {
          type: Object,
          model: {
            o11: {
              type: Object,
              model: {
                text: {
                  type: String,
                  validator(v) {
                    return v === 'hello world!';
                  },
                },
              },
            },
          },
        },
        o2: {
          type: Object,
          model: {
            o21: {
              type: Object,
              model: {
                text: String,
              },
            },
          },
        },
      },
    },
  };
```

- 数组的子级描述
  
```js
  const data = {
    o: {
      o1: [1, {
        text: 'hello world!',
      }],
    },
  };
  const descriptors = {
    o: {
      type: Object,
      model: {
        o1: {
          type: Array,
          model(v, idx) {
            switch (idx) {
              case 0:
                return {
                  type: Number,
                };
              case 1: 
                return {
                  type: Object,
                  model: {
                    text: {
                      type: String,
                      validator(v) {
                        return v === 'hello world!';
                      },
                    },
                  },
                };
              default:
                return {};
            }
          },
        },
      },
    },
  };
```

## 使用namespace方式简化描述
<b>不推荐使用，因为这会破坏描述结构的可阅读性。</b>但是某些情况下我们想对深层次下的某个属性描述，一层一层描述下来，未免过于繁琐，这时我们可以使用namspace方式来简化描述，一步到位。

```js
const nested = {
  a: {
    a1: {
      a11: {
        a111: 'i am a111',
      },
    },
  },
};

const descriptors1 = {
  a: {
    model: {
      a1: {
        model: {
          a11: {
            model: {
              a111: String,
            },
          },
        },
      },
    },
  },
};

expect(modelCheck(nested, descriptors1)).to.deep.equal(nested);

// 使用namespace方式，是不是非常简洁?!
const descriptors2 = {
  'a.a1.a11.a111': {
    validator: (val) => val === 'i am a111',
  },
};

expect(modelCheck(nested, descriptors2)).to.deep.equal(nested);

// 也可以使用prop字段重新指定要校验的属性
const descriptors3 = {
  notCheck: {
    prop: 'a.a1.a11.a111',
    validator: (val) => val === 'i am a111',
  },
};

// prop也可以写成数组形式
const descriptors4 = {
  notCheck: {
    prop: ['a', 'a1', 'a11', 'a111'],
    validator: (val) => val === 'i am a111',
  },
};

expect(modelCheck(nested, descriptors3)).to.deep.equal(modelCheck(nested, descriptors4));

// 建议使用prop的数组形式来描述键路径
// 如果使用字符串如: a.b.c，那么有可能表示的是a.b.c这个属性，或a下的b.c属性或a.b下的c属性或a下的b属性下的c字段。
// 使用数组我们可以将上述情况精确表示出来，['a.b.c'], ['a', 'b.c'], ['a.b', 'c'], ['a', 'b', 'c']

const nested2 = {
  'a.b.c': 'a.b.c',
  a: {
    b: {
      c: 'a=>b=>c',
    },
    'b.c': 'a=>b.c',
  },
  'a.b': {
    c: 'a.b=>c',
  },
};

const descriptors5 = {
  // 如果我们想要描述a下的b属性下的c字段，有可能我们描述了a.b.c属性名（这跟传入数据中的键定义时间先后有关，这是极其不保险的做法）
  'a.b.c': {
    // 同理
    // prop: 'a.b.c',
    validator: (val) => val === 'a=>b=>c',
  },
};

// Error:  validate property a.b.c failed
modelCheck(nested2, descriptors5);

// 使用prop数组可以精确描述，可读性也更好
const descriptors6 = {
  'a.b.c': {
    // 我们想要描述a下的b属性下的c字段
    prop: ['a', 'b', 'c'],
    validator: (val) => val === 'a=>b=>c',
  },
};

// 验证通过，没有错误
modelCheck(nested2, descriptors6);

// 对于数组同样适用

const oArr = {
  arr: [
    1,
    {
      foo: {
        bar: 'have a nice day!',
      },
    },
    'hello world',
    ['a', 'b'],
  ],
};

const oArrDescriptors = {
  'arr.1.foo.bar': {
    type: String,
    validator: (val) => val === 'have a nice day!',
  },
  'arr.3.1': {
    type: String,
    validator: (val) => val === 'b',
  },
};

expect(modelCheck(oArr, oArrDescriptors)).to.deep.equal({
  arr: [
    undefined,
    {
      foo: {
        bar: 'have a nice day!',
      },
    }, 
    undefined,
    [undefined, 'b'],
  ],
});

// 属性不存在，也可以使用namespace方式创建
const oTar = {};

const oTarDescriptors = {
  'a.b.c': {
    ifNoPropCreate: true,
  },
};

expect(modelCheck(oTar, oTarDescriptors)).to.deep.equal({ a: { b: { c: undefined } } });


```

- <b>注意使用namespace不能直接来描述数组，数组是不能直接指定键名的。</b>因为假设数组长度为n，如果对0~n-1每一项都描述一遍显然不合理，所以数组描述是省略键名的，它的实现如下
```js
  if (isArray(payload)) {
    return modelCheck({ 0: payload }, { 0: model }, options)[0];
  }
```

例如：
```js
  const arr = [1, 2];

  const arrDescriptors = {
    type: Array,
    // 与对象不一样，数组不需要指定键名
    model: Number,
    // 否则我们就要写成这样了，这显然不合理
    // model: {
    //   0: Number,
    //   1: Number,
    // },
  };
```
```js
const arrTar = [1, 2];

const arrTarDescriptors = {
  1: {
    ifNoPropCreate: true,
    replace: '2',
  },
  2: {
    ifNoPropCreate: true,
    replace: 3,
  },
  '3.a.b': {
    ifNoPropCreate: true,
  },
};

// 上述描述并没有起作用
expect(modelCheck(arrTar, arrTarDescriptors)).to.deep.equal([1, 2]);

// 但是我们可以改写成这样

const arrTarDescriptors1 = {
  'foo.1': {
    ifNoPropCreate: true,
    replace: '2',
  },
  'foo.2': {
    ifNoPropCreate: true,
    replace: 3,
  },
  'foo.3.a.b': {
    ifNoPropCreate: true,
  },
};

expect(modelCheck({ foo: arrTar }, arrTarDescriptors1).foo).to.deep.equal([undefined, '2', 3, { a: { b: undefined } }]);

// 可能你注意到了，返回值里原本的值变成了undefined，这是因为默认配置onlyModelDesciprtors=true，只使用描述的键值
// 想要返回未定义的值，我们可以这样
expect(modelCheck({ foo: arrTar }, arrTarDescriptors1, { onlyModelDesciprtors: false }).foo).to.deep.equal([1, '2', 3, { a: { b: undefined } }]);
// 或者这样
const arrTarDescriptors2 = {
  // 将foo也包含进去
  foo: Array,
  'foo.1': {
    ifNoPropCreate: true,
    replace: '2',
  },
  'foo.2': {
    ifNoPropCreate: true,
    replace: 3,
  },
  'foo.3.a.b': {
    ifNoPropCreate: true,
  },
};
expect(modelCheck({ foo: arrTar }, arrTarDescriptors2).foo).to.deep.equal([1, '2', 3, { a: { b: undefined } }]);

```

### 校验流程

 * 1、遍历model的键值对，每个key（可以使用namespace形式，但是不建议，因为这样会破坏整体数据结构描述的观感，让描述不清晰直白）对应于payload对象的属性，value则是对于目标属性值的描述，对于数组来说没有子级属性这一说，则是对每一项描述，所以形式上了省略了key描述。以下流程都是针对key的描述校验
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
 