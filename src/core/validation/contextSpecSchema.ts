/**
 * Zod schema for ContextSpec validation
 */

import { z } from 'zod';

export const contextShapeSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
});

export const contextSpecSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).regex(/^[A-Z][a-zA-Z0-9]*Context$/, {
    message: 'Context name must be PascalCase and end with "Context"',
  }),
  shape: z.array(contextShapeSchema),
  defaultValue: z.record(z.any()),
  mockValue: z.record(z.any()).optional(),
  description: z.string().optional(),
});
