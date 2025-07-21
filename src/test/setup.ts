// Test setup file for Vitest
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

// Mock window.alert to prevent jsdom errors
Object.defineProperty(window, 'alert', {
  writable: true,
  value: vi.fn()
})

// Mock window.confirm to prevent jsdom errors  
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn().mockReturnValue(true)
})

// Mock localStorage with actual storage behavior
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Enhanced auto cleanup with V2 store isolation
beforeEach(() => {
  // Mock storylet catalog loading to prevent file system access
  vi.mock('../data/storylets', () => ({ default: [] }));
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Initialize V2 stores with clean state
  try {
    const { setupV2Test } = require('./v2-setup');
    setupV2Test();
  } catch (error) {
    // V2 setup might not be available in some tests, fallback to legacy
    console.warn('V2 test setup not available, falling back to legacy store reset');
    try {
      const { useAppStore } = require('../stores/useAppStore');
      const { useStoryletStore } = require('../stores/useStoryletStore');
      
      // Reset legacy stores as fallback
      useAppStore.setState({
        day: 1,
        resources: {
          energy: 100,
          stress: 0,
          money: 50,
          knowledge: 100,
          social: 150
        },
        activeCharacter: null
      });
      
      useStoryletStore.setState({
        allStorylets: {},
        activeStoryletIds: [],
        completedStoryletIds: [],
        activeFlags: {},
        storyletCooldowns: {},
        deploymentFilter: new Set(['live', 'dev'])
      });
    } catch (legacyError) {
      // Neither V2 nor legacy stores available - that's okay for some tests
    }
  }
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  
  // Reset V2 stores
  try {
    const { resetAllV2Stores } = require('./v2-setup');
    resetAllV2Stores();
  } catch (error) {
    // V2 stores not available, try legacy reset
    try {
      const { useAppStore } = require('../stores/useAppStore');
      const { useStoryletStore } = require('../stores/useStoryletStore');
      
      useAppStore.setState({
        day: 1,
        resources: {
          energy: 100,
          stress: 0,
          money: 50,
          knowledge: 100,
          social: 150
        },
        activeCharacter: null
      });
      
      useStoryletStore.setState({
        allStorylets: {},
        activeStoryletIds: [],
        completedStoryletIds: [],
        activeFlags: {},
        storyletCooldowns: {},
        deploymentFilter: new Set(['live', 'dev'])
      });

      // Also clear the catalog store
      try {
        const { useStoryletCatalogStore } = require('../stores/useStoryletCatalogStore');
        useStoryletCatalogStore.setState({
          allStorylets: {},
          lastLoaded: 0
        });
      } catch (catalogError) {
        // Catalog store might not exist
      }
    } catch (legacyError) {
      // Neither V2 nor legacy stores available
    }
  }
});

// Mock File System Access API properly
global.showDirectoryPicker = vi.fn().mockResolvedValue({
  requestPermission: vi.fn().mockResolvedValue('granted'),
  getFileHandle: vi.fn()
})

// Mock IndexedDB for persistence tests
import 'fake-indexeddb/auto'

// Add custom matchers for stores
expect.extend({
  toHaveBeenPersistedWithKey(received, key) {
    const stored = localStorage.getItem(key)
    return {
      pass: stored !== null,
      message: () => `Expected store to ${this.isNot ? 'not ' : ''}be persisted with key "${key}"`
    }
  }
})

// Suppress console warnings in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
}