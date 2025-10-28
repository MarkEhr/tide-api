// src/interceptors/InterceptorChain.ts
var InterceptorChain = class {
  constructor(requestInterceptors = [], responseInterceptors = []) {
    this.requestInterceptors = [...requestInterceptors];
    this.responseInterceptors = [...responseInterceptors];
  }
  /**
   * Execute all request interceptors in sequence
   * @param context The initial request context
   * @returns The modified request context
   */
  async executeRequest(context) {
    let modifiedContext = context;
    for (const interceptor of this.requestInterceptors) {
      try {
        modifiedContext = await interceptor.onRequest(modifiedContext);
      } catch (error) {
        if (interceptor.onRequestError) {
          await interceptor.onRequestError(error);
        }
        throw error;
      }
    }
    return modifiedContext;
  }
  /**
   * Execute all response interceptors in sequence
   * @param context The initial response context
   * @returns The modified response context
   */
  async executeResponse(context) {
    let modifiedContext = context;
    for (const interceptor of this.responseInterceptors) {
      try {
        modifiedContext = await interceptor.onResponse(modifiedContext);
      } catch (error) {
        if (interceptor.onResponseError) {
          await interceptor.onResponseError(error);
        }
        throw error;
      }
    }
    return modifiedContext;
  }
  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }
  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }
  /**
   * Remove a request interceptor by name
   */
  removeRequestInterceptor(name) {
    const index = this.requestInterceptors.findIndex((i) => i.name === name);
    if (index !== -1) {
      this.requestInterceptors.splice(index, 1);
      return true;
    }
    return false;
  }
  /**
   * Remove a response interceptor by name
   */
  removeResponseInterceptor(name) {
    const index = this.responseInterceptors.findIndex((i) => i.name === name);
    if (index !== -1) {
      this.responseInterceptors.splice(index, 1);
      return true;
    }
    return false;
  }
  /**
   * Clear all interceptors
   */
  clearAll() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }
};

// src/transports/FetchTransport.ts
var FetchTransport = class {
  async execute(context) {
    const { url, method, headers, body, signal } = context;
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal
    });
    return response;
  }
};

// src/transports/MockTransport.ts
var MockTransport = class {
  constructor() {
    this.mockResponses = /* @__PURE__ */ new Map();
    this.defaultResponse = null;
  }
  /**
   * Set a mock response for a specific URL pattern
   * @param pattern URL pattern (can be regex string or exact match)
   * @param response The mock Response to return
   */
  setMockResponse(pattern, response) {
    const key = pattern instanceof RegExp ? pattern.source : pattern;
    this.mockResponses.set(key, response);
  }
  /**
   * Set a default mock response for unmatched URLs
   * @param response The default Response to return
   */
  setDefaultResponse(response) {
    this.defaultResponse = response;
  }
  /**
   * Clear all mock responses
   */
  clear() {
    this.mockResponses.clear();
    this.defaultResponse = null;
  }
  async execute(context) {
    const { url } = context;
    for (const [pattern, response] of this.mockResponses.entries()) {
      const regex = new RegExp(pattern);
      if (regex.test(url)) {
        return response.clone();
      }
    }
    if (this.defaultResponse) {
      return this.defaultResponse.clone();
    }
    return new Response(JSON.stringify({ error: "No mock response configured" }), {
      status: 404,
      statusText: "Not Found",
      headers: { "Content-Type": "application/json" }
    });
  }
};

// src/utils/urlBuilder.ts
function joinUrl(...parts) {
  return parts.map((part, index) => {
    if (index !== 0) {
      part = part.replace(/^\/+/, "");
    }
    if (index !== parts.length - 1) {
      part = part.replace(/\/+$/, "");
    }
    return part;
  }).filter((part) => part.length > 0).join("/");
}
function camelToSnake(str) {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}
var defaultNameToPath = camelToSnake;

// src/utils/queryString.ts
function stringifyQuery(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === void 0) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== void 0) {
          searchParams.append(`${key}[]`, String(item));
        }
      });
    } else if (typeof value === "object") {
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (subValue !== null && subValue !== void 0) {
          searchParams.append(`${key}[${subKey}]`, String(subValue));
        }
      });
    } else {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}
