import type { Plugin } from './Plugin';
import type { RequestContext } from '../interceptors';
import type { ApiClient } from '../core';
import { StorageAdapter } from '../utils';

/**
 * Configuration for the AuthPlugin
 */
export interface AuthPluginConfig {
  /** Key to use for storing the token */
  tokenKey?: string;

  /** Storage type ('localStorage' or 'sessionStorage') - creates StorageAdapter if provided */
  storageType?: 'localStorage' | 'sessionStorage';

  /** Custom storage adapter - if not provided and no storageType, uses in-memory storage */
  storage?: StorageAdapter;

  /** Header name to use for the auth token */
  headerName?: string;

  /** Token prefix (e.g., 'Bearer') - set to empty string for no prefix */
  tokenPrefix?: string;

  /** Function to get the token (overrides storage) */
  getToken?: () => string | null | Promise<string | null>;

  /** Function to set the token (overrides storage) */
  setToken?: (token: string) => void | Promise<void>;

  /** Function to clear the token (overrides storage) */
  clearToken?: () => void | Promise<void>;
}

/**
 * Internal config with required fields
 */
interface AuthPluginInternalConfig {
  tokenKey: string;
  storageType: 'localStorage' | 'sessionStorage';
  storage?: StorageAdapter;
  headerName: string;
  tokenPrefix: string;
  getToken: () => string | null | Promise<string | null>;
  setToken: (token: string) => void | Promise<void>;
  clearToken: () => void | Promise<void>;
}

/**
 * Plugin for handling authentication tokens
 * Automatically adds Authorization headers to requests
 */
export class AuthPlugin implements Plugin {
  readonly name = 'AuthPlugin';

  private config: AuthPluginInternalConfig;
  private readonly storage?: StorageAdapter;
  private client?: ApiClient;
  private memoryToken: string | null = null; // In-memory token storage (default)

  constructor(config: AuthPluginConfig = {}) {
    // Only create storage adapter if explicitly requested
    const storage = config.storage ||
      (config.storageType ? new StorageAdapter(config.storageType) : undefined);

    this.config = {
      tokenKey: config.tokenKey || 'tide_api_token',
      storageType: config.storageType || 'localStorage',
      storage,
      headerName: config.headerName || 'Authorization',
      tokenPrefix: config.tokenPrefix !== undefined ? config.tokenPrefix : 'Bearer',
      getToken: config.getToken || this.defaultGetToken.bind(this),
      setToken: config.setToken || this.defaultSetToken.bind(this),
      clearToken: config.clearToken || this.defaultClearToken.bind(this),
    };

    this.storage = storage;
  }

  /**
   * Default getToken: use storage if available, otherwise in-memory
   */
  private async defaultGetToken(): Promise<string | null> {
    if (this.storage) {
      return this.storage.getItem(this.config.tokenKey);
    }
    return this.memoryToken;
  }

  /**
   * Default setToken: use storage if available, otherwise in-memory
   */
  private async defaultSetToken(token: string): Promise<void> {
    if (this.storage) {
      this.storage.setItem(this.config.tokenKey, token);
    } else {
      this.memoryToken = token;
    }
  }

  /**
   * Default clearToken: use storage if available, otherwise in-memory
   */
  private async defaultClearToken(): Promise<void> {
    if (this.storage) {
      this.storage.removeItem(this.config.tokenKey);
    } else {
      this.memoryToken = null;
    }
  }

  /**
   * Initialize the plugin
   */
  async onInit(client: ApiClient): Promise<void> {
    this.client = client;

    // Load token from storage on init
    const token = await this.getToken();
    if (token) {
      this.setAuthHeader(token);
    }
  }

  /**
   * Add Authorization header to requests
   */
  async onRequest(context: RequestContext): Promise<void> {
    const token = await this.getToken();
    if (token && !context.headers.has(this.config.headerName)) {
      const value = this.config.tokenPrefix && this.config.tokenPrefix.length > 0
        ? `${this.config.tokenPrefix} ${token}`
        : token;
      context.headers.set(this.config.headerName, value);
    }
  }

  /**
   * Get the current token
   */
  async getToken(): Promise<string | null> {
    return this.config.getToken();
  }

  /**
   * Set a new token
   */
  async setToken(token: string): Promise<void> {
    await this.config.setToken(token);

    // Update client headers if client is initialized
    if (this.client) {
      this.setAuthHeader(token);
    }
  }

  /**
   * Clear the current token
   */
  async clearToken(): Promise<void> {
    await this.config.clearToken();

    // Clear auth header from client
    if (this.client) {
      this.setAuthHeader(null);
    }
  }

  /**
   * Check if a token exists
   */
  async hasToken(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  /**
   * Update the client's auth header
   */
  private setAuthHeader(token: string | null): void {
    if (!this.client) return;

    if (token) {
      const value = this.config.tokenPrefix && this.config.tokenPrefix.length > 0
        ? `${this.config.tokenPrefix} ${token}`
        : token;
      this.client.setHeaders({
        [this.config.headerName]: value,
      });
    } else {
      // Remove auth header by setting it to empty
      this.client.setHeaders({
        [this.config.headerName]: '',
      });
    }
  }
}
