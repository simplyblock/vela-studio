const { defineConfig, globalIgnores } = require('eslint/config')
const barrelFiles = require('eslint-plugin-barrel-files')
const js = require('@eslint/js')
const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

module.exports = defineConfig([
  {
    extends: compat.extends('eslint-config-supabase/next'),

    plugins: {
      'barrel-files': barrelFiles,
    },

    rules: {
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'warn',
      'barrel-files/avoid-re-export-all': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'import/no-anonymous-default-export': 'off',
      'no-restricted-exports': 'off',
      'turbo/no-undeclared-env-vars': 'off'
    },
  },
  globalIgnores([
    'vitest.config.ts',
    '.next/**',
    '.turbo/**',
    'node_modules/**',
    '__mocks__/**',
  ]),
])
