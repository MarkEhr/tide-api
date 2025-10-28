/**
 * Example: Strict vs Non-Strict Endpoint Typing
 *
 * This example demonstrates how strictMode controls type-safe endpoint access
 */

import { createApiClient, ApiClient } from '../src';

// ============================================================================
// Example 1: Strict Mode (default) - Type-Safe Endpoints
// ============================================================================

// With strictMode: true (default), only defined endpoints are accessible
const strictApi = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users', 'posts', 'comments'] as const, // 'as const' is required for type inference
  strictMode: true, // or omit this line - it's true by default
});

async function strictExample() {
  // ✅ These work - endpoints are defined
  await strictApi.users.get();
  await strictApi.posts.get({ id: 1 });
  await strictApi.comments.create({ params: { text: 'Hello' } });

  // ❌ TypeScript error - 'unknown' is not in the endpoints array
  // Uncomment the line below to see the error:
  // await strictApi.unknown.get();

  // This provides excellent IntelliSense - your editor will autocomplete
  // only 'users', 'posts', and 'comments'
}

// ============================================================================
// Example 2: Non-Strict Mode - Any Endpoint Allowed
// ============================================================================

// With strictMode: false, any endpoint can be accessed dynamically
const nonStrictApi = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users', 'posts'] as const, // These are still available
  strictMode: false, // Allow any endpoint
});

async function nonStrictExample() {
  // ✅ Defined endpoints work
  await nonStrictApi.users.get();
  await nonStrictApi.posts.get({ id: 1 });

  // ✅ Undefined endpoints also work - no TypeScript error
  await nonStrictApi.products.get();
  await nonStrictApi.orders.get({ id: 123 });
  await nonStrictApi.anything.create({ params: { foo: 'bar' } });

  // This is useful for:
  // - Dynamic APIs where endpoints aren't known at compile time
  // - Prototyping without defining all endpoints upfront
  // - APIs with many endpoints where typing them all is impractical
}

// ============================================================================
// Example 3: Strict Mode Without Endpoints Array
// ============================================================================

// If you don't define endpoints but use strictMode: true,
// NO endpoints will be accessible (TypeScript will show errors)
const noEndpointsApi = createApiClient({
  baseUrl: 'https://api.example.com',
  strictMode: true,
});

async function noEndpointsExample() {
  // ❌ TypeScript error - no endpoints defined
  // Uncomment the line below to see the error:
  // await noEndpointsApi.users.get();

  // To use this configuration, you must set strictMode: false
}

// ============================================================================
// Example 4: Object Endpoints with Custom Methods
// ============================================================================

const apiWithCustomMethods = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: [
    'users', // Simple endpoint
    {
      name: 'posts',
      customMethods: {
        // Custom method - 'this' is bound to the ApiClient instance at runtime
        async publish(id: number) {
          const response = await (this as any).request<{ published: boolean }>(
            'posts',
            { method: 'POST', path: `${id}/publish` }
          );
          return response.data;
        },
        async archive(id: number) {
          const response = await (this as any).request<void>(
            'posts',
            { method: 'DELETE', path: `${id}` }
          );
          return response.data;
        },
      },
    },
  ] as const,
  strictMode: true,
});

async function customMethodsExample() {
  // ✅ Standard methods work
  await apiWithCustomMethods.posts.get({ id: 1 });

  // ✅ Custom methods are also type-safe
  const result = await apiWithCustomMethods.posts.publish(1);
  console.log('Published:', result);

  await apiWithCustomMethods.posts.archive(1);
}

// ============================================================================
// Example 5: When to Use Each Mode
// ============================================================================

/*
Use strictMode: true (default) when:
✅ You know all your endpoints upfront
✅ You want maximum type safety and IntelliSense
✅ You want to catch typos at compile time
✅ You're building a production application with a stable API

Use strictMode: false when:
✅ Your API has many dynamic endpoints
✅ You're prototyping or in early development
✅ Endpoints are determined at runtime
✅ You prefer flexibility over type safety
✅ You're working with a third-party API with poor documentation
*/

export {
  strictExample,
  nonStrictExample,
  noEndpointsExample,
  customMethodsExample,
  strictApi,
  nonStrictApi,
  noEndpointsApi,
  apiWithCustomMethods,
};
