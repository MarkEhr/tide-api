import type { ApiConfig, EndpointDefinition, RequestOptions, ApiResponse, Plugin, TypedApiClient } from '../types';
import { InterceptorChain } from '../interceptors';
import { FetchTransport } from '../transports';
import { RequestBuilder } from './RequestBuilder';
import { ResponseHandler } from './ResponseHandler';
import { ErrorHandler } from './ErrorHandler';
import { EndpointResolver } from './EndpointResolver';
import { defaultNameToPath } from '../utils';

/**
 * Main API client class with type-safe endpoint access
 *
 * @template TEndpoints - Array of endpoint definitions
 * @template TStrictMode - Whether to enforce strict endpoint typing
 *
 * @example
 * // Strict mode (default) - only defined endpoints accessible
 * const api = new ApiClient({
 *   baseUrl: 'https://api.example.com',
 *   endpoints: ['users', 'posts'] as const,
 *   strictMode: true
 * });
 * api.users.get(); // ✅ OK
 * api.unknown.get(); // ❌ TypeScript error
 *
 * @example
 * // Non-strict mode - any endpoint accessible
 * const api = new ApiClient({
 *   baseUrl: 'https://api.example.com',
 *   endpoints: ['users'] as const,
 *   strictMode: false
 * });
 * api.users.get(); // ✅ OK
 * api.anything.get(); // ✅ OK (no error)
 */
export class ApiClient<
  TEndpoints extends readonly EndpointDefinition[] | undefined = undefined,
  TStrictMode extends boolean | undefined = true
