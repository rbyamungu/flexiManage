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
    'no-trailing-spaces': 'error',
    'no-prototype-builtins': 'off',
    'max-len': 'off',
    'multiline-ternary': 'off',
    camelcase: 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'array-callback-return': 'warn',
    'n/no-exports-assign': 'off',
    'n/handle-callback-err': 'off',
    'no-empty': 'warn',
    'prefer-regex-literals': 'off',
    'no-unreachable-loop': 'warn'
  },
  plugins: ['jest']
};
