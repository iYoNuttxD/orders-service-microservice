module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/config/**',
    '!src/models/**',
  ],
  testMatch: [
    '**/tests/unit/**/*.test.js',
  ],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 60000,
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.js'], // Disabled for unit tests only
  maxWorkers: 1,
};