module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.ts'],
  transformIgnorePatterns: ['node_modules/(?!(jose|firebase-admin|@firebase)/)'],
};
