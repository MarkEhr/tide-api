/**
 * Public types for tide-api
 */

export { ApiError } from './ApiError';
export type { ApiResponse } from './ApiResponse';
export type { RequestOptions } from './RequestOptions';
export type {
  HttpMethod,
  SimpleEndpoint,
  ObjectEndpoint,
  EndpointDefinition,
  EndpointMethod,
  BaseEndpointConfig,
} from './EndpointDefinition';
export type {
  ApiConfig,
  Plugin,
  RequestInterceptor,
  ResponseInterceptor,
  Transport,
} from './ApiConfig';
export type {
  ExtractEndpointName,
  ExtractEndpointNames,
  EndpointMethodsFor,
  EndpointsMap,
  TypedApiClient,
} from './EndpointTypes';
