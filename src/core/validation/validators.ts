/**
 * Validation functions for InstanceJSON
 */

import { instanceSchema } from './instanceSchema';
import type { InstanceJSON } from '../schema';

export interface ValidationError {
  type: 'VALIDATION' | 'NAMING' | 'REFERENCE' | 'PERFORMANCE';
  message: string;
  path?: string;
  fix?: () => void;
}

/**
 * Validate instance against Zod schema
 */
export function validateInstance(data: unknown): InstanceJSON {
  return instanceSchema.parse(data) as InstanceJSON;
}

/**
 * Safe validation that returns errors instead of throwing
 */
export function validateInstanceSafe(data: unknown): {
  success: boolean;
  data?: InstanceJSON;
  errors?: ValidationError[];
} {
  const result = instanceSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as InstanceJSON };
  }

  const errors: ValidationError[] = result.error.errors.map((err) => ({
    type: 'VALIDATION',
    message: err.message,
    path: err.path.join('.'),
  }));

  return { success: false, errors };
}

/**
 * Validate naming conventions
 */
export function validateNamingConventions(instance: InstanceJSON): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check component names are PascalCase
  instance.components.forEach((component) => {
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(component.name)) {
      errors.push({
        type: 'NAMING',
        message: `Component "${component.name}" must be PascalCase (e.g., "UserProfile")`,
        path: `components.${component.id}.name`,
        fix: () => {
          component.name = toPascalCase(component.name);
        },
      });
    }
  });

  // Check folder names are kebab-case
  instance.folders.forEach((folder) => {
    if (!/^[a-z0-9-]+$/.test(folder.name)) {
      errors.push({
        type: 'NAMING',
        message: `Folder "${folder.name}" must be kebab-case (e.g., "user-profile")`,
        path: `folders.${folder.id}.name`,
        fix: () => {
          folder.name = toKebabCase(folder.name);
        },
      });
    }
  });

  // Check service names are camelCase
  instance.services.forEach((service) => {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(service.name)) {
      errors.push({
        type: 'NAMING',
        message: `Service "${service.name}" must be camelCase (e.g., "userService")`,
        path: `services.${service.id}.name`,
        fix: () => {
          service.name = toCamelCase(service.name);
        },
      });
    }
  });

  // Check context names are PascalCase and end with "Context"
  instance.contexts.forEach((context) => {
    if (!/^[A-Z][a-zA-Z0-9]*Context$/.test(context.name)) {
      errors.push({
        type: 'NAMING',
        message: `Context "${context.name}" must be PascalCase and end with "Context" (e.g., "UserContext")`,
        path: `contexts.${context.id}.name`,
        fix: () => {
          let name = toPascalCase(context.name);
          if (!name.endsWith('Context')) {
            name += 'Context';
          }
          context.name = name;
        },
      });
    }
  });

  return errors;
}

/**
 * Validate references (IDs exist and are valid)
 */
export function validateReferences(instance: InstanceJSON): ValidationError[] {
  const errors: ValidationError[] = [];

  const componentIds = new Set(instance.components.map((c) => c.id));
  const folderIds = new Set(instance.folders.map((f) => f.id));
  const contextIds = new Set(instance.contexts.map((c) => c.id));

  // Check component parentId references valid folders
  instance.components.forEach((component) => {
    if (component.parentId && !folderIds.has(component.parentId)) {
      errors.push({
        type: 'REFERENCE',
        message: `Component "${component.name}" references non-existent folder "${component.parentId}"`,
        path: `components.${component.id}.parentId`,
      });
    }

    // Check context references
    component.consumesContexts?.forEach((contextId) => {
      if (!contextIds.has(contextId)) {
        errors.push({
          type: 'REFERENCE',
          message: `Component "${component.name}" references non-existent context "${contextId}"`,
          path: `components.${component.id}.consumesContexts`,
        });
      }
    });
  });

  // Check rootComponentId exists
  if (instance.appSpec.rootComponentId && !componentIds.has(instance.appSpec.rootComponentId)) {
    errors.push({
      type: 'REFERENCE',
      message: `Root component ID "${instance.appSpec.rootComponentId}" does not exist`,
      path: 'appSpec.rootComponentId',
    });
  }

  return errors;
}

/**
 * Validate performance limits
 */
export function validatePerformanceLimits(instance: InstanceJSON): ValidationError[] {
  const errors: ValidationError[] = [];

  // Max 500 components
  if (instance.components.length > 500) {
    errors.push({
      type: 'PERFORMANCE',
      message: `Too many components: ${instance.components.length} (max 500)`,
      path: 'components',
    });
  }

  // Max 50 contexts
  if (instance.contexts.length > 50) {
    errors.push({
      type: 'PERFORMANCE',
      message: `Too many contexts: ${instance.contexts.length} (max 50)`,
      path: 'contexts',
    });
  }

  // Check component tree depth
  const maxDepth = getMaxTreeDepth(instance);
  if (maxDepth > 10) {
    errors.push({
      type: 'PERFORMANCE',
      message: `Component tree too deep: ${maxDepth} levels (max 10)`,
      path: 'components',
    });
  }

  // Check JSON size (approx)
  const jsonSize = JSON.stringify(instance).length;
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (jsonSize > maxSize) {
    errors.push({
      type: 'PERFORMANCE',
      message: `Instance too large: ${(jsonSize / 1024 / 1024).toFixed(2)}MB (max 5MB)`,
      path: 'root',
    });
  }

  return errors;
}

/**
 * Helper: Get max tree depth
 */
function getMaxTreeDepth(instance: InstanceJSON): number {
  const childrenMap = new Map<string, string[]>();

  // Build parent-child map
  instance.components.forEach((component) => {
    if (component.parentId) {
      if (!childrenMap.has(component.parentId)) {
        childrenMap.set(component.parentId, []);
      }
      childrenMap.get(component.parentId)!.push(component.id);
    }
  });

  function getDepth(nodeId: string, currentDepth: number): number {
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      return currentDepth;
    }
    return Math.max(...children.map((childId) => getDepth(childId, currentDepth + 1)));
  }

  // Start from root level components (no parentId)
  const rootComponents = instance.components.filter((c) => !c.parentId);
  return Math.max(...rootComponents.map((c) => getDepth(c.id, 1)), 0);
}

/**
 * Helper: Convert to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[a-z]/, (chr) => chr.toUpperCase());
}

/**
 * Helper: Convert to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');
}

/**
 * Helper: Convert to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
}
