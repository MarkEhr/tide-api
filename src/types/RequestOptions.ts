import type { HttpMethod } from './EndpointDefinition';

/**
 * Options for making API requests
 */
export interface RequestOptions<TParams = unknown> {
  // URL building
  /** ID to append to endpoint path (e.g., /users/123) */
  id?: string | number;

  /** Custom path override (for .custom() method) */
  path?: string;

  /** Query params (GET) or request body (POST/PUT/PATCH) */
  params?: TParams;

  // Request config
  /** HTTP method */
  method?: HttpMethod;

  /** Additional headers for this request */
  headers?: Record<string, string>;

  /** Files to upload (automatically uses FormData) */
  files?: File | File[] | Record<string, File | File[]>;

  // Per-request overrides
  /** Override base URL for this request */
  baseUrl?: string;

  /** Override JSON parsing for this request */
  parseJSON?: boolean;

  /** AbortSignal for request cancellation */
  signal?: AbortSignal;

  // Metadata
  /** Additional metadata for plugins/interceptors */
  meta?: Record<string, unknown>;
}
