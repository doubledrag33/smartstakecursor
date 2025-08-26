module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  coverageReporters: ['text', 'lcov'],
};