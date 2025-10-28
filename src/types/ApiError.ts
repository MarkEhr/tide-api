/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  readonly name = 'ApiError';
  readonly status?: number;
  readonly statusText?: string;
  readonly method: string;
  readonly url: string;
  readonly response?: Response;
  readonly data?: unknown; // Parsed error body if JSON

  constructor(options: {
    message: string;
    method: string;
    url: string;
    status?: number;
    statusText?: string;
    response?: Response;
    data?: unknown;
  }) {
    super(options.message);
    this.method = options.method;
    this.url = options.url;
    this.status = options.status;
    this.statusText = options.statusText;
    this.response = options.response;
    this.data = options.data;

    // Maintains proper stack trace for where error was thrown (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is a 4xx client error
   */
  is4xx(): boolean {
    return this.status ? this.status >= 400 && this.status < 500 : false;
  }

  /**
   * Check if error is a 5xx server error
   */
  is5xx(): boolean {
    return this.status ? this.status >= 500 && this.status < 600 : false;
  }

  /**
   * Check if error is a network error (no status code)
   */
  isNetworkError(): boolean {
    return !this.status;
  }

  /**
   * Check if error is unauthorized (401)
   */
  isUnauthorized(): boolean {
    return this.status === 401;
  }

  /**
   * Check if error is forbidden (403)
   */
  isForbidden(): boolean {
    return this.status === 403;
  }

  /**
   * Check if error is not found (404)
   */
  isNotFound(): boolean {
    return this.status === 404;
  }
}
