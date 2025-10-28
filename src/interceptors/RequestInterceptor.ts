import type { HttpMethod } from '../types';

/**
 * Context object passed through request interceptors
 */
export interface RequestContext {
  /** Full request URL */
  url: string;

  /** HTTP method */
  method: HttpMethod;

  /** Request headers */
  headers: Headers;

  /** Request body */
  body?: BodyInit;

  /** Abort signal for cancellation */
  signal?: AbortSignal;

  /** Metadata for passing data between interceptors/plugins */
  meta: Record<string, unknown>;
}

/**
 * Request interceptor interface
 * Allows modifying requests before they are sent
 */
export interface RequestInterceptor {
  /** Optional name for debugging */
  name?: string;

  /**
   * Called before each request
   * @param context The request context
   * @returns Modified context or original context
   */
  onRequest(context: RequestContext): RequestContext | Promise<RequestContext>;

  /**
   * Called when a request error occurs
   * @param error The error that occurred
   */
  onRequestError?(error: Error): void | Promise<void>;
}
