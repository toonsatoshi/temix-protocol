import { JUSEntry } from './jus';
import { DeploymentRecord } from './portal';

export type EventStatus = 'committed' | 'rejected';

export interface ProjectCreatePayload {
  type: 'project_create';
  name: string;
  ownerId: string;
}

export interface TactDeltaPayload {
  type: 'tact_delta';
  delta: string; // Unified diff format
  path: string;
  description?: string;
}

export interface JUSEntryPayload {
  type: 'jus_entry';
  entry: JUSEntry;
}

export interface ConflictResolutionPayload {
  type: 'conflict_resolution';
  resolutionType: 'ai' | 'manual';
  resolvedContent: string;
  path: string;
}

export interface DeploymentPayload {
  type: 'deployment';
  record: DeploymentRecord;
}

export interface RollbackPayload {
  type: 'rollback';
  targetHash: string;
  reason: string;
}

export type MutationPayload =
  | ProjectCreatePayload
  | TactDeltaPayload
  | JUSEntryPayload
  | ConflictResolutionPayload
  | DeploymentPayload
  | RollbackPayload;

export interface MutationEvent {
  id: string;
  projectId: string;
  hash: string;
  prevHash: string; // Use "genesis" for the first event
  payload: MutationPayload;
  status: EventStatus;
  timestamp: number;
}

/**
 * Helper for exhaustive switch checks.
 * Usage:
 * switch (payload.type) {
 *   ... cases ...
 *   default:
 *     return assertUnreachable(payload);
 * }
 */
export function assertUnreachable(x: never): never {
  throw new Error(`Unreachable case: ${JSON.stringify(x)}`);
}
