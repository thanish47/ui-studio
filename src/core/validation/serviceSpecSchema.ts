/**
 * Zod schema for ServiceSpecJSON validation
 */

import { z } from 'zod';

export const authConfigSchema = z.object({
  type: z.enum(['bearer', 'basic', 'api-key']),
  tokenSource: z.enum(['localStorage', 'context']).optional(),
  tokenKey: z.string().optional(),
});

export const httpConfigSchema = z.object({
  baseURL: z.string().url(),
  headers: z.record(z.string()).optional(),
  timeout: z.number().positive().optional(),
  auth: authConfigSchema.optional(),
});

export const storageConfigSchema = z.object({
  type: z.enum(['localStorage', 'indexedDB', 'sessionStorage']),
  key: z.string().min(1),
});

export const methodParamDefSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  defaultValue: z.any().optional(),
});

export const methodDefSchema = z.object({
  name: z.string().min(1),
  params: z.array(methodParamDefSchema),
  returns: z.string().min(1),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
  endpoint: z.string().optional(),
  description: z.string().optional(),
});

export const serviceSpecSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['http', 'storage', 'custom']),
  http: httpConfigSchema.optional(),
  storage: storageConfigSchema.optional(),
  methods: z.array(methodDefSchema),
  mockBehavior: z.enum(['static', 'dynamic']).optional(),
});
