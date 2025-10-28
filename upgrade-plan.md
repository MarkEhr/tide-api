# Tide API v2.0.0 - TypeScript Rewrite Plan

## Executive Summary

Complete rewrite of tide-api from JavaScript to TypeScript with modern architecture, better type safety, and improved extensibility. The core proxy-based dynamic API access pattern (`api.users.get()`) is preserved while adding compile-time type safety and plugin-based extensibility.

---

## Current Implementation Analysis (v1.8.1)

### Architecture Overview

The v1 library is built around a single `Api` class using **ES6 Proxy** to dynamically intercept property access and generate endpoint methods at runtime.

**Request Flow:**
```
new Api(config)
  → constructor merges config with defaults (api-core.js:79)
  → initializes storage/cache/queue managers (lines 115-122)
  → loads persisted state from localStorage (lines 138-148)
  → returns Proxy wrapper (line 153)

api.users.get({id: 1})
  → Proxy intercepts "users" (getProperty, line 182)
  → finds endpoint in config.endpoints (lines 186-195)
  → calls handleEndpointCall (line 352)
  → returns {get, create, update, delete, custom} methods
  → apiCall builds URL, headers, body (lines 532-582)
  → executes fetch (line 782)
  → handles response/errors (lines 665-720)
  → dispatches Redux actions (lines 611-623)
  → returns data
```

### Main Responsibilities

1. **Dynamic Endpoint Resolution** - Proxy-based lazy evaluation
2. **HTTP Request Orchestration** - URL building, fetch execution
3. **Authentication Management** - Login/logout, token storage, Bearer header injection
4. **Redux Integration** - Deeply coupled, dispatches 5+ action types
5. **Offline Support** - CacheManager and QueueManager with localStorage
6. **Form Data Handling** - Auto-converts files to FormData
7. **Configuration Flexibility** - 20+ config options with function hooks

### Technical Debt & Limitations

- Redux is tightly coupled (dispatches even when not using Redux)
- 20+ config options with unclear precedence
- No interceptor pattern (ad-hoc hooks instead)
- Weak error handling (throws raw responses)
- Storage assumptions (browser-only)
- IE11 fallback code
- Mixed concerns (service worker listener, Redux in core)
- No TypeScript support

---

## v2 Architecture Principles

### Core Philosophy

- **Inversion of Control** - Make Redux, storage, caching pluggable via dependency injection
- **Single Responsibility** - Separate HTTP transport, state management, caching, endpoint resolution
- **Type Safety** - Full generic support for request/response types
- **Extensibility** - Plugin system for cross-cutting concerns
- **Modern Standards** - Native fetch, ES modules, no legacy browser support

### Request Pipeline Design

```
Request In
  ↓
[1] Build Request (URL, headers, body)
  ↓
[2] Request Interceptors (modify/log/block request)
  ↓
[3] Transport Layer (fetch)
  ↓
[4] Response Interceptors (transform/validate response)
  ↓
[5] Error Handler (typed ApiError)
  ↓
[6] Plugins (optional side effects)
  ↓
Response Out
```

---

## Folder Structure

