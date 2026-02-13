/**
 * Folder specification types
 * Folders organize components into features
 */

export interface FolderSpecJSON {
  id: string;
  name: string; // kebab-case (e.g., "user-profile")
  description?: string;
  barrelExport: boolean; // Whether to generate index.ts
  hasTest: boolean; // Whether to generate folder-level test
}
