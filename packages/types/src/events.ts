import { JUSEntry } from './jus';

export type EventStatus = 'committed' | 'rejected';

export interface FileMod {
  path: string;
  content: string | null; // null indicates deletion
}

export interface JusMod {
  name: string;
  entry: JUSEntry | null; // null indicates deletion
}

export interface ProjectCreatePayload {
  type: 'PROJECT_CREATE';
  name: string;
  ownerId: string;
}

export interface DeltaPayload {
  type: 'DELTA';
  description?: string;
  files: FileMod[];
  jus: JusMod[];
}

export interface RollbackPayload {
  type: 'ROLLBACK';
  targetHash: string;
  reason: string;
}

export type MutationPayload =
  | ProjectCreatePayload
  | DeltaPayload
  | RollbackPayload;

export interface MutationEvent {
  id: string;
  projectId: string;
  hash: string;
  prevHash: string;
  payload: MutationPayload;
  status: EventStatus;
  timestamp: number;
}
