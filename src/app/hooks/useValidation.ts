/**
 * Hook for real-time validation
 */

import { useMemo } from 'react';
import type { InstanceJSON } from '@/core/schema';
import {
  validateNamingConventions,
  validateReferences,
  validatePerformanceLimits,
  type ValidationError,
} from '@/core/validation';

export function useValidation(instance: InstanceJSON | null) {
  // Run all validations
  const errors = useMemo(() => {
    if (!instance) return [];

    const allErrors: ValidationError[] = [
      ...validateNamingConventions(instance),
      ...validateReferences(instance),
      ...validatePerformanceLimits(instance),
    ];

    return allErrors;
  }, [instance]);

  // Group errors by type
  const errorsByType = useMemo(() => {
    const grouped: Record<string, ValidationError[]> = {
      NAMING: [],
      REFERENCE: [],
      PERFORMANCE: [],
      VALIDATION: [],
    };

    errors.forEach((error) => {
      if (!grouped[error.type]) {
        grouped[error.type] = [];
      }
      grouped[error.type].push(error);
    });

    return grouped;
  }, [errors]);

  // Check if instance is valid
  const isValid = errors.length === 0;

  // Get errors for a specific path
  const getErrorsForPath = (path: string): ValidationError[] => {
    return errors.filter((error) => error.path === path);
  };

  // Check if a specific path has errors
  const hasErrorsForPath = (path: string): boolean => {
    return getErrorsForPath(path).length > 0;
  };

  // Apply all auto-fixes
  const applyAllFixes = () => {
    errors.forEach((error) => {
      if (error.fix) {
        error.fix();
      }
    });
  };

  return {
    errors,
    errorsByType,
    isValid,
    getErrorsForPath,
    hasErrorsForPath,
    applyAllFixes,
    hasErrors: errors.length > 0,
    errorCount: errors.length,
  };
}
