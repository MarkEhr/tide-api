import { describe, it, expect } from 'vitest';
import { stringifyQuery, parseQuery } from '../../../src/utils/queryString';

describe('queryString', () => {
  describe('stringifyQuery', () => {
    it('should stringify simple object', () => {
      expect(stringifyQuery({ name: 'John', age: 30 })).toBe('name=John&age=30');
    });

    it('should handle array values with brackets', () => {
      const result = stringifyQuery({ ids: [1, 2, 3] });
      expect(result).toBe('ids%5B%5D=1&ids%5B%5D=2&ids%5B%5D=3');
    });

    it('should handle nested objects', () => {
      const result = stringifyQuery({ filter: { name: 'John', age: 30 } });
      expect(result).toBe('filter%5Bname%5D=John&filter%5Bage%5D=30');
    });

    it('should skip null and undefined values', () => {
      expect(stringifyQuery({ name: 'John', age: null, city: undefined })).toBe('name=John');
    });

    it('should handle empty object', () => {
      expect(stringifyQuery({})).toBe('');
    });

    it('should convert values to strings', () => {
      expect(stringifyQuery({ active: true, count: 42 })).toBe('active=true&count=42');
    });

    it('should skip null values in arrays', () => {
      const result = stringifyQuery({ ids: [1, null, 3] });
      expect(result).toBe('ids%5B%5D=1&ids%5B%5D=3');
    });
  });

  describe('parseQuery', () => {
    it('should parse simple query string', () => {
      expect(parseQuery('name=John&age=30')).toEqual({ name: 'John', age: '30' });
    });

    it('should parse query string with leading question mark', () => {
      expect(parseQuery('?name=John&age=30')).toEqual({ name: 'John', age: '30' });
    });

    it('should parse array notation', () => {
      expect(parseQuery('ids[]=1&ids[]=2&ids[]=3')).toEqual({ ids: ['1', '2', '3'] });
    });

    it('should parse object notation', () => {
      expect(parseQuery('filter[name]=John&filter[age]=30')).toEqual({
        filter: { name: 'John', age: '30' },
      });
    });

    it('should handle empty query string', () => {
      expect(parseQuery('')).toEqual({});
    });

    it('should handle malformed object notation', () => {
      // Invalid bracket notation should be treated as regular key
      expect(parseQuery('filter[incomplete')).toEqual({ 'filter[incomplete': '' });
    });
  });
});
