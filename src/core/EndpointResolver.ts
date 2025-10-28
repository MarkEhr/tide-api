import type { EndpointDefinition, RequestOptions } from '../types';
import type { ApiClient } from './ApiClient';

/**
 * Endpoint methods interface
 * All methods are required (not optional) since they are always created by the Proxy
 */
export interface EndpointMethods {
  get<TResponse = unknown>(options?: RequestOptions): Promise<TResponse>;
  create<TResponse = unknown>(options?: RequestOptions): Promise<TResponse>;
  update<TResponse = unknown>(options?: RequestOptions): Promise<TResponse>;
  delete<TResponse = unknown>(options?: RequestOptions): Promise<TResponse>;
  [key: string]: unknown;
}

/**
 * Handles dynamic endpoint resolution via Proxy
 */
export class EndpointResolver {
  /**
   * Create a Proxy handler for the ApiClient
   * @param client The ApiClient instance
   * @returns ProxyHandler
   */
  static createHandler(client: ApiClient): ProxyHandler<ApiClient> {
    return {
      get(target: ApiClient, prop: string | symbol): unknown {
        // Return real properties of the client
        if (typeof prop === 'symbol' || prop in target) {
          return target[prop as keyof ApiClient];
        }

        const propName = prop as string;

        // Check if endpoint is defined in config
        const endpoint = target.getEndpoint(propName);

        // Strict mode: throw error if endpoint not defined
        if (target.getConfig().strictMode && !endpoint) {
          throw new Error(`Endpoint '${propName}' is not defined in the API configuration`);
        }

        // Check endpoint cache
        if (target['endpointCache'].has(propName)) {
          return target['endpointCache'].get(propName);
        }

        // Generate endpoint methods
        const endpointMethods = EndpointResolver.createEndpointMethods(client, propName, endpoint);

        // Cache the endpoint methods
        target['endpointCache'].set(propName, endpointMethods);

        return endpointMethods;
      },
    };
  }

  /**
   * Create methods for an endpoint
   */
  private static createEndpointMethods(
    client: ApiClient,
    endpointName: string,
    endpoint?: EndpointDefinition
  ): EndpointMethods {
    const methods = {} as Record<string, unknown>;

    // Check if we should prevent default methods
    const preventDefault = typeof endpoint === 'object' && endpoint.preventDefaultMethods;

    // Generate default CRUD methods if not prevented
    if (!preventDefault) {
      // GET method
      methods.get = async <TResponse = unknown>(options?: RequestOptions): Promise<TResponse> => {
        const response = await client.request<TResponse>(endpointName, {
          ...options,
          method: 'GET',
        });
        return response.data;
      };

      // CREATE method (POST)
      methods.create = async <TResponse = unknown>(options?: RequestOptions): Promise<TResponse> => {
        const response = await client.request<TResponse>(endpointName, {
          ...options,
          method: 'POST',
        });
        return response.data;
      };

      // UPDATE method (PUT)
      methods.update = async <TResponse = unknown>(options?: RequestOptions): Promise<TResponse> => {
        if (!options?.id) {
          throw new Error(`update() requires an 'id' in options`);
        }
        const response = await client.request<TResponse>(endpointName, {
          ...options,
          method: 'PUT',
        });
        return response.data;
      };

      // DELETE method
      methods.delete = async <TResponse = unknown>(options?: RequestOptions): Promise<TResponse> => {
        if (!options?.id) {
          throw new Error(`delete() requires an 'id' in options`);
        }
        const response = await client.request<TResponse>(endpointName, {
          ...options,
          method: 'DELETE',
        });
        return response.data;
      };

      // CUSTOM method for arbitrary paths
      methods.custom = async <TResponse = unknown>(options?: RequestOptions): Promise<TResponse> => {
        if (!options?.path) {
          throw new Error(`custom() requires a 'path' in options`);
        }
        const response = await client.request<TResponse>(endpointName, options);
        return response.data;
      };
    }

    // Add custom methods from endpoint definition
    if (typeof endpoint === 'object' && endpoint.customMethods) {
      for (const [name, method] of Object.entries(endpoint.customMethods)) {
        // Bind the method to the client instance
        methods[name] = method.bind(client);
      }
    }

    return methods as EndpointMethods;
  }
}
