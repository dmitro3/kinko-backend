module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'prettier',
  ],
  rules: {
    // airbnb
    'no-console': 'off',
    'import/no-extraneous-dependencies': 'off',
    '@typescript-eslint/naming-convention': [
      'error',
      {selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case']},
    ],
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-shadow': 'off',
  },
};
