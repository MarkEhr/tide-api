# Type-Safe Endpoint Access Solution

## Problem

When creating an `ApiClient` with endpoints, TypeScript couldn't infer the generic type parameters from the configuration object. This resulted in IDE errors like:

```
TS2339: Property 'users' does not exist on type 'ApiClient<undefined, true>'
```

Even though the runtime behavior worked correctly (via Proxy), TypeScript didn't provide IntelliSense or type checking for endpoint access.

## Root Cause

The issue was with type inference. When you write:

```typescript
const api = new ApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users', 'posts'],
});
```

TypeScript sees `endpoints` as type `string[]` (not a readonly tuple), so it can't infer the specific endpoint names. The `ApiClient` class has generic parameters `<TEndpoints, TStrictMode>` that default to `undefined` and `true`, but these weren't being inferred from the config.

## Solution: Factory Function

We created a `createApiClient()` factory function that properly infers types from the configuration:

### 1. Created `src/factory.ts`

```typescript
export interface TypedApiConfig<
  TEndpoints extends readonly EndpointDefinition[] | undefined = undefined,
  TStrictMode extends boolean | undefined = true
> extends Omit<ApiConfig, 'endpoints' | 'strictMode'> {
  endpoints?: TEndpoints;
  strictMode?: TStrictMode;
}

export function createApiClient<
  TEndpoints extends readonly EndpointDefinition[] | undefined = undefined,
  TStrictMode extends boolean | undefined = true
>(
  config: TypedApiConfig<TEndpoints, TStrictMode>
): ApiClient<TEndpoints, TStrictMode> & TypedApiClient<TEndpoints, TStrictMode> {
  return new ApiClient<TEndpoints, TStrictMode>(config as ApiConfig) as ApiClient<TEndpoints, TStrictMode> &
    TypedApiClient<TEndpoints, TStrictMode>;
}
```

**Key Points:**
- The factory function has its own generic config interface `TypedApiConfig`
- It explicitly types the `endpoints` and `strictMode` properties as generic parameters
- **Return type is explicitly typed as the intersection** `ApiClient & TypedApiClient` to expose endpoint properties
- TypeScript can now infer `TEndpoints` and `TStrictMode` from the config object
- Type assertion ensures the return matches what the ApiClient constructor actually returns

### 2. Usage Pattern

Users must:
1. Use `createApiClient()` instead of `new ApiClient()`
2. Add `as const` to the endpoints array for type inference

```typescript
// ✅ Correct - with type inference
const api = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users', 'posts'] as const, // 'as const' is required
  strictMode: true, // optional, defaults to true
});

// Now TypeScript knows about these endpoints:
api.users.get();   // ✅ OK
api.posts.get();   // ✅ OK
api.unknown.get(); // ❌ TypeScript error (in strict mode)
```

### 3. Non-Strict Mode

In non-strict mode, any endpoint is accessible:

```typescript
const api = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users'] as const,
  strictMode: false, // Allow any endpoint
});

api.users.get();    // ✅ OK
api.anything.get(); // ✅ OK - no error in non-strict mode
```

## How It Works

### Type Inference Flow

1. **User writes code:**
   ```typescript
   const api = createApiClient({
     endpoints: ['users', 'posts'] as const,
     strictMode: true,
   });
   ```

2. **TypeScript infers:**
   ```typescript
   TEndpoints = readonly ["users", "posts"]
   TStrictMode = true
   ```

3. **Factory returns:**
   ```typescript
   ApiClient<readonly ["users", "posts"], true>
   ```

4. **ApiClient constructor returns:**
   ```typescript
   this & TypedApiClient<readonly ["users", "posts"], true>
   ```

5. **TypedApiClient expands to:**
   ```typescript
   {
     users: EndpointMethods;
     posts: EndpointMethods;
   }
   ```

6. **Final type:**
   ```typescript
   ApiClient<readonly ["users", "posts"], true> & {
     users: EndpointMethods;
     posts: EndpointMethods;
   }
   ```

### Conditional Types

The `TypedApiClient` type uses conditional logic:

```typescript
export type TypedApiClient<
  TEndpoints extends readonly EndpointDefinition[] | undefined,
  TStrictMode extends boolean | undefined
> = TStrictMode extends false
  ? Record<string, EndpointMethods>           // Non-strict: any property
  : TEndpoints extends readonly EndpointDefinition[]
  ? EndpointsMap<TEndpoints>                  // Strict: only defined endpoints
  : Record<string, never>;                     // Strict without endpoints: none
```

## Files Changed

1. **Created:**
   - `src/factory.ts` - Factory function and typed config
   - `examples/strict-typing.ts` - Comprehensive typing examples

2. **Modified:**
   - `src/index.ts` - Export factory function
   - `src/types/EndpointTypes.ts` - Advanced conditional types (from previous work)
   - `tests/integration/ApiClient.test.ts` - Use factory in tests
   - All example files - Use factory instead of constructor

## Benefits

1. **IntelliSense Support** - IDE autocompletes endpoint names
2. **Type Safety** - Compile-time errors for undefined endpoints (in strict mode)
3. **Flexibility** - Can disable strict mode for dynamic APIs
4. **No Runtime Cost** - Pure TypeScript types, zero overhead
5. **Backward Compatible** - `new ApiClient()` still works (just without inference)

## Recommendations for Users

### Recommended (with type inference):
```typescript
import { createApiClient } from 'tide-api';

const api = createApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users', 'posts'] as const,
});
```

### Still works (without type inference):
```typescript
import { ApiClient } from 'tide-api';

const api = new ApiClient({
  baseUrl: 'https://api.example.com',
  endpoints: ['users', 'posts'],
  strictMode: false, // Must use non-strict mode
});
```

## Testing

- ✅ All 110 tests pass
- ✅ TypeScript compilation successful
- ✅ Type tests verify correct behavior
- ✅ Examples demonstrate usage patterns

## Next Steps

In the README, we should:
1. Document the `createApiClient()` factory as the recommended approach
2. Show the `as const` requirement clearly
3. Explain strict vs non-strict mode
4. Provide migration guide from v1
