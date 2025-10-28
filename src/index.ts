/**
 * Tide API - Modern, type-safe TypeScript library for consuming REST APIs
 * @packageDocumentation
 */

// Core
export { ApiClient } from './core';
export type { EndpointMethods } from './core';

// Factory (recommended for best type inference)
export { createApiClient } from './factory';
export type { TypedApiConfig } from './factory';

// Types
export type {
  ApiConfig,
  ApiResponse,
  RequestOptions,
  HttpMethod,
  EndpointDefinition,
  SimpleEndpoint,
  ObjectEndpoint,
  EndpointMethod,
  BaseEndpointConfig,
  Plugin,
  RequestInterceptor,
  ResponseInterceptor,
  Transport,
} from './types';

export { ApiError } from './types';

// Interceptors
export { InterceptorChain } from './interceptors';
export type { RequestContext, ResponseContext } from './interceptors';

// Transports
export { FetchTransport, MockTransport } from './transports';

// Utilities
export { joinUrl, camelToSnake, defaultNameToPath, stringifyQuery, parseQuery, StorageAdapter } from './utils';
