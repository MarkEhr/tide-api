import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchTransport } from '../../../src';
import type { RequestContext } from '../../../src';

describe('FetchTransport', () => {
  let transport: FetchTransport;

  beforeEach(() => {
    transport = new FetchTransport();
    global.fetch = vi.fn();
  });

  it('should execute a fetch request', async () => {
    const mockResponse = new Response('{"data": "test"}', { status: 200 });
    (global.fetch as any).mockResolvedValue(mockResponse);

    const context: RequestContext = {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      meta: {},
    };

    const response = await transport.execute(context);

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/users', {
      method: 'GET',
      headers: context.headers,
      body: undefined,
      signal: undefined,
    });
    expect(response).toBe(mockResponse);
  });

  it('should pass request body', async () => {
    const mockResponse = new Response('{"data": "test"}', { status: 201 });
    (global.fetch as any).mockResolvedValue(mockResponse);

    const body = JSON.stringify({ name: 'John' });
    const context: RequestContext = {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body,
      meta: {},
    };

    await transport.execute(context);

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/users', {
      method: 'POST',
      headers: context.headers,
      body,
      signal: undefined,
    });
  });

  it('should pass abort signal', async () => {
    const mockResponse = new Response('{"data": "test"}', { status: 200 });
    (global.fetch as any).mockResolvedValue(mockResponse);

    const controller = new AbortController();
    const context: RequestContext = {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: new Headers(),
      signal: controller.signal,
      meta: {},
    };

    await transport.execute(context);

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/users', {
      method: 'GET',
      headers: context.headers,
      body: undefined,
      signal: controller.signal,
    });
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Network error');
    (global.fetch as any).mockRejectedValue(error);

    const context: RequestContext = {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: new Headers(),
      meta: {},
    };

    await expect(transport.execute(context)).rejects.toThrow('Network error');
  });
});
