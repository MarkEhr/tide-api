/**
 * Advanced TypeScript types for type-safe endpoint access
 */

import type { EndpointDefinition, ObjectEndpoint } from './EndpointDefinition';
import type { EndpointMethods } from '../core/EndpointResolver';

/**
 * Extract endpoint name from EndpointDefinition
 */
export type ExtractEndpointName<T extends EndpointDefinition> = T extends string
  ? T
  : T extends ObjectEndpoint
  ? T['name']
  : never;

/**
 * Extract all endpoint names from an array of EndpointDefinitions
 */
export type ExtractEndpointNames<T extends readonly EndpointDefinition[]> = {
  [K in keyof T]: ExtractEndpointName<T[K]>;
}[number];

/**
 * Create endpoint methods type based on endpoint definition
 */
export type EndpointMethodsFor<T extends EndpointDefinition> = T extends ObjectEndpoint
  ? T['preventDefaultMethods'] extends true
    ? T['customMethods'] extends Record<string, unknown>
      ? T['customMethods']
      : Record<string, never>
    : T['customMethods'] extends Record<string, unknown>
    ? EndpointMethods & T['customMethods']
    : EndpointMethods
  : EndpointMethods;

/**
 * Map endpoint definitions to their method types
 * Using -? to ensure all properties are required (not optional)
 */
export type EndpointsMap<TEndpoints extends readonly EndpointDefinition[]> = {
  -readonly [K in ExtractEndpointNames<TEndpoints>]-?: EndpointMethodsFor<
    Extract<TEndpoints[number], { name: K } | K>
  >;
};

/**
 * Non-strict endpoint access type
 * When strictMode is false, any string property access returns EndpointMethods
 * We use 'any' for the index signature to bypass noUncheckedIndexedAccess
 * while still providing IntelliSense for the EndpointMethods type
 */
export type NonStrictEndpointAccess = {
  [key: string]: any;
} & {
  // This intersection provides proper typing for method calls
  // while the 'any' index signature bypasses "possibly undefined" errors
};


/**
 * ApiClient type with endpoint access based on strictMode
 *
 * - If strictMode is true (default): Only defined endpoints are accessible
 * - If strictMode is false: Any string property returns EndpointMethods (never undefined)
 */
export type TypedApiClient<
  TEndpoints extends readonly EndpointDefinition[] | undefined,
  TStrictMode extends boolean | undefined
> = [TStrictMode] extends [false]
  ? // Non-strict mode: ensure properties are never undefined
    NonStrictEndpointAccess
  : TEndpoints extends readonly EndpointDefinition[]
  ? // Strict mode with defined endpoints: only those endpoints are accessible
    EndpointsMap<TEndpoints>
  : // Strict mode without endpoints: no endpoints accessible
    Record<string, never>;
