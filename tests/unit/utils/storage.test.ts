import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageAdapter } from '../../../src/utils/storage';

describe('StorageAdapter', () => {
  let storage: StorageAdapter;

  // Mock localStorage
  const mockStorage: Record<string, string> = {};
  const localStorageMock = {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    }),
  };

  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();

    // Setup global mocks
    global.window = {
      localStorage: localStorageMock,
      sessionStorage: localStorageMock,
    } as any;

    storage = new StorageAdapter('localStorage');
  });

  describe('constructor', () => {
    it('should initialize with localStorage by default', () => {
      const adapter = new StorageAdapter();
      expect(adapter.isAvailable()).toBe(true);
    });

    it('should initialize with sessionStorage', () => {
      const adapter = new StorageAdapter('sessionStorage');
      expect(adapter.isAvailable()).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return true when storage is available', () => {
      expect(storage.isAvailable()).toBe(true);
    });
  });

  describe('getItem', () => {
    it('should get item from storage', () => {
      mockStorage['testKey'] = 'testValue';
      expect(storage.getItem('testKey')).toBe('testValue');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
    });

    it('should return null for non-existent key', () => {
      expect(storage.getItem('nonExistent')).toBeNull();
    });
  });

  describe('setItem', () => {
    it('should set item in storage', () => {
      const result = storage.setItem('testKey', 'testValue');
      expect(result).toBe(true);
      expect(mockStorage['testKey']).toBe('testValue');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', 'testValue');
    });
  });

  describe('removeItem', () => {
    it('should remove item from storage', () => {
      mockStorage['testKey'] = 'testValue';
      const result = storage.removeItem('testKey');
      expect(result).toBe(true);
      expect(mockStorage['testKey']).toBeUndefined();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('testKey');
    });
  });

  describe('clear', () => {
    it('should clear all items from storage', () => {
      mockStorage['key1'] = 'value1';
      mockStorage['key2'] = 'value2';
      const result = storage.clear();
      expect(result).toBe(true);
      expect(Object.keys(mockStorage).length).toBe(0);
      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('getJSON', () => {
    it('should parse and return JSON', () => {
      const data = { name: 'John', age: 30 };
      mockStorage['testKey'] = JSON.stringify(data);
      expect(storage.getJSON('testKey')).toEqual(data);
    });

    it('should return null for invalid JSON', () => {
      mockStorage['testKey'] = 'invalid json';
      expect(storage.getJSON('testKey')).toBeNull();
    });

    it('should return null for non-existent key', () => {
      expect(storage.getJSON('nonExistent')).toBeNull();
    });
  });

  describe('setJSON', () => {
    it('should stringify and store JSON', () => {
      const data = { name: 'John', age: 30 };
      const result = storage.setJSON('testKey', data);
      expect(result).toBe(true);
      expect(mockStorage['testKey']).toBe(JSON.stringify(data));
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      const result = storage.setJSON('testKey', circular);
      expect(result).toBe(false);
    });
  });
});
