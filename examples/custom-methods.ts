/**
 * Example with custom endpoint methods
 */

import { createApiClient } from '../src';

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

// Create API client with custom methods
const api = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: [
    'posts',
    {
      name: 'users',
      customMethods: {
        // Custom method to activate a user
        // Note: 'this' is bound to the ApiClient instance at runtime
        async activate(userId: number) {
          const response = await (this as any).request<User>('users', {
            path: `${userId}/activate`,
            method: 'POST',
          });
          return response.data;
        },

        // Custom method to deactivate a user
        async deactivate(userId: number) {
          const response = await (this as any).request<User>('users', {
            path: `${userId}/deactivate`,
            method: 'POST',
          });
          return response.data;
        },

        // Custom method to search users
        async search(query: string) {
          const response = await (this as any).request<User[]>('users', {
            path: 'search',
            params: { q: query },
          });
          return response.data;
        },
      },
    },
  ] as const,
});

async function main() {
  // Use standard CRUD methods
  const allUsers = await api.users.get<User[]>();
  console.log('All users:', allUsers);

  // Use custom methods
  const searchResults = await api.users.search('john');
  console.log('Search results:', searchResults);

  await api.users.activate(1);
  console.log('User 1 activated');

  await api.users.deactivate(1);
  console.log('User 1 deactivated');
}

main();
