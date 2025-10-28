/**
 * Example with authentication using AuthPlugin
 */

import { createApiClient } from '../src';
import { AuthPlugin } from '../src/plugins';

interface User {
  id: number;
  name: string;
  email: string;
}

// Create API client with AuthPlugin
const api = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users', 'profile'] as const,
  plugins: [
    new AuthPlugin({
      tokenKey: 'my_api_token',
      storageType: 'localStorage',
      headerName: 'Authorization',
      tokenPrefix: 'Bearer',
    }),
  ],
  debug: true,
});

async function main() {
  // Assume we have a login endpoint
  // After login, set the token
  const authPlugin = new AuthPlugin();
  await authPlugin.setToken('your-jwt-token-here');

  // Now all requests will include the Authorization header
  const user = await api.profile.get<User>();
  console.log('Profile:', user);

  // Check if we have a token
  const hasToken = await authPlugin.hasToken();
  console.log('Has token:', hasToken);

  // Clear token on logout
  await authPlugin.clearToken();
}

main();
