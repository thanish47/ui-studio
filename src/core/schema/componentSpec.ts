/**
 * Component specification types
 */

import type { UIBlock } from './uiBlock';

export interface ComponentSpecJSON {
  id: string;
  name: string;
  parentId?: string; // Optional parent folder ID for feature organization
  props: PropDef[];
  events?: EventDef[];
  localState?: StateDef[];
  consumesContexts?: string[]; // Context IDs
  ui: UIBlock[];
  dataSource?: DataSourceConfig;
  testLevel?: 'none' | 'smoke' | 'full';
}

export interface PropDef {
  name: string;
  type: string; // TypeScript type as string (e.g., "string", "number", "User[]")
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface EventDef {
  name: string; // Prop name (e.g., "onClick")
  handler: string; // Handler function name (e.g., "handleClick")
  params?: ParamDef[];
}

export interface ParamDef {
  name: string;
  type: string;
}

export interface StateDef {
  name: string;
  type: string;
  initialValue: any;
  description?: string;
}

export interface DataSourceConfig {
  type: 'service' | 'context' | 'props';
  source: string; // Service ID, Context ID, or prop name
  method?: string; // For service type
  transform?: string; // Optional transformation expression
}
