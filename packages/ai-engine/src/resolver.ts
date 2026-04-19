import { ResolutionOutput, PartialResolution, PipelineInput, CanonicalState } from '@temix/types';
import { DeepSeekClient } from './DeepSeekClient';
import { AIParser } from './parser';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts';

export class AIResolver {
  private client: DeepSeekClient;

  constructor(apiKey: string) {
    this.client = new DeepSeekClient({ apiKey });
  }

  /**
   * Resolves developer intent into a resolution candidate.
   * Called by Stage 2 of the pipeline.
   */
  async resolve(
    input: PipelineInput,
    projectContext: CanonicalState,
    recentEvents: any[]
  ): Promise<ResolutionOutput | PartialResolution> {
    const userPrompt = buildUserPrompt(input.content, {
      fileTree: projectContext.fileTree,
      jusSchema: projectContext.jus,
      recentEvents,
    });

    try {
      const rawResponse = await this.client.chat([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ]);

      return AIParser.parse(rawResponse);
    } catch (error: any) {
      // Timeout or API error routes to Stage 2-B
      return {
        partialJusEntry: {
          unresolvedFields: ['all'],
          reason: `AI Engine Error: ${error.message}`,
        },
      } as PartialResolution;
    }
  }
}