```
tide-api/
├── src/
│   ├── core/
│   │   ├── ApiClient.ts              # Main client class
│   │   ├── EndpointResolver.ts       # Proxy handler for dynamic endpoints
│   │   ├── RequestBuilder.ts         # Builds fetch Request objects
│   │   ├── ResponseHandler.ts        # Parses and validates responses
│   │   └── ErrorHandler.ts           # Creates typed ApiError objects
│   │
│   ├── interceptors/
│   │   ├── Interceptor.ts            # Base interceptor interface
│   │   ├── InterceptorChain.ts       # Executes interceptor pipeline
│   │   ├── RequestInterceptor.ts     # Request interceptor type
│   │   └── ResponseInterceptor.ts    # Response interceptor type
│   │
│   ├── plugins/
│   │   ├── Plugin.ts                 # Base plugin interface
│   │   ├── AuthPlugin.ts             # Token management + refresh logic
│   │   ├── CachePlugin.ts            # TODO: Request caching (future)
│   │   ├── RetryPlugin.ts            # TODO: Retry with backoff (future)
│   │   ├── QueuePlugin.ts            # TODO: Offline queue (future)
│   │   └── ReduxPlugin.ts            # Optional Redux integration
│   │
│   ├── transports/
│   │   ├── Transport.ts              # Abstract transport interface
│   │   ├── FetchTransport.ts         # Default fetch implementation
│   │   └── MockTransport.ts          # For testing
│   │
│   ├── types/
│   │   ├── ApiConfig.ts              # Main configuration interface
│   │   ├── EndpointDefinition.ts     # Endpoint config types
│   │   ├── ApiError.ts               # Typed error class
│   │   ├── ApiResponse.ts            # Generic response wrapper
│   │   ├── RequestOptions.ts         # Per-request overrides
│   │   └── index.ts                  # Re-export all types
│   │
│   ├── utils/
│   │   ├── urlBuilder.ts             # URL construction helpers
│   │   ├── queryString.ts            # Query string serialization
│   │   ├── headers.ts                # Header manipulation
│   │   └── storage.ts                # Storage adapter (localStorage/sessionStorage)
│   │
│   └── index.ts                      # Public API exports
│
├── tests/
│   ├── unit/
│   │   ├── core/
│   │   ├── interceptors/
│   │   ├── plugins/
│   │   └── utils/
│   └── integration/
│       └── ApiClient.test.ts
│
├── examples/
│   ├── basic-usage.ts
│   ├── with-auth.ts
│   ├── with-redux.ts
│   └── custom-transport.ts
│
├── legacy/                           # Old v1 code for reference
│
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
└── README.md
```

---

## Core Type Interfaces

### ApiConfig

```typescript
export interface ApiConfig {
  // Required
  baseUrl: string;

  // Endpoints
  endpoints?: EndpointDefinition[];
  strictMode?: boolean; // Default: false (v2 change)

  // Headers & Auth
  headers?: Record<string, string> | (() => Record<string, string>);
  credentials?: RequestCredentials; // 'omit' | 'same-origin' | 'include'

  // Interceptors
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];

  // Plugins
  plugins?: Plugin[];

  // Transport
  transport?: Transport; // Default: FetchTransport

  // Response Parsing
  parseJSON?: boolean; // Default: true
  responseTransformer?: <T>(data: any, response: Response) => T;

  // Error Handling
  onError?: (error: ApiError) => void;

  // Debug
  debug?: boolean; // Logs all requests/responses
}
```

### EndpointDefinition

```typescript
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface BaseEndpointConfig {
  path?: string; // Override default nameToPath conversion
  method?: HttpMethod;
  headers?: Record<string, string>;
  parseJSON?: boolean;
}

// Simple string endpoint: generates CRUD methods
export type SimpleEndpoint = string;

// Full object endpoint with custom methods
export interface ObjectEndpoint extends BaseEndpointConfig {
  name: string;
  customMethods?: Record<string, EndpointMethod<any, any>>;
  preventDefaultMethods?: boolean; // Don't generate CRUD
}

export type EndpointDefinition = SimpleEndpoint | ObjectEndpoint;

// Type for custom endpoint methods
export type EndpointMethod<TParams = any, TResponse = any> = (
  this: ApiClient,
  params?: TParams
) => Promise<TResponse>;
```

### RequestOptions

```typescript
export interface RequestOptions<TParams = any> {
  // URL building
  id?: string | number; // Appended to endpoint path
  path?: string; // Custom path override (for .custom())
  params?: TParams; // Query params (GET) or body (POST/PUT)

  // Request config
  method?: HttpMethod;
  headers?: Record<string, string>;
  files?: File | File[] | Record<string, File | File[]>;

  // Per-request overrides
  baseUrl?: string; // Override base URL
  parseJSON?: boolean;

  // Metadata (for plugins)
  meta?: Record<string, any>;
}
```

### ApiResponse

```typescript
export interface ApiResponse<TData = any> {
  data: TData;
  status: number;
  statusText: string;
  headers: Headers;
  raw: Response; // Original fetch Response
  meta?: any; // For pagination, etc.
}
```