> {
  private config: Required<ApiConfig>;
  private requestBuilder: RequestBuilder;
  private responseHandler: ResponseHandler;
  private errorHandler: ErrorHandler;
  private interceptorChain: InterceptorChain;
  private plugins: Plugin[];
  private endpointCache: Map<string, unknown>;

  constructor(config: ApiConfig) {
    // Validate required config
    if (!config.baseUrl) {
      throw new Error('ApiClient requires a baseUrl in the configuration');
    }

    // Merge with defaults
    this.config = this.mergeWithDefaults(config);

    // Initialize core components
    this.requestBuilder = new RequestBuilder(this.config);
    this.responseHandler = new ResponseHandler(this.config);
    this.errorHandler = new ErrorHandler();
    this.interceptorChain = new InterceptorChain(
      this.config.requestInterceptors,
      this.config.responseInterceptors
    );

    // Initialize plugins
    this.plugins = this.config.plugins || [];
    void this.initializePlugins();

    // Initialize endpoint cache
    this.endpointCache = new Map();

    // Return Proxy for dynamic endpoint access with proper typing
    return new Proxy(this, EndpointResolver.createHandler(this)) as this &
      TypedApiClient<TEndpoints, TStrictMode>;
  }

  /**
   * Core request method - all requests go through here
   * @param endpoint The endpoint name
   * @param options Request options
   * @returns ApiResponse with typed data
   */
  async request<TResponse = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<TResponse>> {
    try {
      // 1. Build request context
      if (this.config.debug) {
        console.log(`[tide-api] Building request for endpoint: ${endpoint}`, options);
      }

      const requestContext = await this.requestBuilder.build(endpoint, options);

      // 2. Run request interceptors
      const modifiedContext = await this.interceptorChain.executeRequest(requestContext);

      // 3. Notify plugins (onRequest hook)
      await this.notifyPlugins('onRequest', modifiedContext);

      // 4. Execute transport (fetch)
      if (this.config.debug) {
        console.log(`[tide-api] → ${modifiedContext.method} ${modifiedContext.url}`);
      }

      const response = await this.config.transport.execute(modifiedContext);

      // 5. Handle response
      const apiResponse = await this.responseHandler.handle<TResponse>(
        response,
        modifiedContext
      );

      // 6. Run response interceptors
      const responseContext = {
        request: modifiedContext,
        response: apiResponse.raw,
        data: apiResponse.data,
        meta: modifiedContext.meta,
      };

      await this.interceptorChain.executeResponse(responseContext);

      // 7. Notify plugins (onResponse hook)
      await this.notifyPlugins('onResponse', responseContext);

      if (this.config.debug) {
        console.log(`[tide-api] ← ${response.status} ${response.statusText}`, apiResponse.data);
      }

      return apiResponse;
    } catch (error) {
      // 8. Error handling
      const apiError = this.errorHandler.handle(error, endpoint, options);

      if (this.config.debug) {
        console.error(`[tide-api] ✗ Error:`, apiError);
      }

      // 9. Notify plugins (onError hook)
      await this.notifyPlugins('onError', apiError);

      // 10. Call user error handler if configured
      if (this.config.onError) {
        this.config.onError(apiError);
      }

      throw apiError;
    }
  }

  /**
   * Get endpoint definition by name
   * @param name Endpoint name
   * @returns EndpointDefinition or undefined
   */
  getEndpoint(name: string): EndpointDefinition | undefined {
    return this.config.endpoints?.find((ep) =>
      typeof ep === 'string' ? ep === name : ep.name === name
    );
  }

  /**
   * Update configuration at runtime
   * @param updates Partial configuration to merge
   */
  setConfig(updates: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...updates } as Required<ApiConfig>;

    // Recreate components with new config
    this.requestBuilder = new RequestBuilder(this.config);
    this.responseHandler = new ResponseHandler(this.config);

    // Clear endpoint cache when config changes
    this.endpointCache.clear();
  }

  /**
   * Update headers at runtime
   * @param headers Headers to merge with existing headers
   */
  setHeaders(headers: Record<string, string>): void {
    const existingHeaders =
      typeof this.config.headers === 'function'
        ? this.config.headers()
        : this.config.headers || {};

    const existing = existingHeaders instanceof Promise ? {} : existingHeaders;

    this.config.headers = {
      ...(existing instanceof Headers ? {} : existing),
      ...headers,
    };
  }

  /**
   * Get current configuration (readonly)
   * @returns Current configuration
   */
  getConfig(): Readonly<Required<ApiConfig>> {
    return this.config;
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: NonNullable<ApiConfig['requestInterceptors']>[0]): void {
    if (interceptor) {
      this.interceptorChain.addRequestInterceptor(interceptor);
    }
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: NonNullable<ApiConfig['responseInterceptors']>[0]): void {
    if (interceptor) {
      this.interceptorChain.addResponseInterceptor(interceptor);
    }
  }

  /**
   * Add a plugin
   */
  async addPlugin(plugin: Plugin): Promise<void> {
    this.plugins.push(plugin);
    if (plugin.onInit) {
      await plugin.onInit(this);
    }
  }

  /**
   * Cleanup method - destroys plugins and clears caches
   */
  async destroy(): Promise<void> {
    await this.notifyPlugins('onDestroy');
    this.endpointCache.clear();
    this.interceptorChain.clearAll();
  }

  // Private methods

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(config: ApiConfig): Required<ApiConfig> {
    return {
      baseUrl: config.baseUrl,
      endpoints: config.endpoints || [],
      strictMode: config.strictMode ?? false, // v2 default: false
      headers: config.headers || {},
      credentials: config.credentials || 'omit',
      requestInterceptors: config.requestInterceptors || [],
      responseInterceptors: config.responseInterceptors || [],
      plugins: config.plugins || [],
      transport: config.transport || new FetchTransport(),
      parseJSON: config.parseJSON ?? true,
      responseTransformer: config.responseTransformer,
      onError: config.onError,
      nameToPath: config.nameToPath || defaultNameToPath,
      debug: config.debug || false,
    } as Required<ApiConfig>;
  }

  /**
   * Initialize all plugins
   */
  private async initializePlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.onInit) {
        await plugin.onInit(this);
      }
    }
  }

  /**
   * Notify all plugins of a lifecycle event
   */
  private async notifyPlugins(hook: keyof Plugin, ...args: unknown[]): Promise<void> {
    for (const plugin of this.plugins) {
      const hookFn = plugin[hook];
      if (hookFn && typeof hookFn === 'function') {
        await (hookFn as (...args: unknown[]) => Promise<void> | void).call(plugin, ...args);
      }
    }
  }
}