function parseQuery(queryString) {
  const params = new URLSearchParams(queryString.replace(/^\?/, ""));
  const result = {};
  params.forEach((value, key) => {
    if (key.endsWith("[]")) {
      const arrayKey = key.slice(0, -2);
      if (!result[arrayKey]) {
        result[arrayKey] = [];
      }
      result[arrayKey].push(value);
    } else if (key.includes("[") && key.includes("]")) {
      const matches = key.match(/^([^[]+)\[([^\]]+)\]$/);
      if (matches && matches[1] && matches[2]) {
        const objectKey = matches[1];
        const subKey = matches[2];
        if (!result[objectKey]) {
          result[objectKey] = {};
        }
        result[objectKey][subKey] = value;
      }
    } else {
      result[key] = value;
    }
  });
  return result;
}

// src/utils/headers.ts
function mergeHeaders(...sources) {
  const merged = new Headers();
  for (const source of sources) {
    if (!source) continue;
    if (source instanceof Headers) {
      source.forEach((value, key) => {
        merged.set(key, value);
      });
    } else {
      Object.entries(source).forEach(([key, value]) => {
        merged.set(key, value);
      });
    }
  }
  return merged;
}

// src/utils/storage.ts
var StorageAdapter = class {
  constructor(storageType = "localStorage") {
    this.storage = null;
    if (typeof window !== "undefined") {
      try {
        const testKey = "__tide_api_storage_test__";
        const storage = storageType === "sessionStorage" ? window.sessionStorage : window.localStorage;
        storage.setItem(testKey, "test");
        storage.removeItem(testKey);
        this.storage = storage;
      } catch (error) {
        console.warn("[tide-api] Storage not available:", error);
      }
    }
  }
  /**
   * Check if storage is available
   */
  isAvailable() {
    return this.storage !== null;
  }
  /**
   * Get an item from storage
   * @param key Storage key
   * @returns Stored value or null
   */
  getItem(key) {
    if (!this.storage) return null;
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.warn(`[tide-api] Failed to get item "${key}" from storage:`, error);
      return null;
    }
  }
  /**
   * Set an item in storage
   * @param key Storage key
   * @param value Value to store
   */
  setItem(key, value) {
    if (!this.storage) return false;
    try {
      this.storage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`[tide-api] Failed to set item "${key}" in storage:`, error);
      return false;
    }
  }
  /**
   * Remove an item from storage
   * @param key Storage key
   */
  removeItem(key) {
    if (!this.storage) return false;
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[tide-api] Failed to remove item "${key}" from storage:`, error);
      return false;
    }
  }
  /**
   * Clear all items from storage
   */
  clear() {
    if (!this.storage) return false;
    try {
      this.storage.clear();
      return true;
    } catch (error) {
      console.warn("[tide-api] Failed to clear storage:", error);
      return false;
    }
  }
  /**
   * Get and parse JSON from storage
   * @param key Storage key
   * @returns Parsed object or null
   */
  getJSON(key) {
    const value = this.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn(`[tide-api] Failed to parse JSON for key "${key}":`, error);
      return null;
    }
  }
  /**
   * Stringify and set JSON in storage
   * @param key Storage key
   * @param value Object to store
   */
  setJSON(key, value) {
    try {
      const json = JSON.stringify(value);
      return this.setItem(key, json);
    } catch (error) {
      console.warn(`[tide-api] Failed to stringify JSON for key "${key}":`, error);
      return false;
    }
  }
};

// src/core/RequestBuilder.ts
var RequestBuilder = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Build a request context from endpoint and options
   * @param endpoint The endpoint name
   * @param options The request options
   * @returns RequestContext
   */
  async build(endpoint, options) {
    const method = options.method || "GET";
    const baseUrl = options.baseUrl || this.config.baseUrl;
    const path = this.buildPath(endpoint, options);
    let url = joinUrl(baseUrl, path);
    if (method === "GET" && options.params) {
      const query = stringifyQuery(options.params);
      if (query) {
        url += `?${query}`;
      }
    }
    const headers = await this.buildHeaders(options);
    const body = this.buildBody(method, options);
    return {
      url,
      method,
      headers,
      body,
      signal: options.signal,
      meta: options.meta || {}
    };
  }
  /**
   * Build the URL path from endpoint and options
   */
  buildPath(endpoint, options) {
    if (options.path) {
      const nameToPath2 = this.config.nameToPath || defaultNameToPath;
      const basePath = nameToPath2(endpoint);
      return joinUrl(basePath, options.path);
    }
    const nameToPath = this.config.nameToPath || defaultNameToPath;
    let path = nameToPath(endpoint);
    if (options.id) {
      path = joinUrl(path, String(options.id));
    }
    return path;
  }
  /**
   * Build request headers
   */
  async buildHeaders(options) {
    let defaultHeaders = {};
    if (this.config.headers) {
      if (typeof this.config.headers === "function") {
        const result = this.config.headers();
        defaultHeaders = result instanceof Promise ? await result : result;
      } else if (this.config.headers instanceof Headers) {
        const obj = {};
        this.config.headers.forEach((value, key) => {
          obj[key] = value;
        });
        defaultHeaders = obj;
      } else {
        defaultHeaders = this.config.headers;
      }
    }
    if (!options.files && !defaultHeaders["Content-Type"] && !defaultHeaders["content-type"]) {
      defaultHeaders["Content-Type"] = "application/json";
    }
    return mergeHeaders(defaultHeaders, options.headers);
  }
  /**
   * Build request body
   */
  buildBody(method, options) {
    if (method === "GET" || method === "HEAD") {
      return void 0;
    }
    if (options.files) {
      return this.buildFormData(options);
    }
    if (options.params) {
      return JSON.stringify(options.params);
    }
    return void 0;
  }
  /**
   * Build FormData for file uploads
   */
  buildFormData(options) {
    const formData = new FormData();
    if (options.params) {
      formData.append("data", JSON.stringify(options.params));
    }
    if (options.files) {
      if (options.files instanceof File) {
        formData.append("file", options.files);
      } else if (Array.isArray(options.files)) {
        options.files.forEach((file) => {
          formData.append("files[]", file);
        });
      } else {
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
};

// src/types/ApiError.ts
var ApiError = class _ApiError extends Error {
  // Parsed error body if JSON
  constructor(options) {
    super(options.message);
    this.name = "ApiError";
    this.method = options.method;
    this.url = options.url;
    this.status = options.status;
    this.statusText = options.statusText;
    this.response = options.response;
    this.data = options.data;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _ApiError);
    }
  }
  /**
   * Check if error is a 4xx client error
   */
  is4xx() {
    return this.status ? this.status >= 400 && this.status < 500 : false;
  }
  /**
   * Check if error is a 5xx server error
   */
  is5xx() {
    return this.status ? this.status >= 500 && this.status < 600 : false;
  }
  /**
   * Check if error is a network error (no status code)
   */
  isNetworkError() {
    return !this.status;
  }
  /**
   * Check if error is unauthorized (401)
   */
  isUnauthorized() {
    return this.status === 401;
  }
  /**
   * Check if error is forbidden (403)
   */
  isForbidden() {
    return this.status === 403;
  }
  /**
   * Check if error is not found (404)
   */
  isNotFound() {
    return this.status === 404;
  }
};

// src/core/ErrorHandler.ts
var ErrorHandler = class {
  /**
   * Handle an error and convert it to an ApiError
   * @param error The original error
   * @param endpoint The endpoint name
   * @param options The request options
   * @returns ApiError instance
   */
  handle(error, endpoint, options) {
    if (error instanceof ApiError) {
      return error;
    }
    if (error instanceof Error) {
      return new ApiError({
        message: error.message,
        method: options.method || "GET",
        url: endpoint
      });
    }
    return new ApiError({
      message: "An unknown error occurred",
      method: options.method || "GET",
      url: endpoint,
      data: error
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
  async fromResponse(response, method, url, data) {
    const message = `HTTP ${response.status}: ${response.statusText}`;
    let errorData = data;
    if (!errorData && response.headers.get("content-type")?.includes("application/json")) {
      try {
        errorData = await response.clone().json();
      } catch {
      }
    }
    return new ApiError({
      message,
      method,
      url,
      status: response.status,
      statusText: response.statusText,
      response,
      data: errorData
    });
  }
};

// src/core/ResponseHandler.ts
var ResponseHandler = class {
  constructor(config) {
    this.config = config;
    this.errorHandler = new ErrorHandler();
  }
  /**
   * Handle a fetch Response and convert it to ApiResponse
   * @param response The fetch Response
   * @param context The request context
   * @returns ApiResponse
   */
  async handle(response, context) {
    if (response.status >= 400) {
      const data2 = await this.parseResponseData(response);
      throw await this.errorHandler.fromResponse(response, context.method, context.url, data2);
    }
    const data = await this.parseResponseData(response);
    const transformedData = this.config.responseTransformer ? this.config.responseTransformer(data, response) : data;
    return {
      data: transformedData,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      raw: response
    };
  }
  /**
   * Parse response data based on content type
   */
  async parseResponseData(response) {
    if (response.status === 204 || response.status === 205) {
      return void 0;
    }
    const contentType = response.headers.get("content-type") || "";
    if (this.config.parseJSON && contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch (error) {
        if (this.config.debug) {
          console.warn("[tide-api] Failed to parse JSON response:", error);
        }
        return await response.text();
      }
    }
    if (contentType.includes("text/")) {
      return await response.text();
    }
    if (contentType.includes("application/octet-stream") || contentType.includes("application/pdf")) {
      return await response.blob();
    }
    try {
      return await response.json();
    } catch {
      return await response.text();
    }
  }
};

// src/core/EndpointResolver.ts
var EndpointResolver = class _EndpointResolver {
  /**
   * Create a Proxy handler for the ApiClient
   * @param client The ApiClient instance
   * @returns ProxyHandler
   */
  static createHandler(client) {
    return {
      get(target, prop) {
        if (typeof prop === "symbol" || prop in target) {
          return target[prop];
        }
        const propName = prop;
        const endpoint = target.getEndpoint(propName);
        if (target.getConfig().strictMode && !endpoint) {
          throw new Error(`Endpoint '${propName}' is not defined in the API configuration`);
        }
        if (target["endpointCache"].has(propName)) {
          return target["endpointCache"].get(propName);
        }
        const endpointMethods = _EndpointResolver.createEndpointMethods(client, propName, endpoint);
        target["endpointCache"].set(propName, endpointMethods);
        return endpointMethods;
      }
    };
  }
  /**
   * Create methods for an endpoint
   */
  static createEndpointMethods(client, endpointName, endpoint) {
    const methods = {};
    const preventDefault = typeof endpoint === "object" && endpoint.preventDefaultMethods;
    if (!preventDefault) {
      methods.get = async (options) => {
        const response = await client.request(endpointName, {
          ...options,
          method: "GET"
        });
        return response.data;
      };
      methods.create = async (options) => {
        const response = await client.request(endpointName, {
          ...options,
          method: "POST"
        });
        return response.data;
      };
      methods.update = async (options) => {
        if (!options?.id) {
          throw new Error(`update() requires an 'id' in options`);
        }
        const response = await client.request(endpointName, {
          ...options,
          method: "PUT"
        });
        return response.data;
      };
      methods.delete = async (options) => {
        if (!options?.id) {
          throw new Error(`delete() requires an 'id' in options`);
        }
        const response = await client.request(endpointName, {
          ...options,
          method: "DELETE"
        });
        return response.data;
      };
      methods.custom = async (options) => {
        if (!options?.path) {
          throw new Error(`custom() requires a 'path' in options`);
        }
        const response = await client.request(endpointName, options);
        return response.data;
      };
    }
    if (typeof endpoint === "object" && endpoint.customMethods) {
      for (const [name, method] of Object.entries(endpoint.customMethods)) {
        methods[name] = method.bind(client);
      }
    }
    return methods;
  }
};

// src/core/ApiClient.ts
var ApiClient = class {
  constructor(config) {
    if (!config.baseUrl) {
      throw new Error("ApiClient requires a baseUrl in the configuration");
    }
    this.config = this.mergeWithDefaults(config);
    this.requestBuilder = new RequestBuilder(this.config);
    this.responseHandler = new ResponseHandler(this.config);
    this.errorHandler = new ErrorHandler();
    this.interceptorChain = new InterceptorChain(
      this.config.requestInterceptors,
      this.config.responseInterceptors
    );
    this.plugins = this.config.plugins || [];
    void this.initializePlugins();
    this.endpointCache = /* @__PURE__ */ new Map();
    return new Proxy(this, EndpointResolver.createHandler(this));
  }
  /**
   * Core request method - all requests go through here
   * @param endpoint The endpoint name
   * @param options Request options
   * @returns ApiResponse with typed data
   */
  async request(endpoint, options = {}) {
    try {
      if (this.config.debug) {
        console.log(`[tide-api] Building request for endpoint: ${endpoint}`, options);
      }
      const requestContext = await this.requestBuilder.build(endpoint, options);
      const modifiedContext = await this.interceptorChain.executeRequest(requestContext);
      await this.notifyPlugins("onRequest", modifiedContext);
      if (this.config.debug) {
        console.log(`[tide-api] \u2192 ${modifiedContext.method} ${modifiedContext.url}`);
      }
      const response = await this.config.transport.execute(modifiedContext);
      const apiResponse = await this.responseHandler.handle(
        response,
        modifiedContext
      );
      const responseContext = {
        request: modifiedContext,
        response: apiResponse.raw,
        data: apiResponse.data,
        meta: modifiedContext.meta
      };
      await this.interceptorChain.executeResponse(responseContext);
      await this.notifyPlugins("onResponse", responseContext);
      if (this.config.debug) {
        console.log(`[tide-api] \u2190 ${response.status} ${response.statusText}`, apiResponse.data);
      }
      return apiResponse;
    } catch (error) {
      const apiError = this.errorHandler.handle(error, endpoint, options);
      if (this.config.debug) {
        console.error(`[tide-api] \u2717 Error:`, apiError);
      }
      await this.notifyPlugins("onError", apiError);
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
  getEndpoint(name) {
    return this.config.endpoints?.find(
      (ep) => typeof ep === "string" ? ep === name : ep.name === name
    );
  }
  /**
   * Update configuration at runtime
   * @param updates Partial configuration to merge
   */
  setConfig(updates) {
    this.config = { ...this.config, ...updates };
    this.requestBuilder = new RequestBuilder(this.config);
    this.responseHandler = new ResponseHandler(this.config);
    this.endpointCache.clear();
  }
  /**
   * Update headers at runtime
   * @param headers Headers to merge with existing headers
   */
  setHeaders(headers) {
    const existingHeaders = typeof this.config.headers === "function" ? this.config.headers() : this.config.headers || {};
    const existing = existingHeaders instanceof Promise ? {} : existingHeaders;
    this.config.headers = {
      ...existing instanceof Headers ? {} : existing,
      ...headers
    };
  }
  /**
   * Get current configuration (readonly)
   * @returns Current configuration
   */
  getConfig() {
    return this.config;
  }
  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor) {
    if (interceptor) {
      this.interceptorChain.addRequestInterceptor(interceptor);
    }
  }
  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor) {
    if (interceptor) {
      this.interceptorChain.addResponseInterceptor(interceptor);
    }
  }
  /**
   * Add a plugin
   */
  async addPlugin(plugin) {
    this.plugins.push(plugin);
    if (plugin.onInit) {
      await plugin.onInit(this);
    }
  }
  /**
   * Cleanup method - destroys plugins and clears caches
   */
  async destroy() {
    await this.notifyPlugins("onDestroy");
    this.endpointCache.clear();
    this.interceptorChain.clearAll();
  }
  // Private methods
  /**
   * Merge user config with defaults
   */
  mergeWithDefaults(config) {
    return {
      baseUrl: config.baseUrl,
      endpoints: config.endpoints || [],
      strictMode: config.strictMode ?? false,
      // v2 default: false
      headers: config.headers || {},
      credentials: config.credentials || "omit",
      requestInterceptors: config.requestInterceptors || [],
      responseInterceptors: config.responseInterceptors || [],
      plugins: config.plugins || [],
      transport: config.transport || new FetchTransport(),
      parseJSON: config.parseJSON ?? true,
      responseTransformer: config.responseTransformer,
      onError: config.onError,
      nameToPath: config.nameToPath || defaultNameToPath,
      debug: config.debug || false
    };
  }
  /**
   * Initialize all plugins
   */
  async initializePlugins() {
    for (const plugin of this.plugins) {
      if (plugin.onInit) {
        await plugin.onInit(this);
      }
    }
  }
  /**
   * Notify all plugins of a lifecycle event
   */
  async notifyPlugins(hook, ...args) {
    for (const plugin of this.plugins) {
      const hookFn = plugin[hook];
      if (hookFn && typeof hookFn === "function") {
        await hookFn.call(plugin, ...args);
      }
    }
  }
};

// src/factory.ts
function createApiClient(config) {
  return new ApiClient(config);
}

export { ApiClient, ApiError, FetchTransport, InterceptorChain, MockTransport, StorageAdapter, camelToSnake, createApiClient, defaultNameToPath, joinUrl, parseQuery, stringifyQuery };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map