/**
 * Example: Authentication with in-memory token storage (default)
 *
 * By default, AuthPlugin stores tokens in memory.
 * This is perfect for:
 * - Server-side rendering (SSR)
 * - Node.js applications
 * - Single-page apps where you don't want persistence
 * - Testing environments
 */

import { createApiClient } from '../src';
import { AuthPlugin } from '../src/plugins';

// Create API client with in-memory auth (default behavior)
const api = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['auth', 'profile', 'users'] as const, // Type-safe endpoints
  strictMode: true, // Only allow defined endpoints
  plugins: [
    new AuthPlugin({
      // No storage configuration = in-memory token storage
      headerName: 'Authorization',
      tokenPrefix: 'Bearer',
    }),
  ],
});

async function inMemoryAuthExample() {
  // 1. Login and get token
  console.log('Logging in...');
  const loginResponse = await api.auth.custom({
    path: 'login',
    method: 'POST',
    params: { username: 'john', password: 'secret' },
  });

  // 2. Store token in memory
  const plugin = api.getConfig().plugins[0] as AuthPlugin;
  await plugin.setToken('jwt-token-here');

  // 3. Token is automatically added to all subsequent requests
  console.log('Fetching profile with token...');
  const profile = await api.profile.get();
  console.log('Profile:', profile);

  // 4. Token persists only during the session
  // When the app restarts, token is lost (good for security)

  // 5. Clear token on logout
  await plugin.clearToken();
  console.log('Logged out - token cleared from memory');
}

/**
 * Example: Authentication with localStorage persistence
 *
 * If you need persistence across page reloads, specify storageType
 */
const apiWithStorage = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['auth', 'profile'] as const,
  strictMode: true,
  plugins: [
    new AuthPlugin({
      storageType: 'localStorage', // Or 'sessionStorage'
      tokenKey: 'my_auth_token',
      headerName: 'Authorization',
      tokenPrefix: 'Bearer',
    }),
  ],
});

/**
 * Example: Custom token management
 *
 * For complete control, provide your own getToken/setToken functions
 */
const apiWithCustomStorage = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users'] as const,
  strictMode: true,
  plugins: [
    new AuthPlugin({
      getToken: async () => {
        // Get token from wherever you want
        return sessionStorage.getItem('custom_token');
      },
      setToken: async (token) => {
        // Store token however you want
        sessionStorage.setItem('custom_token', token);
      },
      clearToken: async () => {
        sessionStorage.removeItem('custom_token');
      },
    }),
  ],
});

export { inMemoryAuthExample, apiWithStorage, apiWithCustomStorage };
