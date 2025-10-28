/**
 * Factory function for creating type-safe API clients
 *
 * This factory properly infers endpoint types from the configuration,
 * providing excellent IntelliSense support.
 */

import { ApiClient } from './core/ApiClient';
import type { ApiConfig } from './types/ApiConfig';
import type { EndpointDefinition } from './types/EndpointDefinition';
import type { TypedApiClient } from './types/EndpointTypes';

/**
 * Configuration with proper type inference for endpoints
 */
export interface TypedApiConfig<
  TEndpoints extends readonly EndpointDefinition[] | undefined = undefined,
  TStrictMode extends boolean | undefined = true
> extends Omit<ApiConfig, 'endpoints' | 'strictMode'> {
  endpoints?: TEndpoints;
  strictMode?: TStrictMode;
}

/**
 * Creates a type-safe API client with proper endpoint inference
 *
 * @example
 * // Strict mode (default) - only defined endpoints accessible
 * const api = createApiClient({
 *   baseUrl: 'https://api.example.com',
 *   endpoints: ['users', 'posts'] as const,
 * });
 * api.users.get(); // ✅ OK - TypeScript knows about this
 * api.unknown.get(); // ❌ TypeScript error
 *
 * @example
 * // Non-strict mode - any endpoint accessible
 * const api = createApiClient({
 *   baseUrl: 'https://api.example.com',
 *   endpoints: ['users'] as const,
 *   strictMode: false,
 * });
 * api.anything.get(); // ✅ OK - any endpoint allowed
 */

// Overload: strictMode not provided (defaults to true)
export function createApiClient<TEndpoints extends readonly EndpointDefinition[]>(
  config: Omit<TypedApiConfig<TEndpoints, true>, 'strictMode'>
): ApiClient<TEndpoints, true> & TypedApiClient<TEndpoints, true>;

// Overload: strictMode explicitly set to false (non-strict mode)
export function createApiClient<TEndpoints extends readonly EndpointDefinition[] | undefined>(
  config: TypedApiConfig<TEndpoints, false> & { strictMode: false }
): ApiClient<TEndpoints, false> & TypedApiClient<TEndpoints, false>;

// Overload: strictMode explicitly set to true
export function createApiClient<TEndpoints extends readonly EndpointDefinition[]>(
  config: TypedApiConfig<TEndpoints, true> & { strictMode: true }
): ApiClient<TEndpoints, true> & TypedApiClient<TEndpoints, true>;

// Implementation
export function createApiClient<
  TEndpoints extends readonly EndpointDefinition[] | undefined = undefined,
  TStrictMode extends boolean | undefined = true
>(
  config: TypedApiConfig<TEndpoints, TStrictMode>
): ApiClient<TEndpoints, TStrictMode> & TypedApiClient<TEndpoints, TStrictMode> {
  return new ApiClient<TEndpoints, TStrictMode>(config as ApiConfig) as ApiClient<TEndpoints, TStrictMode> &
    TypedApiClient<TEndpoints, TStrictMode>;
}