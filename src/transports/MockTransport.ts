import type { Transport } from './Transport';
import type { RequestContext } from '../interceptors';

/**
 * Mock transport for testing
 * Allows simulating responses without making real HTTP requests
 */
export class MockTransport implements Transport {
  private mockResponses: Map<string, Response> = new Map();
  private defaultResponse: Response | null = null;

  /**
   * Set a mock response for a specific URL pattern
   * @param pattern URL pattern (can be regex string or exact match)
   * @param response The mock Response to return
   */
  setMockResponse(pattern: string | RegExp, response: Response): void {
    const key = pattern instanceof RegExp ? pattern.source : pattern;
    this.mockResponses.set(key, response);
  }

  /**
   * Set a default mock response for unmatched URLs
   * @param response The default Response to return
   */
  setDefaultResponse(response: Response): void {
    this.defaultResponse = response;
  }

  /**
   * Clear all mock responses
   */
  clear(): void {
    this.mockResponses.clear();
    this.defaultResponse = null;
  }

  async execute(context: RequestContext): Promise<Response> {
    const { url } = context;

    // Try to find a matching mock response
    for (const [pattern, response] of this.mockResponses.entries()) {
      const regex = new RegExp(pattern);
      if (regex.test(url)) {
        return response.clone(); // Clone to allow multiple reads
      }
    }

    // Return default response if set
    if (this.defaultResponse) {
      return this.defaultResponse.clone();
    }

    // No mock found, return 404
    return new Response(JSON.stringify({ error: 'No mock response configured' }), {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
