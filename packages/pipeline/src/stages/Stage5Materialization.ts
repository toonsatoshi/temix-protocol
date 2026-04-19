import { 
  PipelineContext, 
  StageResult, 
  CanonicalState,
  MutationEvent
} from '@temix/types';
import { Materializer } from '@temix/materializer';
import { EventLog } from '@temix/event-log';

export class Stage5Materialization {
  private materializer: Materializer;

  constructor(baseDir?: string) {
    this.materializer = new Materializer(baseDir);
  }

  /**
   * Translates the event log into the physical file tree (FM-01).
   * Ensures synchronization invariant between Source of Truth and Reality.
   */
  async execute(
    context: PipelineContext
  ): Promise<StageResult<CanonicalState>> {
    try {
      // 1. Replay the complete log for this project
      const events = EventLog.replay(context.projectId);

      // 2. Materialize to File System
      const state = await this.materializer.materialize(context.projectId, events);

      // 3. Post-Condition Check: Verify Head Hash
      // If we just committed an event, the materialized state's head must match it.
      console.log(`[Stage 5] State Head Hash: ${state.eventLogHead}`);
      if (context.event) {
        console.log(`[Stage 5] Context Event Hash: ${context.event.hash}`);
      }
      
      if (context.event && state.eventLogHead !== context.event.hash) {
        return {
          status: 'failure',
          issueCard: {
            violationType: 'internal_error',
            constraintId: 'materialization_divergence',
            humanReadableMessage: 'Materialized state hash does not match committed event hash.'
          }
        };
      }

      return {
        status: 'success',
        output: state
      };
    } catch (error: any) {
      return {
        status: 'failure',
        issueCard: {
          violationType: 'internal_error',
          constraintId: 'materialization_failed',
          humanReadableMessage: `Materialization failed: ${error.message}`
        }
      };
    }
  }
}
