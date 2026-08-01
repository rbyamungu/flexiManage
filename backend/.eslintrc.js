module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    'jest/globals': true
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2021
  },
  rules: {
    semi: ['error', 'always'],
    'no-constant-condition': 'off',
    'handle-callback-err': 'off',
    'no-trailing-spaces': 'off',
    'no-multiple-empty-lines': 'off',
    indent: 'off',
    'object-shorthand': 'off',
    'no-prototype-builtins': 'off',
    'max-len': 'off',
    'multiline-ternary': 'off',
    camelcase: 'off',
    'no-unused-vars': 'off',
    'array-callback-return': 'off',
    'n/no-exports-assign': 'off',
    'n/handle-callback-err': 'off',
    'no-empty': 'off',
    'prefer-regex-literals': 'off',
    'no-unreachable-loop': 'off'
  },
  plugins: ['jest']
};
