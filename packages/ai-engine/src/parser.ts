import { ResolutionOutput, PartialResolution } from '@temix/types';

export class AIParser {
  /**
   * Parses the raw JSON response from DeepSeek.
   * If parsing fails or schema is invalid, returns a PartialResolution.
   */
  static parse(raw: any): ResolutionOutput | PartialResolution {
    try {
      if (!raw || typeof raw !== 'object') {
        throw new Error('Raw response is not a valid object');
      }

      // Check for required fields
      if (raw.tactDelta && raw.jusEntry && !raw.isPartial) {
        return {
          tactDelta: raw.tactDelta,
          jusEntry: raw.jusEntry,
        } as ResolutionOutput;
      }

      // Partial or fallback
      return {
        tactDelta: raw.tactDelta,
        partialJusEntry: raw.jusEntry || { unresolvedFields: ['all'], reason: 'Malformed response' },
      } as PartialResolution;
    } catch (error: any) {
      return {
        partialJusEntry: { 
          unresolvedFields: ['all'], 
          reason: `ParserError: ${error.message}` 
        },
      } as PartialResolution;
    }
  }
}
