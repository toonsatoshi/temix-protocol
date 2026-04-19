import { 
  PipelineContext, 
  StageResult, 
  MutationEvent,
  MutationPayload
} from '@temix/types';
import { EventLog } from '@temix/event-log';

export class Stage4Commit {
  /**
   * "Seals" the validated resolution into the project's Event Log (FM-01).
   * Once committed, the change is immutable and cryptographically linked.
   */
  async execute(
    context: PipelineContext
  ): Promise<StageResult<MutationEvent>> {
    if (!context.resolution) {
      return {
        status: 'failure',
        issueCard: {
          violationType: 'internal_error',
          constraintId: 'missing_resolution',
          humanReadableMessage: 'No resolution available to commit.'
        }
      };
    }

    try {
      const tactPayload: MutationPayload = {
        type: 'tact_delta',
        path: context.resolution.tactDelta.path,
        delta: context.resolution.tactDelta.delta,
        description: `AI-generated Tact change for: ${context.input.content.substring(0, 50)}...`
      };

      const jusPayload: MutationPayload = {
        type: 'jus_entry',
        entry: context.resolution.jusEntry
      };

      const payload: MutationPayload = {
        type: 'batch',
        events: [tactPayload, jusPayload]
      };

      // Atomic Commit to the Event Log
      const event = await EventLog.append(context.projectId, payload);

      // If we have a JUS entry, we might want to append it as a second event 
      // or have it part of the same payload. The whitepaper suggests atomic co-commitment.
      // Let's assume for now the Materializer handles both from the context 
      // or we append a second event.
      
      // Update: Stage 4 Commit is defined as "Sealing the event".
      // We'll return the committed event.
      
      return {
        status: 'success',
        output: event
      };
    } catch (error: any) {
      return {
        status: 'failure',
        issueCard: {
          violationType: 'internal_error',
          constraintId: 'commit_failed',
          humanReadableMessage: `Failed to commit to event log: ${error.message}`
        }
      };
    }
  }
}
