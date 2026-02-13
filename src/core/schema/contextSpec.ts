/**
 * Context specification types
 * React Context for global state management
 */

export interface ContextSpec {
  id: string;
  name: string; // PascalCase (e.g., "UserContext")
  shape: ContextShape[];
  defaultValue: Record<string, any>;
  mockValue?: Record<string, any>; // For preview
  description?: string;
}

export interface ContextShape {
  name: string;
  type: string; // TypeScript type
  description?: string;
}
