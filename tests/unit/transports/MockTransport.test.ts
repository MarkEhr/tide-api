import { describe, it, expect, beforeEach } from 'vitest';
import { MockTransport } from '../../../src';
import type { RequestContext } from '../../../src';

describe('MockTransport', () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = new MockTransport();
  });

  it('should return mock response for exact URL match', async () => {
    const mockResponse = new Response('{"data": "test"}', { status: 200 });
    transport.setMockResponse('https://api.example.com/users', mockResponse);

    const context: RequestContext = {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: new Headers(),
      meta: {},
    };

    const response = await transport.execute(context);
    const data = await response.json();
    expect(data).toEqual({ data: 'test' });
  });

  it('should return mock response for regex match', async () => {
    const mockResponse = new Response('{"data": "test"}', { status: 200 });
    transport.setMockResponse(/\/users\/\d+/, mockResponse);

    const context: RequestContext = {
      url: 'https://api.example.com/users/123',
      method: 'GET',
      headers: new Headers(),
      meta: {},
    };

    const response = await transport.execute(context);
    const data = await response.json();
    expect(data).toEqual({ data: 'test' });
  });

  it('should return default response when no match found', async () => {
    const defaultResponse = new Response('{"error": "default"}', { status: 404 });
    transport.setDefaultResponse(defaultResponse);

    const context: RequestContext = {
      url: 'https://api.example.com/unknown',
      method: 'GET',
      headers: new Headers(),
      meta: {},
    };

    const response = await transport.execute(context);
    const data = await response.json();
    expect(data).toEqual({ error: 'default' });
  });

  it('should return 404 when no mock and no default configured', async () => {
    const context: RequestContext = {
      url: 'https://api.example.com/unknown',
      method: 'GET',
      headers: new Headers(),
      meta: {},
    };

    const response = await transport.execute(context);
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'No mock response configured' });
  });

  it('should clear all mocks', async () => {
    const mockResponse = new Response('{"data": "test"}', { status: 200 });
    transport.setMockResponse('https://api.example.com/users', mockResponse);
    transport.setDefaultResponse(mockResponse);

    transport.clear();

    const context: RequestContext = {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: new Headers(),
      meta: {},
    };

    const response = await transport.execute(context);
    expect(response.status).toBe(404);
  });

  it('should allow multiple reads of the same response', async () => {
    const mockResponse = new Response('{"data": "test"}', { status: 200 });
    transport.setMockResponse('https://api.example.com/users', mockResponse);

    const context: RequestContext = {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: new Headers(),
      meta: {},
    };

    const response1 = await transport.execute(context);
    const data1 = await response1.json();

    const response2 = await transport.execute(context);
    const data2 = await response2.json();

    expect(data1).toEqual({ data: 'test' });
    expect(data2).toEqual({ data: 'test' });
  });
});
