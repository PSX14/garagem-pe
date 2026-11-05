const { jest } = require('@jest/globals');
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
// Fonts are native assets; Jest has no Android asset registry.
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
  loadAsync: jest.fn(async () => undefined),
  getLoadedFonts: jest.fn(() => ['Feather']),
}));
