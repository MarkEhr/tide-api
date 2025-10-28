/**
 * Example with request/response interceptors
 */

import { createApiClient } from '../src';
import type { RequestInterceptor, ResponseInterceptor } from '../src';

// Create a logging interceptor
const loggingInterceptor: RequestInterceptor = {
  name: 'logger',
  onRequest: (context) => {
    console.log(`→ ${context.method} ${context.url}`);
    return context;
  },
};

// Create a timing interceptor
const timingInterceptor: ResponseInterceptor = {
  name: 'timer',
  onResponse: (context) => {
    const duration = Date.now() - (context.meta.startTime as number);
    console.log(`← ${context.response.status} (${duration}ms)`);
    return context;
  },
};

// Create API client with interceptors
const api = createApiClient({
  baseUrl: 'https://jsonplaceholder.typicode.com',
  endpoints: ['users'] as const,
  requestInterceptors: [loggingInterceptor],
  responseInterceptors: [timingInterceptor],
});

async function main() {
  const users = await api.users.get();
  console.log(`Fetched ${users.length} users`);
}

main();