### ApiError

```typescript
export class ApiError extends Error {
  readonly name = 'ApiError';
  readonly status?: number;
  readonly statusText?: string;
  readonly method: string;
  readonly url: string;
  readonly response?: Response;
  readonly data?: any; // Parsed error body if JSON

  constructor(options: {
    message: string;
    method: string;
    url: string;
    status?: number;
    statusText?: string;
    response?: Response;
    data?: any;
  }) {
    super(options.message);
    Object.assign(this, options);
  }

  is4xx(): boolean {
    return this.status ? this.status >= 400 && this.status < 500 : false;
  }

  is5xx(): boolean {
    return this.status ? this.status >= 500 && this.status < 600 : false;
  }

  isNetworkError(): boolean {
    return !this.status;
  }
}
```

---

## Interceptor & Plugin System

### Request Interceptor

```typescript
export interface RequestContext {
  url: string;
  method: HttpMethod;
  headers: Headers;
  body?: BodyInit;
  signal?: AbortSignal;
  meta: Record<string, any>;
}

export interface RequestInterceptor {
  name?: string;
  onRequest(context: RequestContext): RequestContext | Promise<RequestContext>;
  onRequestError?(error: Error): void | Promise<void>;
}
```

### Response Interceptor

```typescript
export interface ResponseContext<TData = any> {
  request: RequestContext;
  response: Response;
  data: TData;
  meta: Record<string, any>;
}

export interface ResponseInterceptor {
  name?: string;
  onResponse<TData>(context: ResponseContext<TData>):
    ResponseContext<TData> | Promise<ResponseContext<TData>>;
  onResponseError?(error: ApiError): void | Promise<void>;
}
```

### Plugin Interface

```typescript
export interface Plugin {
  name: string;

  // Lifecycle hooks
  onInit?(client: ApiClient): void | Promise<void>;
  onRequest?(context: RequestContext): void | Promise<void>;
  onResponse?(context: ResponseContext): void | Promise<void>;
  onError?(error: ApiError): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}
```

---

## ApiClient Core Implementation

### Key Methods

```typescript
export class ApiClient {
  constructor(config: ApiConfig) {
    // Merge with defaults
    // Initialize core components (RequestBuilder, ResponseHandler, etc.)
    // Initialize plugins
    // Return Proxy for dynamic endpoint access
  }

  async request<TResponse = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<TResponse>> {
    // 1. Build request
    // 2. Run request interceptors
    // 3. Notify plugins
    // 4. Execute transport
    // 5. Handle response
    // 6. Run response interceptors
    // 7. Notify plugins
    // 8. Error handling
  }

  getEndpoint(name: string): EndpointDefinition | undefined
  setConfig(updates: Partial<ApiConfig>): void
  setHeaders(headers: Record<string, string>): void
  getConfig(): Readonly<Required<ApiConfig>>
  async destroy(): Promise<void>
}
```

### EndpointResolver (Proxy Handler)

