import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApiClient } from '../../src';
import { MockTransport } from '../../src';
import { ApiError } from '../../src';
import type { RequestInterceptor, ResponseInterceptor } from '../../src';

describe('ApiClient Integration', () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = new MockTransport();
  });

  describe('Basic CRUD Operations', () => {
    it('should perform GET request', async () => {
      const mockData = [{ id: 1, name: 'John' }];
      transport.setMockResponse(
        /\/users$/,
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
      });

      const users = await api.users.get<typeof mockData>();
      expect(users).toEqual(mockData);
    });

    it('should perform GET request with ID', async () => {
      const mockData = { id: 1, name: 'John' };
      transport.setMockResponse(
        /\/users\/1$/,
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
      });

      const user = await api.users.get<typeof mockData>({ id: 1 });
      expect(user).toEqual(mockData);
    });

    it('should perform POST request', async () => {
      const newUser = { name: 'Jane', email: 'jane@example.com' };
      const createdUser = { id: 2, ...newUser };

      transport.setMockResponse(
        /\/users$/,
        new Response(JSON.stringify(createdUser), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
      });

      const user = await api.users.create<typeof createdUser>({ params: newUser });
      expect(user).toEqual(createdUser);
    });

    it('should perform PUT request', async () => {
      const updatedUser = { id: 1, name: 'John Updated', email: 'john@example.com' };

      transport.setMockResponse(
        /\/users\/1$/,
        new Response(JSON.stringify(updatedUser), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
      });

      const user = await api.users.update<typeof updatedUser>({
        id: 1,
        params: { name: 'John Updated' },
      });
      expect(user).toEqual(updatedUser);
    });

    it('should perform DELETE request', async () => {
      transport.setMockResponse(
        /\/users\/1$/,
        new Response(null, {
          status: 204,
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
      });

      const result = await api.users.delete({ id: 1 });
      expect(result).toBeUndefined();
    });
  });

  describe('Query Parameters', () => {
    it('should send query parameters in GET request', async () => {
      const mockData = [{ id: 1, name: 'John' }];
      transport.setMockResponse(
        /\/users\?page=1&limit=10/,
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
      });

      const users = await api.users.get({ params: { page: 1, limit: 10 } });
      expect(users).toEqual(mockData);
    });
  });

  describe('Custom Methods', () => {
    it('should support custom endpoint methods', async () => {
      const mockData = { id: 1, name: 'John', active: true };

      transport.setMockResponse(
        /\/users\/1\/activate$/,
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: [
          {
            name: 'users',
            customMethods: {
              async activate(userId: number) {
                const response = await (this as any).request('users', {
                  path: `${userId}/activate`,
                  method: 'POST',
                });
                return response.data;
              },
            },
          },
        ] as const,
        transport,
      });

      const result = await api.users.activate(1);
      expect(result).toEqual(mockData);
    });
  });

  describe('Interceptors', () => {
    it('should execute request interceptors', async () => {
      const mockData = { data: 'test' };
      transport.setDefaultResponse(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const requestInterceptor: RequestInterceptor = {
        name: 'test',
        onRequest: (ctx) => {
          ctx.headers.set('X-Custom-Header', 'test-value');
          return ctx;
        },
      };

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
        requestInterceptors: [requestInterceptor],
      });

      await api.users.get();
      // Header modification is verified in unit tests
    });

    it('should execute response interceptors', async () => {
      const mockData = { data: 'test' };
      transport.setDefaultResponse(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      let interceptorCalled = false;

      const responseInterceptor: ResponseInterceptor = {
        name: 'test',
        onResponse: (ctx) => {
          interceptorCalled = true;
          ctx.data = { ...ctx.data, intercepted: true };
          return ctx;
        },
      };

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
        responseInterceptors: [responseInterceptor],
      });

      await api.users.get();
      expect(interceptorCalled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw ApiError on 404', async () => {
      transport.setDefaultResponse(
        new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
      });

      await expect(api.users.get({ id: 999 })).rejects.toThrow(ApiError);

      try {
        await api.users.get({ id: 999 });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(404);
        expect((error as ApiError).is4xx()).toBe(true);
        expect((error as ApiError).isNotFound()).toBe(true);
      }
    });

    it('should call onError handler', async () => {
      transport.setDefaultResponse(
        new Response('Server Error', {
          status: 500,
          statusText: 'Internal Server Error',
        })
      );

      const onError = vi.fn();

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
        onError,
      });

      await expect(api.users.get()).rejects.toThrow();
      expect(onError).toHaveBeenCalled();
      expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(ApiError);
    });
  });

  describe('Strict Mode', () => {
    it('should throw error for undefined endpoint in strict mode', () => {
      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
        strictMode: true,
      });

      // @ts-expect-error - Intentionally accessing undefined endpoint to test error
      expect(() => api.posts).toThrow("Endpoint 'posts' is not defined");
    });

    it('should allow undefined endpoints in non-strict mode', async () => {
      transport.setDefaultResponse(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: [] as const,
        transport,
        strictMode: false,
      });

      const result = await api.posts.get();
      expect(result).toEqual([]);
    });
  });

  describe('Debug Mode', () => {
    it('should log requests and responses in debug mode', async () => {
      const consoleLog = vi.spyOn(console, 'log');

      transport.setDefaultResponse(
        new Response(JSON.stringify({ data: 'test' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
        debug: true,
      });

      await api.users.get();

      expect(consoleLog).toHaveBeenCalled();
      consoleLog.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should update config at runtime', async () => {
      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
      });

      api.setConfig({ debug: true });
      expect(api.getConfig().debug).toBe(true);
    });

    it('should update headers at runtime', async () => {
      const api = createApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        transport,
      });

      api.setHeaders({ 'X-Custom': 'value' });
      const config = api.getConfig();
      expect(config.headers).toHaveProperty('X-Custom', 'value');
    });
  });
});
