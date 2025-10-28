/**
 * Generic API response wrapper
 */
export interface ApiResponse<TData = unknown> {
  /** The parsed response data */
  data: TData;

  /** HTTP status code */
  status: number;

  /** HTTP status text */
  statusText: string;

  /** Response headers */
  headers: Headers;

  /** Original fetch Response object */
  raw: Response;

  /** Optional metadata (e.g., pagination info) */
  meta?: unknown;
}
