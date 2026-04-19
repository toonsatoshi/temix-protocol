import { MutationEvent, MutationPayload } from './events';
import { JUSEntry, PartialJUSEntry } from './jus';

export type PipelineStatus =
  | 'idle'
  | 'processing'
  | 'committed'
  | 'rejected'
  | 'awaiting_audit'
  | 'failed';

export interface IssueCard {
  violationType: 'deterministic' | 'heuristic' | 'internal_error';
  constraintId: string;
  humanReadableMessage: string;
  affectedField?: string;
  suggestedCorrection?: string;
}

export interface ResolutionOutput {
  tactDelta: { path: string; delta: string };
  jusEntry: JUSEntry;
}

export interface PartialResolution {
  tactDelta?: { path: string; delta: string };
  partialJusEntry: PartialJUSEntry;
}

export interface PipelineInput {
  projectId: string;
  userId: string;
  type: 'declarative' | 'direct';
  content: string; // The natural language intent or direct code
  safetyModeEnabled?: boolean;
  auditSessionId?: string; // For Resumption from Stage 2-B
}

export interface ResolutionAuditRequest {
  auditSessionId: string;
  partialResolution: PartialResolution;
}

export type PipelineResult =
  | { status: 'committed'; event: MutationEvent }
  | { status: 'rejected'; issueCard: IssueCard }
  | { status: 'awaiting_audit'; auditSessionId: string };

export interface StageResult<T> {
  status: 'success' | 'failure' | 'branch';
  output?: T;
  issueCard?: IssueCard;
  auditRequest?: ResolutionAuditRequest;
}

export interface PipelineContext {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly input: PipelineInput;
  readonly safetyModeEnabled: boolean;
  
  // Accumulated state
  resolution?: ResolutionOutput;
  issueCard?: IssueCard;
  event?: MutationEvent;
  auditSessionId?: string;
  
  status: PipelineStatus;
}
