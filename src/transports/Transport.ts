import type { RequestContext } from '../interceptors';

/**
 * Transport interface for executing HTTP requests
 * Allows pluggable transport implementations
 */
export interface Transport {
  /**
   * Execute an HTTP request
   * @param context The request context
   * @returns The fetch Response
   */
  execute(context: RequestContext): Promise<Response>;
}
