module.exports = {
  preset: 'react-native',
  testEnvironment: 'node', // use node for simple logic tests
  // setupFiles: ['<rootDir>/jest.setup.js'], // comment this out for now
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons)/)',
  ],
};
