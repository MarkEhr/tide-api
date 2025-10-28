import type { Transport } from './Transport';
import type { RequestContext } from '../interceptors';

/**
 * Default transport implementation using the Fetch API
 */
export class FetchTransport implements Transport {
  async execute(context: RequestContext): Promise<Response> {
    const { url, method, headers, body, signal } = context;

    const response = await fetch(url, {
      method,
      headers,
      body,
      signal,
    });

    return response;
  }
}
