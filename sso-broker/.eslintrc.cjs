module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    "no-case-declarations": "off"
  },
  "overrides": [
    {
      files: ["tests/**"],
      env: {
        "node": true
      },
      globals: {
        "suite": true,
        "test": true,
        "describe": true,
        "expect": true,
        "assert": true,
        "vitest": true,
        "vi": true,
        "beforeAll": true,
        "afterAll": true,
        "beforeEach": true,
        "afterEach": true
      },
      rules: {
        "@typescript-eslint/ban-ts-comment": "off",
      }
    }
  ]
}
