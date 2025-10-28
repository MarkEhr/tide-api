/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Base configuration for endpoints
 */
export interface BaseEndpointConfig {
  /** Custom path override (default: nameToPath conversion of endpoint name) */
  path?: string;

  /** Default HTTP method for this endpoint */
  method?: HttpMethod;

  /** Default headers for this endpoint */
  headers?: Record<string, string>;

  /** Whether to parse JSON response (default: true) */
  parseJSON?: boolean;
}

/**
 * Simple string endpoint - generates CRUD methods automatically
 * @example 'users'
 */
export type SimpleEndpoint = string;

/**
 * Type for custom endpoint methods
 * The method is bound to the ApiClient instance
 * Accepts any function signature - users can define their own parameters
 */
export type EndpointMethod = (this: any, ...args: any[]) => any;

/**
 * Full object endpoint definition with custom methods
 */
export interface ObjectEndpoint extends BaseEndpointConfig {
  /** Name of the endpoint (used for URL path and property access) */
  name: string;

  /** Custom methods to add to this endpoint - can be any function signature */
  customMethods?: Record<string, (...args: any[]) => any>;

  /** If true, don't generate default CRUD methods (get, create, update, delete) */
  preventDefaultMethods?: boolean;
}

/**
 * Union type for endpoint definitions
 */
export type EndpointDefinition = SimpleEndpoint | ObjectEndpoint;
