/**
 * Serializes an object to a query string
 * @param params Object to serialize
 * @returns Query string (without leading '?')
 */
export function stringifyQuery(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return; // Skip null/undefined values
    }

    if (Array.isArray(value)) {
      // Handle arrays: key[]=value1&key[]=value2
      value.forEach((item) => {
        if (item !== null && item !== undefined) {
          searchParams.append(`${key}[]`, String(item));
        }
      });
    } else if (typeof value === 'object') {
      // Handle nested objects: key[subkey]=value
      Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
        if (subValue !== null && subValue !== undefined) {
          searchParams.append(`${key}[${subKey}]`, String(subValue));
        }
      });
    } else {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

/**
 * Parses a query string to an object
 * @param queryString Query string to parse (with or without leading '?')
 * @returns Parsed object
 */
export function parseQuery(queryString: string): Record<string, unknown> {
  const params = new URLSearchParams(queryString.replace(/^\?/, ''));
  const result: Record<string, unknown> = {};

  params.forEach((value, key) => {
    // Handle array notation: key[]
    if (key.endsWith('[]')) {
      const arrayKey = key.slice(0, -2);
      if (!result[arrayKey]) {
        result[arrayKey] = [];
      }
      (result[arrayKey] as unknown[]).push(value);
    }
    // Handle object notation: key[subkey]
    else if (key.includes('[') && key.includes(']')) {
      const matches = key.match(/^([^[]+)\[([^\]]+)\]$/);
      if (matches && matches[1] && matches[2]) {
        const objectKey = matches[1];
        const subKey = matches[2];
        if (!result[objectKey]) {
          result[objectKey] = {};
        }
        (result[objectKey] as Record<string, unknown>)[subKey] = value;
      }
    } else {
      result[key] = value;
    }
  });

  return result;
}
