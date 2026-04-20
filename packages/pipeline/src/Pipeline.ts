import { 
  PipelineInput, 
  PipelineResult, 
  PipelineContext, 
  CanonicalState 
} from '@temix/types';
import { PipelineContextImpl } from './PipelineContext';
import { Stage1Submission } from './stages/Stage1Submission';
import { Stage2Resolution } from './stages/Stage2Resolution';
import { Stage3Validation } from './stages/Stage3Validation';
import { Stage4Commit } from './stages/Stage4Commit';
import { Stage5Materialization } from './stages/Stage5Materialization';
import { Stage6Exposure } from './stages/Stage6Exposure';

export class Pipeline {
  private stage1 = new Stage1Submission();
  private stage2: Stage2Resolution;
  private stage3 = new Stage3Validation();
  private stage4 = new Stage4Commit();
  private stage5 = new Stage5Materialization();
  private stage6 = new Stage6Exposure();

  constructor(apiKey: string) {
    this.stage2 = new Stage2Resolution(apiKey);
  }

  /**
   * Executes the full Six-Stage Deterministic Pipeline.
   */
  async execute(
    input: PipelineInput, 
    projectContext: CanonicalState,
    onStageComplete?: (stage: string) => void
  ): Promise<PipelineResult> {
    const context = new PipelineContextImpl(input);

    try {
      // Stage 1: Submission
      if (onStageComplete) onStageComplete('Stage 1');
      const s1 = await this.stage1.execute(context);
      if (s1.status !== 'success') return this.handleRejection(s1);

      // Stage 2: Resolution
      if (onStageComplete) onStageComplete('Stage 2');
      const s2 = await this.stage2.execute(context, projectContext);
      if (s2.status === 'branch') {
        context.status = 'awaiting_audit';
        return { 
          status: 'awaiting_audit', 
          auditSessionId: context.id,
          partialResolution: s2.output as any
        };
      }
      if (s2.status !== 'success') return this.handleRejection(s2);
      context.resolution = s2.output;

      // Stage 3: Validation
      if (onStageComplete) onStageComplete('Stage 3');
      const s3 = await this.stage3.execute(context, projectContext);
      if (s3.status !== 'success') return this.handleRejection(s3);

      // Stage 4: Commit
      if (onStageComplete) onStageComplete('Stage 4');
      const s4 = await this.stage4.execute(context);
      if (s4.status !== 'success') return this.handleRejection(s4);
      context.event = s4.output;

      // Stage 5: Materialization
      if (onStageComplete) onStageComplete('Stage 5');
      const s5 = await this.stage5.execute(context);
      if (s5.status !== 'success') return this.handleRejection(s5);

      // Stage 6: Exposure
      if (onStageComplete) onStageComplete('Stage 6');
      const s6 = await this.stage6.execute(context, s5.output!);
      if (s6.status !== 'success') return this.handleRejection(s6);

      context.status = 'committed';
      return { status: 'committed', event: context.event! };

    } catch (error: any) {
      context.status = 'failed';
      return { 
        status: 'rejected', 
        issueCard: {
          violationType: 'internal_error',
          constraintId: 'pipeline_crash',
          humanReadableMessage: `Pipeline crashed: ${error.message}`
        }
      };
    }
  }

  private handleRejection(stageResult: any): PipelineResult {
    return {
      status: 'rejected',
      issueCard: stageResult.issueCard || {
        violationType: 'internal_error',
        constraintId: 'unknown_failure',
        humanReadableMessage: 'An unknown error occurred during pipeline execution.'
      }
    };
  }
}
