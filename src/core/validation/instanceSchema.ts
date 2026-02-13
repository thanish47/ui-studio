/**
 * Zod schema for InstanceJSON validation
 */

import { z } from 'zod';
import { appSpecSchema } from './appSpecSchema';
import { folderSpecSchema } from './folderSpecSchema';
import { componentSpecSchema } from './componentSpecSchema';
import { serviceSpecSchema } from './serviceSpecSchema';
import { contextSpecSchema } from './contextSpecSchema';

export const mockDataSchema = z.object({
  components: z.record(z.object({
    props: z.record(z.any()).optional(),
    state: z.record(z.any()).optional(),
  })),
  services: z.record(z.record(z.any())),
  contexts: z.record(z.any()),
});

export const instanceSchema = z.object({
  id: z.string().uuid(),
  schemaVersion: z.number().int().positive(),
  name: z.string().min(1).max(100),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  appSpec: appSpecSchema,
  folders: z.array(folderSpecSchema),
  components: z.array(componentSpecSchema),
  services: z.array(serviceSpecSchema),
  contexts: z.array(contextSpecSchema),
  mocks: mockDataSchema,
});
