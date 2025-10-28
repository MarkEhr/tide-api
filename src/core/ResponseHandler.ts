import type { ApiConfig, ApiResponse } from '../types';
import type { RequestContext } from '../interceptors';
import { ErrorHandler } from './ErrorHandler';

/**
 * Handles response parsing and transformation
 */
export class ResponseHandler {
  private config: Required<ApiConfig>;
  private errorHandler: ErrorHandler;

  constructor(config: Required<ApiConfig>) {
    this.config = config;
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Handle a fetch Response and convert it to ApiResponse
   * @param response The fetch Response
   * @param context The request context
   * @returns ApiResponse
   */
  async handle<TData>(response: Response, context: RequestContext): Promise<ApiResponse<TData>> {
    // Check for error status codes
    if (response.status >= 400) {
      const data = await this.parseResponseData(response);
      throw await this.errorHandler.fromResponse(response, context.method, context.url, data);
    }

    // Parse response data
    const data = await this.parseResponseData<TData>(response);

    // Apply response transformer if configured
    const transformedData = this.config.responseTransformer
      ? this.config.responseTransformer<TData>(data, response)
      : data;

    return {
      data: transformedData as TData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      raw: response,
    };
  }

  /**
   * Parse response data based on content type
   */
  private async parseResponseData<TData>(response: Response): Promise<TData> {
    // Check if response has content
    if (response.status === 204 || response.status === 205) {
      return undefined as TData;
    }

    const contentType = response.headers.get('content-type') || '';

    // Parse JSON if configured and content-type is JSON
    if (this.config.parseJSON && contentType.includes('application/json')) {
      try {
        return (await response.json()) as TData;
      } catch (error) {
        if (this.config.debug) {
          console.warn('[tide-api] Failed to parse JSON response:', error);
        }
        // Return response text as fallback
        return (await response.text()) as TData;
      }
    }

    // Handle other content types
    if (contentType.includes('text/')) {
      return (await response.text()) as TData;
    }

    if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf')) {
      return (await response.blob()) as TData;
    }

    // Default: try to parse as JSON, fall back to text
    try {
      return (await response.json()) as TData;
    } catch {
      return (await response.text()) as TData;
    }
  }
}
