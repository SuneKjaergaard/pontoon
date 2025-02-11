/* eslint-env node */

import path from 'path';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import css from 'rollup-plugin-css-only';

/** @type {import('rollup').RollupOptions} */
const config = {
  input: 'src/index.js',
  output: { file: 'dist/tag_admin.js' },

  treeshake: 'recommended',

  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(
        process.env.BUILD ?? 'development',
      ),
    }),
    resolve(),
    babel({
      babelHelpers: 'runtime',
      configFile: path.resolve('../babel.config.json'),
    }),
    commonjs(),
    css({ output: 'tag_admin.css' }),
  ],
};

export default config;
