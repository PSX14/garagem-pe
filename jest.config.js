module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/work/', '/outputs/'],
  collectCoverageFrom: ['src/domain/**/*.ts', 'src/state/**/*.ts', 'src/state/**/*.tsx'],
};
