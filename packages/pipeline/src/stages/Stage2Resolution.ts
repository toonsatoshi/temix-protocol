import { 
  PipelineContext, 
  StageResult, 
  ResolutionOutput, 
  PartialResolution, 
  CanonicalState 
} from '@temix/types';
import { AIResolver } from '@temix/ai-engine';
import { ConstraintsEngine } from '@temix/constraints-engine';

export class Stage2Resolution {
  private aiResolver: AIResolver;

  constructor(apiKey: string) {
    this.aiResolver = new AIResolver(apiKey);
  }

  /**
   * Transforms raw developer intent into a deterministic resolution candidate.
   * Linked to the AI-proposes, Machine-disposes model (FM-01).
   */
  async execute(
    context: PipelineContext,
    projectContext: CanonicalState,
    recentEvents: any[] = []
  ): Promise<StageResult<ResolutionOutput | PartialResolution>> {
    
    // 1. AI Engine Handshake
    // Calls DeepSeek to resolve intent into Tact delta and JUS entry.
    const resolution = await this.aiResolver.resolve(
      context.input,
      projectContext,
      recentEvents
    );

    // 2. Check for Partial Resolution (Audit Trigger)
    if ('partialJusEntry' in resolution) {
      return {
        status: 'branch',
        output: resolution,
        auditRequest: {
          auditSessionId: context.id, // Using context ID as session ID for now
          partialResolution: resolution
        }
      };
    }

    // 3. Deterministic Validation (Security-First)
    // Ensures proposed changes do not violate core system constraints.
    const validation = ConstraintsEngine.validate(
      resolution, 
      projectContext.jus, 
      context.safetyModeEnabled
    );

    if (validation.status === 'hard_block') {
      return {
        status: 'failure',
        issueCard: validation.issues[0] // Return the primary violation
      };
    }

    // 4. Success - Proposed Delta stored in context
    return {
      status: 'success',
      output: resolution
    };
  }
}
