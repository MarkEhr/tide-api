import type { EndpointDefinition } from './EndpointDefinition';
import type { ApiError } from './ApiError';
import type { RequestInterceptor } from '../interceptors/RequestInterceptor';
import type { ResponseInterceptor } from '../interceptors/ResponseInterceptor';
import type { Transport } from '../transports/Transport';

// Forward declaration for circular dependency
export interface Plugin {
  name: string;
  onInit?(client: unknown): void | Promise<void>;
  onRequest?(context: unknown): void | Promise<void>;
  onResponse?(context: unknown): void | Promise<void>;
  onError?(error: ApiError): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}

export type { RequestInterceptor, ResponseInterceptor, Transport };

/**
 * Configuration options for the API client
 */
export interface ApiConfig {
  // Required
  /** Base URL for all API requests (e.g., 'https://api.example.com') */
  baseUrl: string;

  // Endpoints
  /** Array of endpoint definitions */
  endpoints?: EndpointDefinition[];

  /**
   * If true, accessing undefined endpoints throws an error
   * If false, undefined endpoints are created automatically
   * @default false (v2 default changed from v1)
   */
  strictMode?: boolean;

  // Headers & Auth
  /** Default headers for all requests (can be object or function) */
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);

  /** Credentials mode for fetch requests */
  credentials?: RequestCredentials; // 'omit' | 'same-origin' | 'include'

  // Interceptors
  /** Request interceptors (executed before request) */
  requestInterceptors?: RequestInterceptor[];

  /** Response interceptors (executed after response) */
  responseInterceptors?: ResponseInterceptor[];

  // Plugins
  /** Plugins for extending functionality */
  plugins?: Plugin[];

  // Transport
  /** Custom transport implementation (default: FetchTransport) */
  transport?: Transport;

  // Response Parsing
  /** Whether to automatically parse JSON responses (default: true) */
  parseJSON?: boolean;

  /** Transform the response data before returning */
  responseTransformer?: <T>(data: unknown, response: Response) => T;

  // Error Handling
  /** Global error handler called for all errors */
  onError?: (error: ApiError) => void;

  // Utility
  /**
   * Function to convert endpoint names to URL paths
   * @default converts camelCase to snake_case
   * @example 'userProfile' -> 'user_profile'
   */
  nameToPath?: (name: string) => string;

  // Debug
  /** Enable debug logging for all requests/responses */
  debug?: boolean;
}
