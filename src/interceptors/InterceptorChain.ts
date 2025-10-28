import type { RequestInterceptor, RequestContext } from './RequestInterceptor';
import type { ResponseInterceptor, ResponseContext } from './ResponseInterceptor';
import type { ApiError } from '../types';

/**
 * Manages the execution of request and response interceptors
 */
export class InterceptorChain {
  private requestInterceptors: RequestInterceptor[];
  private responseInterceptors: ResponseInterceptor[];

  constructor(
    requestInterceptors: RequestInterceptor[] = [],
    responseInterceptors: ResponseInterceptor[] = []
  ) {
    this.requestInterceptors = [...requestInterceptors];
    this.responseInterceptors = [...responseInterceptors];
  }

  /**
   * Execute all request interceptors in sequence
   * @param context The initial request context
   * @returns The modified request context
   */
  async executeRequest(context: RequestContext): Promise<RequestContext> {
    let modifiedContext = context;

    for (const interceptor of this.requestInterceptors) {
      try {
        modifiedContext = await interceptor.onRequest(modifiedContext);
      } catch (error) {
        if (interceptor.onRequestError) {
          await interceptor.onRequestError(error as Error);
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
  async executeResponse<TData>(
    context: ResponseContext<TData>
  ): Promise<ResponseContext<TData>> {
    let modifiedContext = context;

    for (const interceptor of this.responseInterceptors) {
      try {
        modifiedContext = await interceptor.onResponse(modifiedContext);
      } catch (error) {
        if (interceptor.onResponseError) {
          await interceptor.onResponseError(error as ApiError);
        }
        throw error;
      }
    }

    return modifiedContext;
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Remove a request interceptor by name
   */
  removeRequestInterceptor(name: string): boolean {
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
  removeResponseInterceptor(name: string): boolean {
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
  clearAll(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }
}
