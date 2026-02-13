/**
 * Lock types for multi-tab coordination
 */

export interface LockRecord {
  instanceId: string;
  tabId: string;
  ts: number;
}

export type LockMessage =
  | { type: 'lock_acquired'; instanceId: string; tabId: string }
  | { type: 'lock_released'; instanceId: string; tabId: string }
  | { type: 'lock_ping'; instanceId: string; tabId: string };

export interface LockStatus {
  isLocked: boolean;
  ownedByThisTab: boolean;
  lockHolder?: string; // tabId
  lockAge?: number; // milliseconds
}
