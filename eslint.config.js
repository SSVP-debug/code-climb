import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'src/test/**'],
    ignores: ['backend/**'],
    languageOptions: {
      // Vitest exposes Node's `global` (e.g. `global.fetch = vi.fn()`)
      // even in jsdom-environment tests — without this, every such mock
      // was a no-undef false positive, not an actual missing import.
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['e2e/**/*.js'],
    languageOptions: {
      // e2e fixtures run under Node (Playwright), not the browser — they
      // reference process.env directly, same as any other Node script.
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['backend/**'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
