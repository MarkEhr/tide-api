import type { ApiError } from '../types';
import type { RequestContext } from './RequestInterceptor';

/**
 * Context object passed through response interceptors
 */
export interface ResponseContext<TData = unknown> {
  /** The original request context */
  request: RequestContext;

  /** The fetch Response object */
  response: Response;

  /** The parsed response data */
  data: TData;

  /** Metadata from request context */
  meta: Record<string, unknown>;
}

/**
 * Response interceptor interface
 * Allows transforming responses after they are received
 */
export interface ResponseInterceptor {
  /** Optional name for debugging */
  name?: string;

  /**
   * Called after each successful response
   * @param context The response context
   * @returns Modified context or original context
   */
  onResponse<TData>(
    context: ResponseContext<TData>
  ): ResponseContext<TData> | Promise<ResponseContext<TData>>;

  /**
   * Called when a response error occurs
   * @param error The API error that occurred
   */
  onResponseError?(error: ApiError): void | Promise<void>;
}
