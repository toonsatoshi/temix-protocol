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
      // In this MVP, we assume a resolution contains one Tact delta and one JUS entry.
      // We'll commit them as a sequence or a combined event if supported.
      // For simplicity and adherence to the "One source of truth" principle, 
      // we'll use the TactDelta as the primary event for now, 
      // or implement a Batch event if needed.
      
      const payload: MutationPayload = {
        type: 'tact_delta',
        path: context.resolution.tactDelta.path,
        delta: context.resolution.tactDelta.delta,
        description: `AI-generated change from intent: ${context.input.content.substring(0, 50)}...`
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
