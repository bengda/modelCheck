// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import cleanup from 'rollup-plugin-cleanup';

const packageJSON = require('./package.json');
const setVersion = require('./setVersion');

setVersion();

export default {
  input: 'src/index.js',
  output: {
    // file: 'dist/index.js',
    name: 'modelCheck',
    banner: `/*! ********************************
  * modelCheck
  * 对数组和对象类型数据模型进行验证
  * 具备两个功能：
  * 1、数据校验
  * 2、数据修剪
  * @author huyk<bengda@outlook.com>
  * @version ${packageJSON.version}
  *********************************/`,
  },
  plugins: [
    resolve(),
    babel({
      babelHelpers: 'bundled',
      exclude: ['node_modules/**', 'dist/**', 'build/**', 'legacy/**'],
    }),
    cleanup({ comments: 'some' }),
    terser(),
  ]
};
