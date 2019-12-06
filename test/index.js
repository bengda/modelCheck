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
    // 校验通过
    expect(modelCheck(data, descriptors)).to.deep.equal({ id: '123' });

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
    expect(modelCheck.bind(null, data, descriptors)).to.throw(Error);
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

    // Error:  请填写姓名
    expect(modelCheck.bind(null, data, descriptors)).to.throw(Error);
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

  it('数据修剪:中的onlyModelDesciprtors', function () {
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
});
