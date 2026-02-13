/**
 * Service specification types
 */

export interface ServiceSpecJSON {
  id: string;
  name: string;
  type: 'http' | 'storage' | 'custom';
  http?: HttpConfig;
  storage?: StorageConfig;
  methods: MethodDef[];
  mockBehavior?: 'static' | 'dynamic';
}

export interface HttpConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
  auth?: AuthConfig;
}

export interface AuthConfig {
  type: 'bearer' | 'basic' | 'api-key';
  tokenSource?: 'localStorage' | 'context';
  tokenKey?: string;
}

export interface StorageConfig {
  type: 'localStorage' | 'indexedDB' | 'sessionStorage';
  key: string;
}

export interface MethodDef {
  name: string;
  params: MethodParamDef[];
  returns: string; // TypeScript return type
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint?: string; // For HTTP services
  description?: string;
}

export interface MethodParamDef {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
}
