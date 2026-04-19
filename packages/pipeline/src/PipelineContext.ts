import { PipelineContext, PipelineInput, PipelineStatus } from '@temix/types';

export class PipelineContextImpl implements PipelineContext {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly input: PipelineInput;
  readonly safetyModeEnabled: boolean;

  status: PipelineStatus = 'idle';
  resolution?: any;
  issueCard?: any;
  event?: any;
  auditSessionId?: string;

  constructor(input: PipelineInput) {
    this.id = Math.random().toString(36).substring(7);
    this.projectId = input.projectId;
    this.userId = input.userId;
    this.input = input;
    this.safetyModeEnabled = input.safetyModeEnabled ?? true;
  }
}
