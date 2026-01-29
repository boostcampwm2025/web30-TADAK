export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['chore', 'feat', 'fix', 'refactor', 'test', 'docs', 'style', 'design', 'hotfix', 'merge'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-case': [0],
    'subject-full-stop': [0],
    'references-empty': [2, 'never'],
  },
  parserPreset: {
    parserOpts: {
      issuePrefixes: ['#'],
    },
  },
};
