import { describe, it, expect, vi } from 'vitest';
import { InterceptorChain } from '../../../src';
import type { RequestInterceptor, RequestContext } from '../../../src';
import type { ResponseInterceptor, ResponseContext } from '../../../src';
import { ApiError } from '../../../src';

describe('InterceptorChain', () => {
  describe('Request Interceptors', () => {
    it('should execute request interceptors in sequence', async () => {
      const order: number[] = [];

      const interceptor1: RequestInterceptor = {
        name: 'interceptor1',
        onRequest: async (ctx) => {
          order.push(1);
          return { ...ctx, headers: new Headers({ ...Object.fromEntries(ctx.headers), 'X-Test-1': '1' }) };
        },
      };

      const interceptor2: RequestInterceptor = {
        name: 'interceptor2',
        onRequest: async (ctx) => {
          order.push(2);
          return { ...ctx, headers: new Headers({ ...Object.fromEntries(ctx.headers), 'X-Test-2': '2' }) };
        },
      };

      const chain = new InterceptorChain([interceptor1, interceptor2], []);

      const context: RequestContext = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
        meta: {},
      };

      const result = await chain.executeRequest(context);

      expect(order).toEqual([1, 2]);
      expect(result.headers.get('X-Test-1')).toBe('1');
      expect(result.headers.get('X-Test-2')).toBe('2');
    });

    it('should handle interceptor errors', async () => {
      const onRequestError = vi.fn();

      const interceptor: RequestInterceptor = {
        name: 'failing',
        onRequest: async () => {
          throw new Error('Interceptor error');
        },
        onRequestError,
      };

      const chain = new InterceptorChain([interceptor], []);

      const context: RequestContext = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
        meta: {},
      };

      await expect(chain.executeRequest(context)).rejects.toThrow('Interceptor error');
      expect(onRequestError).toHaveBeenCalled();
    });

    it('should add interceptor at runtime', async () => {
      const chain = new InterceptorChain([], []);

      const interceptor: RequestInterceptor = {
        name: 'dynamic',
        onRequest: async (ctx) => ({ ...ctx, meta: { ...ctx.meta, added: true } }),
      };

      chain.addRequestInterceptor(interceptor);

      const context: RequestContext = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
        meta: {},
      };

      const result = await chain.executeRequest(context);
      expect(result.meta.added).toBe(true);
    });

    it('should remove interceptor by name', async () => {
      const interceptor: RequestInterceptor = {
        name: 'removable',
        onRequest: async (ctx) => ({ ...ctx, meta: { ...ctx.meta, processed: true } }),
      };

      const chain = new InterceptorChain([interceptor], []);

      const removed = chain.removeRequestInterceptor('removable');
      expect(removed).toBe(true);

      const context: RequestContext = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
        meta: {},
      };

      const result = await chain.executeRequest(context);
      expect(result.meta.processed).toBeUndefined();
    });
  });

  describe('Response Interceptors', () => {
    it('should execute response interceptors in sequence', async () => {
      const order: number[] = [];

      const interceptor1: ResponseInterceptor = {
        name: 'interceptor1',
        onResponse: async (ctx) => {
          order.push(1);
          return { ...ctx, data: { ...ctx.data, modified1: true } };
        },
      };

      const interceptor2: ResponseInterceptor = {
        name: 'interceptor2',
        onResponse: async (ctx) => {
          order.push(2);
          return { ...ctx, data: { ...ctx.data, modified2: true } };
        },
      };

      const chain = new InterceptorChain([], [interceptor1, interceptor2]);

      const context: ResponseContext = {
        request: {
          url: 'https://api.example.com',
          method: 'GET',
          headers: new Headers(),
          meta: {},
        },
        response: new Response(),
        data: {},
        meta: {},
      };

      const result = await chain.executeResponse(context);

      expect(order).toEqual([1, 2]);
      expect(result.data).toEqual({ modified1: true, modified2: true });
    });

    it('should handle response interceptor errors', async () => {
      const onResponseError = vi.fn();

      const interceptor: ResponseInterceptor = {
        name: 'failing',
        onResponse: async () => {
          throw new ApiError({
            message: 'Response interceptor error',
            method: 'GET',
            url: '/test',
          });
        },
        onResponseError,
      };

      const chain = new InterceptorChain([], [interceptor]);

      const context: ResponseContext = {
        request: {
          url: 'https://api.example.com',
          method: 'GET',
          headers: new Headers(),
          meta: {},
        },
        response: new Response(),
        data: {},
        meta: {},
      };

      await expect(chain.executeResponse(context)).rejects.toThrow('Response interceptor error');
      expect(onResponseError).toHaveBeenCalled();
    });
  });

  describe('Chain Management', () => {
    it('should clear all interceptors', async () => {
      const requestInterceptor: RequestInterceptor = {
        name: 'request',
        onRequest: async (ctx) => ({ ...ctx, meta: { ...ctx.meta, request: true } }),
      };

      const responseInterceptor: ResponseInterceptor = {
        name: 'response',
        onResponse: async (ctx) => ({ ...ctx, meta: { ...ctx.meta, response: true } }),
      };

      const chain = new InterceptorChain([requestInterceptor], [responseInterceptor]);

      chain.clearAll();

      const requestContext: RequestContext = {
        url: 'https://api.example.com',
        method: 'GET',
        headers: new Headers(),
        meta: {},
      };

      const result = await chain.executeRequest(requestContext);
      expect(result.meta.request).toBeUndefined();
    });

    it('should return false when removing non-existent interceptor', () => {
      const chain = new InterceptorChain([], []);
      expect(chain.removeRequestInterceptor('nonexistent')).toBe(false);
      expect(chain.removeResponseInterceptor('nonexistent')).toBe(false);
    });
  });
});
