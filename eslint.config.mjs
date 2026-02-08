import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

const eslintConfig = defineConfig([
  ...nextVitals,
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/codegen/**',
    '.prettier*',
    '*.config.*',
  ]),
])

export default eslintConfig
