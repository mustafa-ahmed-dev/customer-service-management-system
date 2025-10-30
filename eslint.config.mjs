// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier'; // disables formatting rules that conflict with Prettier

export default tseslint.config(
  // 1) Ignores (adjust as you like)
  {
    ignores: [
      'dist',
      'node_modules',
      'drizzle',
      'coverage',
      'eslint.config.mjs',
    ],
  },

  // 2) ESLint core recommended
  eslint.configs.recommended,

  // 3) TypeScript (type-checked) recommended
  ...tseslint.configs.recommendedTypeChecked,

  // 4) Turn off ESLint rules that conflict with Prettier
  prettier,

  // 5) Project-level options & custom rules (placed last)
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      // If your Nest project is ESM, use 'module'; for CJS keep 'commonjs'
      // sourceType: 'module',
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Your custom rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Let Prettier handle line endings & formatting
      'linebreak-style': 'off',
    },
  },
);
