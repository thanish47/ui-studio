/**
 * Zod schema for FolderSpecJSON validation
 */

import { z } from 'zod';

export const folderSpecSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, {
    message: 'Folder name must be kebab-case (lowercase with hyphens)',
  }),
  description: z.string().optional(),
  barrelExport: z.boolean(),
  hasTest: z.boolean(),
});
