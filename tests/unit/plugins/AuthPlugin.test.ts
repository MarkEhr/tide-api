import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthPlugin } from '../../../src/plugins';
import type { RequestContext } from '../../../src';

describe('AuthPlugin', () => {
  let plugin: AuthPlugin;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};

    const mockStorageAdapter = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
        return true;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
        return true;
      }),
    } as any;

    plugin = new AuthPlugin({
      storage: mockStorageAdapter,
    });
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      const defaultPlugin = new AuthPlugin();
      expect(defaultPlugin.name).toBe('AuthPlugin');
    });

    it('should initialize with custom config', () => {
      const customPlugin = new AuthPlugin({
        tokenKey: 'custom_token',
        headerName: 'X-Auth-Token',
        tokenPrefix: 'Token',
      });
      expect(customPlugin.name).toBe('AuthPlugin');
    });
  });

  describe('onRequest', () => {
    it('should add Authorization header when token exists', async () => {
      await plugin.setToken('test-token');

      const context: RequestContext = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
        meta: {},
      };

      await plugin.onRequest(context);

      expect(context.headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('should not override existing Authorization header', async () => {
      await plugin.setToken('test-token');

      const context: RequestContext = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: new Headers({ Authorization: 'Custom token' }),
        meta: {},
      };

      await plugin.onRequest(context);

      expect(context.headers.get('Authorization')).toBe('Custom token');
    });

    it('should not add header when no token exists', async () => {
      const context: RequestContext = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
        meta: {},
      };

      await plugin.onRequest(context);

      expect(context.headers.has('Authorization')).toBe(false);
    });

    it('should use custom header name and no prefix', async () => {
      const customStorage = {
        getItem: vi.fn(() => 'api-key-123'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      } as any;

      const customPlugin = new AuthPlugin({
        headerName: 'X-API-Key',
        tokenPrefix: '', // Empty prefix
        storage: customStorage,
      });

      const context: RequestContext = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
        meta: {},
      };

      await customPlugin.onRequest(context);

      expect(context.headers.get('X-API-Key')).toBe('api-key-123');
    });
  });

  describe('token management', () => {
    it('should set and get token', async () => {
      await plugin.setToken('new-token');
      const token = await plugin.getToken();
      expect(token).toBe('new-token');
    });

    it('should clear token', async () => {
      await plugin.setToken('token-to-clear');
      await plugin.clearToken();
      const token = await plugin.getToken();
      expect(token).toBeNull();
    });

    it('should check if token exists', async () => {
      expect(await plugin.hasToken()).toBe(false);
      await plugin.setToken('test-token');
      expect(await plugin.hasToken()).toBe(true);
      await plugin.clearToken();
      expect(await plugin.hasToken()).toBe(false);
    });
  });

  describe('custom getters and setters', () => {
    it('should use custom getToken function', async () => {
      const customGetToken = vi.fn().mockResolvedValue('custom-token');

      const customPlugin = new AuthPlugin({
        getToken: customGetToken,
        storage: plugin['storage'],
      });

      const token = await customPlugin.getToken();

      expect(customGetToken).toHaveBeenCalled();
      expect(token).toBe('custom-token');
    });

    it('should use custom setToken function', async () => {
      const customSetToken = vi.fn();

      const customPlugin = new AuthPlugin({
        setToken: customSetToken,
        storage: plugin['storage'],
      });

      await customPlugin.setToken('test-token');

      expect(customSetToken).toHaveBeenCalledWith('test-token');
    });

    it('should use custom clearToken function', async () => {
      const customClearToken = vi.fn();

      const customPlugin = new AuthPlugin({
        clearToken: customClearToken,
        storage: plugin['storage'],
      });

      await customPlugin.clearToken();

      expect(customClearToken).toHaveBeenCalled();
    });
  });

  describe('onInit', () => {
    it('should load token from storage on init', async () => {
      mockStorage['tide_api_token'] = 'stored-token';

      const mockClient = {
        setHeaders: vi.fn(),
      } as any;

      await plugin.onInit(mockClient);

      expect(mockClient.setHeaders).toHaveBeenCalledWith({
        Authorization: 'Bearer stored-token',
      });
    });

    it('should not set headers if no token in storage', async () => {
      const mockClient = {
        setHeaders: vi.fn(),
      } as any;

      await plugin.onInit(mockClient);

      expect(mockClient.setHeaders).not.toHaveBeenCalled();
    });
  });
});