```typescript
export class EndpointResolver {
  static createHandler(client: ApiClient): ProxyHandler<ApiClient> {
    return {
      get(target: ApiClient, prop: string | symbol): any {
        // Return real properties first
        // Check if endpoint is defined
        // Strict mode validation
        // Generate and cache endpoint methods (get, create, update, delete, custom)
        // Merge custom methods from endpoint definition
      }
    };
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Current)
- [x] Set up TypeScript project structure
- [ ] Implement core types (ApiConfig, RequestOptions, ApiError, etc.)
- [ ] Build RequestBuilder, ResponseHandler, ErrorHandler utilities
- [ ] Create FetchTransport
- [ ] Write unit tests for utilities

### Phase 2: Core Client
- [ ] Implement ApiClient class with request pipeline
- [ ] Build EndpointResolver Proxy handler
- [ ] Implement InterceptorChain
- [ ] Write unit tests for core components
- [ ] Integration tests for basic CRUD operations

### Phase 3: Plugins (Initial)
- [ ] Implement AuthPlugin (token management, auto-refresh)
- [ ] Implement ReduxPlugin (optional Redux integration)
- [ ] Write plugin tests and examples

### Phase 4: Polish & Testing
- [ ] Comprehensive integration tests
- [ ] Examples for common use cases
- [ ] Build pipeline (ESM + CJS + type declarations)
- [ ] Performance benchmarks

### Phase 5: Documentation & Release
- [ ] Complete API documentation
- [ ] Finish comprehensive README
- [ ] Write CHANGELOG and MIGRATION_GUIDE
- [ ] Publish v2.0.0-beta
- [ ] Gather feedback, iterate, release v2.0.0

### Future Enhancements (Post v2.0.0)
- [ ] CachePlugin - Request caching with TTL
- [ ] RetryPlugin - Exponential backoff retry logic
- [ ] QueuePlugin - Offline request queue
- [ ] OpenAPI/Swagger integration
- [ ] Request batching support
- [ ] SSR/Node.js optimizations

---

## Key Improvements from v1

1. **TypeScript First** - Full type safety with generics
2. **Cleaner Configuration** - 15 essential options vs 20+ in v1
3. **Interceptor Pattern** - Replaces ad-hoc hooks
4. **Plugin Architecture** - Redux, caching optional, not core
5. **Transport Abstraction** - Swappable fetch implementation
6. **Typed Errors** - ApiError class with helper methods
7. **Immutable Config** - Explicit config updates via setConfig()
8. **No Global State** - Each ApiClient instance is independent
9. **Debug Mode** - Single flag for all logging
10. **Modern Defaults** - strictMode=false, parseJSON=true, no IE11

---

## Example Usage (v2)

```typescript
import { ApiClient } from 'tide-api';
import { AuthPlugin } from 'tide-api/plugins';

const api = new ApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: [
    'users',
    'posts',
    {
      name: 'auth',
      preventDefaultMethods: true,
      customMethods: {
        login: async function(credentials) {
          return this.request('auth/login', {
            method: 'POST',
            params: credentials
          });
        }
      }
    }
  ],
  plugins: [
    new AuthPlugin({
      tokenKey: 'auth_token',
      storage: localStorage,
      refreshEndpoint: '/auth/refresh'
    })
  ],
  requestInterceptors: [
    {
      name: 'logger',
      onRequest: (ctx) => {
        console.log(`→ ${ctx.method} ${ctx.url}`);
        return ctx;
      }
    }
  ],
  debug: true
});

