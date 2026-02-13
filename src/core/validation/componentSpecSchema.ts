/**
 * Zod schema for ComponentSpecJSON validation
 */

import { z } from 'zod';
import { uiBlockSchema } from './uiBlockSchema';

export const propDefSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  defaultValue: z.any().optional(),
  description: z.string().optional(),
});

export const paramDefSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
});

export const eventDefSchema = z.object({
  name: z.string().min(1),
  handler: z.string().min(1),
  params: z.array(paramDefSchema).optional(),
});

export const stateDefSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  initialValue: z.any(),
  description: z.string().optional(),
});

export const dataSourceConfigSchema = z.object({
  type: z.enum(['service', 'context', 'props']),
  source: z.string().min(1),
  method: z.string().optional(),
  transform: z.string().optional(),
});

export const componentSpecSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  parentId: z.string().optional(),
  props: z.array(propDefSchema),
  events: z.array(eventDefSchema).optional(),
  localState: z.array(stateDefSchema).optional(),
  consumesContexts: z.array(z.string()).optional(),
  ui: z.array(uiBlockSchema),
  dataSource: dataSourceConfigSchema.optional(),
  testLevel: z.enum(['none', 'smoke', 'full']).optional(),
});
