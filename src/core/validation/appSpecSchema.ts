/**
 * Zod schema for AppSpecJSON validation
 */

import { z } from 'zod';

export const routingConfigSchema = z.object({
  type: z.enum(['hash', 'browser']),
  basename: z.string().optional(),
});

export const routeConfigSchema = z.object({
  path: z.string(),
  component: z.string(),
});

export const errorBoundaryConfigSchema = z.object({
  enabled: z.boolean(),
  fallbackComponent: z.string().optional(),
});

export const themeConfigSchema = z.object({
  primaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  spacing: z.enum(['compact', 'normal', 'relaxed']).optional(),
});

export const appSpecSchema = z.object({
  name: z.string().min(1).max(100),
  layout: z.enum(['single-page', 'routed']),
  routing: routingConfigSchema.optional(),
  contexts: z.array(z.string()).optional(),
  errorBoundary: errorBoundaryConfigSchema.optional(),
  theme: themeConfigSchema.optional(),
  testStrategy: z.enum(['all', 'entry-points-only']),
  rootComponentId: z.string().optional(),
  routes: z.array(routeConfigSchema).optional(),
});
