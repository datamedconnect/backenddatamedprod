import js from '@eslint/js';
import * as ts from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...ts.configs.recommended,
  prettierConfig,
  {
    plugins: {
      '@typescript-eslint': ts.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': 'warn',
    },
    languageOptions: {
      parser: ts.parser,
    },
  },
];