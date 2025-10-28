/**
 * Creates a Headers object from a plain object or existing Headers
 * @param input Plain object, Headers, or undefined
 * @returns Headers object
 */
export function createHeaders(
  input?: Record<string, string> | Headers | (() => Record<string, string>)
): Headers {
  if (!input) {
    return new Headers();
  }

  if (input instanceof Headers) {
    return new Headers(input);
  }

  if (typeof input === 'function') {
    return new Headers(input());
  }

  return new Headers(input);
}

/**
 * Merges multiple header sources, with later sources overriding earlier ones
 * @param sources Header sources to merge
 * @returns Merged Headers object
 */
export function mergeHeaders(...sources: (Record<string, string> | Headers | undefined)[]): Headers {
  const merged = new Headers();

  for (const source of sources) {
    if (!source) continue;

    if (source instanceof Headers) {
      source.forEach((value, key) => {
        merged.set(key, value);
      });
    } else {
      Object.entries(source).forEach(([key, value]) => {
        merged.set(key, value);
      });
    }
  }

  return merged;
}

/**
 * Converts Headers object to plain object
 * @param headers Headers object
 * @returns Plain object
 */
export function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}
