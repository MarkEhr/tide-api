import type { ApiError } from '../types';
import type { RequestContext, ResponseContext } from '../interceptors';
import type { ApiClient } from '../core';

/**
 * Plugin interface for extending ApiClient functionality
 */
export interface Plugin {
  /** Plugin name (for identification) */
  name: string;

  /**
   * Called when the plugin is initialized
   * @param client The ApiClient instance
   */
  onInit?(client: ApiClient): void | Promise<void>;

  /**
   * Called before each request is sent
   * @param context The request context
   */
  onRequest?(context: RequestContext): void | Promise<void>;

  /**
   * Called after each successful response
   * @param context The response context
   */
  onResponse?(context: ResponseContext): void | Promise<void>;

  /**
   * Called when an error occurs
   * @param error The API error
   */
  onError?(error: ApiError): void | Promise<void>;

  /**
   * Called when the client is destroyed
   */
  onDestroy?(): void | Promise<void>;
}
