/**
 * Storage adapter for localStorage and sessionStorage
 * Provides a consistent interface with error handling
 */
export class StorageAdapter {
  private storage: Storage | null = null;

  constructor(storageType: 'localStorage' | 'sessionStorage' = 'localStorage') {
    if (typeof window !== 'undefined') {
      try {
        const testKey = '__tide_api_storage_test__';
        const storage = storageType === 'sessionStorage' ? window.sessionStorage : window.localStorage;
        storage.setItem(testKey, 'test');
        storage.removeItem(testKey);
        this.storage = storage;
      } catch (error) {
        // Storage not available (e.g., private mode, quota exceeded)
        console.warn('[tide-api] Storage not available:', error);
      }
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.storage !== null;
  }

  /**
   * Get an item from storage
   * @param key Storage key
   * @returns Stored value or null
   */
  getItem(key: string): string | null {
    if (!this.storage) return null;

    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.warn(`[tide-api] Failed to get item "${key}" from storage:`, error);
      return null;
    }
  }

  /**
   * Set an item in storage
   * @param key Storage key
   * @param value Value to store
   */
  setItem(key: string, value: string): boolean {
    if (!this.storage) return false;

    try {
      this.storage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`[tide-api] Failed to set item "${key}" in storage:`, error);
      return false;
    }
  }

  /**
   * Remove an item from storage
   * @param key Storage key
   */
  removeItem(key: string): boolean {
    if (!this.storage) return false;

    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[tide-api] Failed to remove item "${key}" from storage:`, error);
      return false;
    }
  }

  /**
   * Clear all items from storage
   */
  clear(): boolean {
    if (!this.storage) return false;

    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.warn('[tide-api] Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Get and parse JSON from storage
   * @param key Storage key
   * @returns Parsed object or null
   */
  getJSON<T>(key: string): T | null {
    const value = this.getItem(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(`[tide-api] Failed to parse JSON for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Stringify and set JSON in storage
   * @param key Storage key
   * @param value Object to store
   */
  setJSON(key: string, value: unknown): boolean {
    try {
      const json = JSON.stringify(value);
      return this.setItem(key, json);
    } catch (error) {
      console.warn(`[tide-api] Failed to stringify JSON for key "${key}":`, error);
      return false;
    }
  }
}
