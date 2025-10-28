import { describe, it, expect } from 'vitest';
import { createHeaders, mergeHeaders, headersToObject } from '../../../src/utils/headers';

describe('headers', () => {
  describe('createHeaders', () => {
    it('should create Headers from plain object', () => {
      const headers = createHeaders({ 'Content-Type': 'application/json' });
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should create empty Headers from undefined', () => {
      const headers = createHeaders();
      expect(Array.from(headers.keys()).length).toBe(0);
    });

    it('should clone existing Headers', () => {
      const original = new Headers({ 'Content-Type': 'application/json' });
      const cloned = createHeaders(original);
      expect(cloned.get('Content-Type')).toBe('application/json');
      expect(cloned).not.toBe(original);
    });

    it('should handle function input', () => {
      const headers = createHeaders(() => ({ 'Content-Type': 'application/json' }));
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('mergeHeaders', () => {
    it('should merge multiple header sources', () => {
      const merged = mergeHeaders(
        { 'Content-Type': 'application/json' },
        { Authorization: 'Bearer token' }
      );
      expect(merged.get('Content-Type')).toBe('application/json');
      expect(merged.get('Authorization')).toBe('Bearer token');
    });

    it('should override earlier values with later ones', () => {
      const merged = mergeHeaders(
        { 'Content-Type': 'application/json' },
        { 'Content-Type': 'text/plain' }
      );
      expect(merged.get('Content-Type')).toBe('text/plain');
    });

    it('should handle undefined sources', () => {
      const merged = mergeHeaders({ 'Content-Type': 'application/json' }, undefined, {
        Authorization: 'Bearer token',
      });
      expect(merged.get('Content-Type')).toBe('application/json');
      expect(merged.get('Authorization')).toBe('Bearer token');
    });

    it('should merge Headers objects', () => {
      const headers1 = new Headers({ 'Content-Type': 'application/json' });
      const headers2 = new Headers({ Authorization: 'Bearer token' });
      const merged = mergeHeaders(headers1, headers2);
      expect(merged.get('Content-Type')).toBe('application/json');
      expect(merged.get('Authorization')).toBe('Bearer token');
    });

    it('should handle empty merge', () => {
      const merged = mergeHeaders();
      expect(Array.from(merged.keys()).length).toBe(0);
    });
  });

  describe('headersToObject', () => {
    it('should convert Headers to plain object', () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      });
      const obj = headersToObject(headers);
      expect(obj).toEqual({
        'content-type': 'application/json',
        authorization: 'Bearer token',
      });
    });

    it('should handle empty Headers', () => {
      const headers = new Headers();
      const obj = headersToObject(headers);
      expect(obj).toEqual({});
    });
  });
});
