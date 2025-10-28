/**
 * Joins URL parts together, handling slashes correctly
 * @param parts URL parts to join
 * @returns Joined URL
 */
export function joinUrl(...parts: string[]): string {
  return parts
    .map((part, index) => {
      // Remove leading slashes except for the first part
      if (index !== 0) {
        part = part.replace(/^\/+/, '');
      }
      // Remove trailing slashes except for the last part
      if (index !== parts.length - 1) {
        part = part.replace(/\/+$/, '');
      }
      return part;
    })
    .filter((part) => part.length > 0)
    .join('/');
}

/**
 * Converts camelCase to snake_case
 * @param str String in camelCase
 * @returns String in snake_case
 * @example 'userProfile' -> 'user_profile'
 */
export function camelToSnake(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Default nameToPath function
 * Converts endpoint names to URL paths
 */
export const defaultNameToPath = camelToSnake;
