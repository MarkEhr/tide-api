import { ApiError } from '../types';
import type { RequestOptions } from '../types';

/**
 * Handles errors and creates ApiError instances
 */
export class ErrorHandler {
  /**
   * Handle an error and convert it to an ApiError
   * @param error The original error
   * @param endpoint The endpoint name
   * @param options The request options
   * @returns ApiError instance
   */
  handle(error: unknown, endpoint: string, options: RequestOptions): ApiError {
    // Already an ApiError, return as-is
    if (error instanceof ApiError) {
      return error;
    }

    // Network or fetch error
    if (error instanceof Error) {
      return new ApiError({
        message: error.message,
        method: options.method || 'GET',
        url: endpoint,
      });
    }

    // Unknown error type
    return new ApiError({
      message: 'An unknown error occurred',
      method: options.method || 'GET',
      url: endpoint,
      data: error,
    });
  }

  /**
   * Create an ApiError from a Response
   * @param response The fetch Response
   * @param method The HTTP method
   * @param url The request URL
   * @param data Optional parsed response data
   * @returns ApiError instance
   */
  async fromResponse(
    response: Response,
    method: string,
    url: string,
    data?: unknown
  ): Promise<ApiError> {
    const message = `HTTP ${response.status}: ${response.statusText}`;

    // Try to parse error body if not already provided
    let errorData = data;
    if (!errorData && response.headers.get('content-type')?.includes('application/json')) {
      try {
        errorData = await response.clone().json();
      } catch {
        // Failed to parse JSON, that's okay
      }
    }

    return new ApiError({
      message,
      method,
      url,
      status: response.status,
      statusText: response.statusText,
      response,
      data: errorData,
    });
  }
}
