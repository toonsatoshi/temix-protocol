import { PipelineContext, StageResult, CanonicalState } from '@temix/types';
import { ConstraintsEngine } from '@temix/constraints-engine';

export class Stage3Validation {
  async execute(context: PipelineContext, projectContext: CanonicalState): Promise<StageResult<void>> {
    if (!context.resolution) {
      return {
        status: 'failure',
        issueCard: {
          violationType: 'internal_error',
          constraintId: 'missing_resolution',
          humanReadableMessage: 'Internal error: Resolution missing from context in Stage 3.'
        }
      };
    }

    const validation = ConstraintsEngine.validate(
      context.resolution,
      projectContext.jus,
      context.safetyModeEnabled
    );

    if (validation.status === 'hard_block') {
      return {
        status: 'failure',
        issueCard: validation.issues[0] || {
          violationType: 'deterministic',
          constraintId: 'validation_hard_block',
          humanReadableMessage: 'Deterministic constraint violation.'
        }
      };
    }

    // Warnings are acknowledged but not blocked for now unless safety mode is on (which is handled in ConstraintsEngine)
    return { status: 'success' };
  }
}