// Usage
try {
  const users = await api.users.get<User[]>();
  const newUser = await api.users.create<User>({
    params: { name: 'John', email: 'john@example.com' }
  });
  await api.users.update<User>({
    id: newUser.id,
    params: { name: 'Jane' }
  });
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
  }
}
```

---

## Migration Guide (v1 → v2)

### Breaking Changes

1. **Configuration Changes:**
   - `host` → `baseUrl`
   - `reduxStore` → Use `ReduxPlugin` instead
   - `useCache`, `useQueue` → Use plugins instead (future)
   - `createHeaders` → Use `requestInterceptors` instead
   - `getDataFromResponse` → Use `responseTransformer` instead
   - `strictMode` default changed to `false`

2. **Response Format:**
   - v1 returns data directly
   - v2 returns `ApiResponse<T>` object with `.data` property
   - Use `responseTransformer` to get v1 behavior

3. **Error Handling:**
   - v1 throws raw responses
   - v2 throws typed `ApiError` objects

4. **Login/Logout:**
   - v1 has built-in `api.login()` method
   - v2 uses `AuthPlugin` or custom endpoint

### Migration Steps

1. Update imports:
   ```typescript
   // v1
   import Api from 'tide-api';

   // v2
   import { ApiClient } from 'tide-api';
   ```

2. Update configuration:
   ```typescript
   // v1
   const api = new Api({
     host: 'https://api.example.com',
     endpoints: ['users']
   });

   // v2
   const api = new ApiClient({
     baseUrl: 'https://api.example.com',
     endpoints: ['users']
   });
   ```

3. Handle response changes:
   ```typescript
   // v1
   const users = await api.users.get();

   // v2 (option 1: access .data)
   const response = await api.users.get();
   const users = response.data;

   // v2 (option 2: use responseTransformer)
   const api = new ApiClient({
     baseUrl: '...',
     responseTransformer: (data) => data // Return data directly like v1
   });
   const users = await api.users.get();
   ```

4. Migrate Redux integration:
   ```typescript
   // v1
   const api = new Api({
     host: '...',
     reduxStore: store
   });

   // v2
   import { ReduxPlugin } from 'tide-api/plugins';

   const api = new ApiClient({
     baseUrl: '...',
     plugins: [
       new ReduxPlugin({ store })
     ]
   });
   ```

5. Migrate authentication:
   ```typescript
   // v1
   await api.login(username, password);

   // v2
   import { AuthPlugin } from 'tide-api/plugins';

   const api = new ApiClient({
     baseUrl: '...',
     endpoints: [
       {
         name: 'auth',
         preventDefaultMethods: true,
         customMethods: {
           login: async function(credentials) {
             const response = await this.request('auth/login', {
               method: 'POST',
               params: credentials
             });
             // AuthPlugin will handle token storage
             return response.data;
           }
         }
       }
     ],
     plugins: [new AuthPlugin({ tokenKey: 'token' })]
   });

   await api.auth.login({ username, password });
   ```

---

## Testing Strategy

### Unit Tests
- RequestBuilder URL construction
- ResponseHandler parsing logic
- ErrorHandler error object creation
- InterceptorChain execution order
- EndpointResolver proxy behavior
- Each plugin in isolation

### Integration Tests
- Full request lifecycle
- Multiple interceptors chaining
- Plugin interaction
- Error scenarios
- Authentication flows
- Redux state updates

### Performance Tests
- Request throughput
- Memory usage with large responses
- Proxy overhead vs direct calls
- Plugin overhead measurement

---

## Build & Distribution

### Output Formats
- **ESM**: `dist/index.mjs` - Modern bundlers
- **CJS**: `dist/index.cjs` - Node.js compatibility
- **Types**: `dist/index.d.ts` - TypeScript definitions

### Package.json Exports
```json
{
  "name": "tide-api",
  "version": "2.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./plugins": {
      "import": "./dist/plugins/index.mjs",
      "require": "./dist/plugins/index.cjs",
      "types": "./dist/plugins/index.d.ts"
    }
  }
}
```

### Dependencies
- **Runtime**: None (peer dependencies only)
- **Development**: TypeScript, Jest/Vitest, ESLint, Prettier, tsup/rollup

---

## Success Metrics

### Code Quality
- 100% TypeScript strict mode
- 80%+ test coverage
- Zero ESLint errors
- Passing type checks

### Performance
- < 5KB min+gzip for core
- < 50ms initialization overhead
- Comparable or better request throughput than v1

### Developer Experience
- Clear error messages
- Comprehensive examples
- Full API documentation
- Smooth migration path from v1

---

## Risks & Mitigation

### Risk: Breaking Changes Impact
**Mitigation**: Provide v1 compatibility layer, detailed migration guide, and community support period.

### Risk: Plugin API Complexity
**Mitigation**: Start with minimal plugin surface, iterate based on real usage, provide examples.

### Risk: TypeScript Learning Curve
**Mitigation**: JavaScript users can still use the library, types are optional enhancement.

### Risk: Performance Regression
**Mitigation**: Benchmark against v1, optimize hot paths, provide performance comparison.

---

## Timeline Estimate

- **Week 1-2**: Foundation + Core Client (Phase 1-2)
- **Week 3**: Initial Plugins (Phase 3)
- **Week 4**: Testing + Polish (Phase 4)
- **Week 5**: Documentation + Beta Release (Phase 5)
- **Week 6+**: Feedback iteration, stable v2.0.0 release

Total: **4-6 weeks** to stable v2.0.0 release

---

## Conclusion

This v2 rewrite transforms tide-api from a Redux-coupled library into a modern, type-safe, extensible HTTP client while preserving the beloved proxy-based API. The plugin architecture ensures future extensibility without core bloat, and TypeScript provides the safety and developer experience modern projects demand.

**Status**: Ready to implement Phase 1 🚀