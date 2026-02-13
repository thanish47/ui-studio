/**
 * Application specification types
 */

export interface AppSpecJSON {
  name: string;
  layout: 'single-page' | 'routed';
  routing?: RoutingConfig;
  contexts?: string[]; // Context IDs
  errorBoundary?: ErrorBoundaryConfig;
  theme?: ThemeConfig;
  testStrategy: 'all' | 'entry-points-only';
  rootComponentId?: string; // ID of the root component for routing
  routes?: RouteConfig[]; // Route definitions for routed apps
}

export interface RoutingConfig {
  type: 'hash' | 'browser';
  basename?: string;
}

export interface RouteConfig {
  path: string;
  component: string; // Component name
}

export interface ErrorBoundaryConfig {
  enabled: boolean;
  fallbackComponent?: string;
}

export interface ThemeConfig {
  primaryColor?: string;
  fontFamily?: string;
  spacing?: 'compact' | 'normal' | 'relaxed';
}
