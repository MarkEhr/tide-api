import { describe, it, expect } from 'vitest';
import { joinUrl, camelToSnake, defaultNameToPath } from '../../../src/utils/urlBuilder';

describe('urlBuilder', () => {
  describe('joinUrl', () => {
    it('should join URL parts with single slashes', () => {
      expect(joinUrl('https://api.example.com', 'users', '123')).toBe(
        'https://api.example.com/users/123'
      );
    });

    it('should handle trailing slashes', () => {
      expect(joinUrl('https://api.example.com/', '/users/', '/123')).toBe(
        'https://api.example.com/users/123'
      );
    });

    it('should handle empty parts', () => {
      expect(joinUrl('https://api.example.com', '', 'users')).toBe(
        'https://api.example.com/users'
      );
    });

    it('should handle single part', () => {
      expect(joinUrl('https://api.example.com')).toBe('https://api.example.com');
    });

    it('should preserve protocol slashes', () => {
      expect(joinUrl('https://api.example.com', 'users')).toBe('https://api.example.com/users');
    });

    it('should handle multiple consecutive slashes', () => {
      expect(joinUrl('https://api.example.com///', '///users')).toBe(
        'https://api.example.com/users'
      );
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      expect(camelToSnake('userProfile')).toBe('user_profile');
    });

    it('should handle single word', () => {
      expect(camelToSnake('user')).toBe('user');
    });

    it('should handle multiple capital letters', () => {
      expect(camelToSnake('getUserProfile')).toBe('get_user_profile');
    });

    it('should handle consecutive capitals', () => {
      expect(camelToSnake('APIKey')).toBe('a_p_i_key');
    });

    it('should handle already snake_case', () => {
      expect(camelToSnake('user_profile')).toBe('user_profile');
    });

    it('should handle empty string', () => {
      expect(camelToSnake('')).toBe('');
    });
  });

  describe('defaultNameToPath', () => {
    it('should be an alias for camelToSnake', () => {
      expect(defaultNameToPath('userProfile')).toBe('user_profile');
      expect(defaultNameToPath).toBe(camelToSnake);
    });
  });
});
