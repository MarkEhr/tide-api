import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler } from '../../../src/core/ErrorHandler';
import { ApiError } from '../../../src/types';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = new ErrorHandler();
  });

  describe('handle', () => {
    it('should return ApiError as-is', () => {
      const apiError = new ApiError({
        message: 'Test error',
        method: 'GET',
        url: '/users',
        status: 404,
      });

      const result = handler.handle(apiError, 'users', { method: 'GET' });
      expect(result).toBe(apiError);
    });

    it('should convert Error to ApiError', () => {
      const error = new Error('Network error');
      const result = handler.handle(error, 'users', { method: 'GET' });

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('Network error');
      expect(result.method).toBe('GET');
      expect(result.url).toBe('users');
    });

    it('should handle unknown error types', () => {
      const result = handler.handle('unknown error', 'users', { method: 'POST' });

      expect(result).toBeInstanceOf(ApiError);
      expect(result.message).toBe('An unknown error occurred');
      expect(result.method).toBe('POST');
      expect(result.url).toBe('users');
      expect(result.data).toBe('unknown error');
    });

    it('should use default GET method if not provided', () => {
      const error = new Error('Test');
      const result = handler.handle(error, 'users', {});

      expect(result.method).toBe('GET');
    });
  });

  describe('fromResponse', () => {
    it('should create ApiError from Response', async () => {
      const response = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });

      const error = await handler.fromResponse(response, 'GET', '/users');

      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('HTTP 404: Not Found');
      expect(error.status).toBe(404);
      expect(error.statusText).toBe('Not Found');
      expect(error.method).toBe('GET');
      expect(error.url).toBe('/users');
      expect(error.response).toBe(response);
    });

    it('should parse JSON error data', async () => {
      const errorData = { error: 'Invalid request', code: 'INVALID' };
      const response = new Response(JSON.stringify(errorData), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'application/json' },
      });

      const error = await handler.fromResponse(response, 'POST', '/users');

      expect(error.data).toEqual(errorData);
    });

    it('should handle non-JSON responses', async () => {
      const response = new Response('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'content-type': 'text/plain' },
      });

      const error = await handler.fromResponse(response, 'GET', '/users');

      expect(error.status).toBe(500);
      expect(error.data).toBeUndefined();
    });

    it('should use provided data parameter', async () => {
      const response = new Response('', { status: 400 });
      const customData = { error: 'Custom error' };

      const error = await handler.fromResponse(response, 'POST', '/users', customData);

      expect(error.data).toBe(customData);
    });
  });
});
