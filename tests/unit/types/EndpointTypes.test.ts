/**
 * Type tests for endpoint typing
 * These tests verify TypeScript compilation, not runtime behavior
 */

import { describe, it, expectTypeOf } from 'vitest';
import { ApiClient } from '../../../src/core/ApiClient';
import type { EndpointMethods } from '../../../src/core/EndpointResolver';

describe('Endpoint Typing', () => {
  describe('Strict Mode (default)', () => {
    it('should only allow defined endpoints', () => {
      const api = new ApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users', 'posts'] as const,
        strictMode: true,
      });

      // These should be valid
      expectTypeOf(api.users).toMatchTypeOf<EndpointMethods>();
      expectTypeOf(api.posts).toMatchTypeOf<EndpointMethods>();

      // This would cause a TypeScript error (uncomment to test):
      // expectTypeOf(api.unknown).toMatchTypeOf<EndpointMethods>();
    });

    it('should work with object endpoints', () => {
      const api = new ApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: [
          'users',
          {
            name: 'posts',
            customMethods: {
              publish: async () => ({ published: true }),
            },
          },
        ] as const,
        strictMode: true,
      });

      expectTypeOf(api.users).toMatchTypeOf<EndpointMethods>();
      expectTypeOf(api.posts).toMatchTypeOf<EndpointMethods>();
      expectTypeOf(api.posts.publish).toBeFunction();
    });
  });

  describe('Non-Strict Mode', () => {
    it('should allow any endpoint', () => {
      const api = new ApiClient({
        baseUrl: 'https://api.example.com',
        endpoints: ['users'] as const,
        strictMode: false,
      });

      // All of these should be valid
      expectTypeOf(api.users).toMatchTypeOf<EndpointMethods>();
      expectTypeOf(api.posts).toMatchTypeOf<EndpointMethods>();
      expectTypeOf(api.anything).toMatchTypeOf<EndpointMethods>();
      expectTypeOf(api.whatever).toMatchTypeOf<EndpointMethods>();
    });
  });

  describe('Without endpoints array', () => {
    it('should require strictMode: false to access any endpoint', () => {
      const apiNonStrict = new ApiClient({
        baseUrl: 'https://api.example.com',
        strictMode: false,
      });

      // Should allow any endpoint in non-strict mode
      expectTypeOf(apiNonStrict.anything).toMatchTypeOf<EndpointMethods>();
    });
  });
});
