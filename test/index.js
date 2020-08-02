const path = require('path');
const expect = require('chai').expect;
const modelCheck = require(path.resolve('src/index')).default;
// const def = require(path.resolve('src/utils/def'));
// const actuator = require('./util').actuator;

describe('#ModelCheck', function () {

  it('总体测试', function () {
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
  });

  it('数据校验:type', function () {
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
    expect(modelCheck(data, descriptors)).to.deep.equal({ id: '123' });

    // 校验通过
    expect(modelCheck(data1, descriptors)).to.deep.equal({ id: null });

    const descriptors1 = {
      id: {
        type: Number,
      },
    };
    // Error: [modelCheck] [id => "123"] Expected Number
    expect(modelCheck.bind(null, data, descriptors1)).to.throw(Error);


    const descriptors2 = {
      // 只要满足其中任意一种数据类型
      id: {
        type: [Number, String],
      },
    };
    // 校验通过
    expect(modelCheck(data, descriptors2)).to.deep.equal({ id: '123' });
  });

  it('数据校验:required', function () {
    const data = {
      id: '123',
      desc: '',
    };
    const descriptors = {
      id: {
        type: String,
      },
      name: {
        required: true,
      },
    };

    const descriptors1 = {
      id: {
        type: String,
      },
      name: {
        type: String,
      },
    };

    const descriptors2 = {
      desc: {
        type: String,
        required: true,
      },
    }

    // Error: [modelCheck] property name is required
    expect(modelCheck.bind(null, data, descriptors)).to.throw(Error);

    expect(modelCheck.bind(null, data, descriptors1)).not.to.throw(Error);

    //  Error: value of property-desc is required
    expect(modelCheck.bind(null, data, descriptors2)).to.throw(Error);
  });

  it('数据校验:validateBeforeReplace', function () {
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
    expect(modelCheck.bind(null, data, descriptors)).to.throw(Error);
  });

  it('数据校验:validator', function () {
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
    expect(modelCheck.bind(null, data, descriptors1)).to.throw(Error);

    // 通过
    expect(modelCheck(data, descriptors2)).to.deep.equal({ id: 123 });
  });

  it('数据校验:message', function () {
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
          return new Error('请填写姓名!');
        },
      },
    };

    const descriptors2 = {
      name: {
        type: String,
        message: {
          validator: '没有填写姓名',
        },
        validator(val) {
          return !!val;
        },
      },
    };

    const descriptors3 = {
      a: {
        type: Number,
        required: true,
        message: {
          all: new Error('没有填写姓名咩'),
        },
        validator(val) {
          return new Error('请填写姓名!');
        },
      },
    };

    const descriptors4 = {
      name: {
        type: String,
        message: {
          validator: '请填写姓名',
        },
        validateBeforeReplace(val) {
          return !!val;
        },
      },
    };

    function A() {}
    const descriptors5 = {
      name: {
        type: [A],
        // message: {
        //   type: 'name类型错误',
        // },
      },
    };

    // Error:  请填写姓名
    expect(modelCheck.bind(null, data, descriptors)).to.throw(Error);

    expect(modelCheck.bind(null, data, descriptors1)).to.throw(Error);

    expect(modelCheck.bind(null, data, descriptors2)).to.throw(Error);

    expect(modelCheck.bind(null, data, descriptors3)).to.throw(Error);

    expect(modelCheck.bind(null, data, descriptors4)).to.throw(Error);

    expect(modelCheck.bind(null, data, descriptors5)).to.throw(Error);

  });

  it('数据修剪:data', function () {
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
  });

  it('数据修剪:replace', function () {
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
  });

  it('数据修剪:ifNoPropCreate', function () {
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
  });

  it('数据修剪:remove', function () {
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
  });

  it('数据修剪:onlyModelDesciprtors', function () {
    const data = {
      s1: '111',
      s2: '222',
    };
    const descriptors = {
      s1: String,
    };
    // data中的s2会被舍弃掉
    expect(modelCheck(data, descriptors)).to.deep.equal({ s1: '111' });
  });

  it('对象子级描述', function () {
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

    expect(modelCheck(data, descriptors)).to.deep.equal(data);
  });

  it('数组子级描述', function () {
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

    expect(modelCheck(data, descriptors)).to.deep.equal(data);
  });

  it('namespace', function () {
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

    // 使用namespace方式，**是不是非常简洁**
    const descriptors2 = {
      'a.a1.a11.a111': {
        validator: (val) => val === 'i am a111',
      },
    };

    expect(modelCheck(nested, descriptors2)).to.deep.equal(nested);

    // 也可以使用prop字段重新制定要校验的属性
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
    expect(modelCheck.bind(null, nested2, descriptors5)).to.throw(Error);

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

    // 上述描述并没哟起作用
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
  });

  it('validators', function () {

    const data1 = {
      foo: 1,
    };

    const des1 = {
      foo: {
        validator: '@is(1, $value)',
      },
    };

    modelCheck(data1, des1);

    const data2 = {
      foo: '-1',
    };

    const des2 = {
      foo: {
        message: '请填写大于0的数字',
        validator: '@isPositiveNumber',
      },
    };

    // Error:  请填写大于0的数字
    expect(modelCheck.bind(null, data2, des2)).to.throw(Error);


    const data3 = {
      foo: 1,
    };

    const des3 = {
      foo: {
        replace: '2',
        validateBeforeReplace: '@isNumeric',
        validator: '@is("2", $value)',
      },
    };

    modelCheck(data3, des3);

    const data4 = {
      area: '-100.23',
    };

    const des4 = {
      area: {
        message: '面积应该是一个大于0的数字',
        validator: '@isPositiveNumber',
      },
    };

    // Error:  面积应该是一个大于0的数字
    expect(modelCheck.bind(null, data4, des4)).to.throw(Error);

    const d1 = '2019-12-13';
    const d2 = '2019/12/13';
    const d3 = '2019-12/13';
    const d4 = '019/12/13';

    modelCheck({ date: d1 }, { date: { validator: '@isDate' } });
    modelCheck({ date: d2 }, { date: { validator: '@isDate' } });

    expect(modelCheck.bind(null, { date: d3 }, { date: { validator: '@isDate' } })).to.throw(Error);
    expect(modelCheck.bind(null, { date: d4 }, { date: { validator: '@isDate' } })).to.throw(Error);

    const t1 = '2019-12-13 16:40:22';
    const t2 = '2019/12/13 16:40:22';
    const t3 = '2019-12-13 16:40';

    modelCheck({ date: t1 }, { date: { validator: '@isDateTime' } });
    modelCheck({ date: t2 }, { date: { validator: '@isDateTime' } });

    expect(modelCheck.bind(null, { date: t3 }, { date: { validator: '@isDateTime' } })).to.throw(Error);

    const od = new Date();
    const ods = '2019-12-13T08:52:33.965Z';
    modelCheck({ date: od }, { date: { validator: '@isLooseDate' } });

    modelCheck({ date: ods }, { date: { validator: '@isLooseDate' } });

    expect(modelCheck.bind(null, { date: 2019 }, { date: { validator: '@isLooseDate' } })).to.throw(Error);
  });
});
