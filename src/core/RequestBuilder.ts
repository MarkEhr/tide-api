import type { ApiConfig, RequestOptions, HttpMethod } from '../types';
import type { RequestContext } from '../interceptors';
import { joinUrl, defaultNameToPath, stringifyQuery, mergeHeaders } from '../utils';

/**
 * Builds request contexts from endpoint names and options
 */
export class RequestBuilder {
  private config: Required<ApiConfig>;

  constructor(config: Required<ApiConfig>) {
    this.config = config;
  }

  /**
   * Build a request context from endpoint and options
   * @param endpoint The endpoint name
   * @param options The request options
   * @returns RequestContext
   */
  async build(endpoint: string, options: RequestOptions): Promise<RequestContext> {
    const method = options.method || 'GET';
    const baseUrl = options.baseUrl || this.config.baseUrl;

    // Build URL path
    const path = this.buildPath(endpoint, options);
    let url = joinUrl(baseUrl, path);

    // Add query string for GET requests
    if (method === 'GET' && options.params) {
      const query = stringifyQuery(options.params as Record<string, unknown>);
      if (query) {
        url += `?${query}`;
      }
    }

    // Build headers
    const headers = await this.buildHeaders(options);

    // Build body
    const body = this.buildBody(method, options);

    return {
      url,
      method: method as HttpMethod,
      headers,
      body,
      signal: options.signal,
      meta: options.meta || {},
    };
  }

  /**
   * Build the URL path from endpoint and options
   */
  private buildPath(endpoint: string, options: RequestOptions): string {
    // If custom path is provided, use it
    if (options.path) {
      const nameToPath = this.config.nameToPath || defaultNameToPath;
      const basePath = nameToPath(endpoint);
      return joinUrl(basePath, options.path);
    }

    // Convert endpoint name to path
    const nameToPath = this.config.nameToPath || defaultNameToPath;
    let path = nameToPath(endpoint);

    // Append ID if provided
    if (options.id) {
      path = joinUrl(path, String(options.id));
    }

    return path;
  }

  /**
   * Build request headers
   */
  private async buildHeaders(options: RequestOptions): Promise<Headers> {
    // Get default headers from config
    let defaultHeaders: Record<string, string> = {};

    if (this.config.headers) {
      if (typeof this.config.headers === 'function') {
        const result = this.config.headers();
        defaultHeaders = result instanceof Promise ? await result : result;
      } else if (this.config.headers instanceof Headers) {
        const obj: Record<string, string> = {};
        this.config.headers.forEach((value, key) => {
          obj[key] = value;
        });
        defaultHeaders = obj;
      } else {
        defaultHeaders = this.config.headers;
      }
    }

    // Add Content-Type for JSON requests if not uploading files
    if (!options.files && !defaultHeaders['Content-Type'] && !defaultHeaders['content-type']) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    // Merge with request-specific headers
    return mergeHeaders(defaultHeaders, options.headers);
  }

  /**
   * Build request body
   */
  private buildBody(method: HttpMethod, options: RequestOptions): BodyInit | undefined {
    // GET and HEAD requests don't have a body
    if (method === 'GET' || method === 'HEAD') {
      return undefined;
    }

    // Handle file uploads
    if (options.files) {
      return this.buildFormData(options);
    }

    // Handle JSON body
    if (options.params) {
      return JSON.stringify(options.params);
    }

    return undefined;
  }

  /**
   * Build FormData for file uploads
   */
  private buildFormData(options: RequestOptions): FormData {
    const formData = new FormData();

    // Add params as JSON if provided
    if (options.params) {
      formData.append('data', JSON.stringify(options.params));
    }

    // Add files
    if (options.files) {
      if (options.files instanceof File) {
        // Single file
        formData.append('file', options.files);
      } else if (Array.isArray(options.files)) {
        // Array of files
        options.files.forEach((file) => {
          formData.append('files[]', file);
        });
      } else {
        // Object with named files
        Object.entries(options.files).forEach(([name, file]) => {
          if (Array.isArray(file)) {
            file.forEach((f) => formData.append(`${name}[]`, f));
          } else {
            formData.append(name, file);
          }
        });
      }
    }

    return formData;
  }
}
