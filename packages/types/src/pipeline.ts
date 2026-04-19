import { MutationEvent } from './events';
import { JUSEntry } from './jus';

export type PipelineStatus =
  | 'idle'
  | 'processing'
  | 'committed'
  | 'rejected'
  | 'awaiting_audit'
  | 'failed';

export type ViolationType =
  | 'opcode_uniqueness'
  | 'serialization_limit'
  | 'type_consistency'
  | 'gas_safety'
  | 'bounce_logic'
  | 'reentrancy'
  | 'internal_error'
  | 'parser_error'
  | 'timeout';

export interface IssueCard {
  id: string;
  projectId: string;
  violationType: ViolationType;
  severity: 'warn' | 'block';
  message: string;
  details?: any;
}

export interface ResolutionOutput {
  tactDelta: { path: string; content: string }[];
  jusEntry: JUSEntry | null;
  isPartial: boolean;
  reason?: string;
}

export interface PipelineInput {
  projectId: string;
  userId: string;
  command?: string;
  manualResolution?: ResolutionOutput;
  auditSessionId?: string;
}

export type PipelineResult =
  | { status: 'committed'; event: MutationEvent }
  | { status: 'rejected'; issueCard: IssueCard }
  | { status: 'awaiting_audit'; auditSessionId: string };

export interface PipelineContext {
  id: string;
  projectId: string;
  userId: string;
  status: PipelineStatus;
  input: PipelineInput;
  prompt?: string;
  resolution?: ResolutionOutput;
  auditSessionId?: string;
  event?: MutationEvent;
  issueCard?: IssueCard;
  timestamp: number;
}
