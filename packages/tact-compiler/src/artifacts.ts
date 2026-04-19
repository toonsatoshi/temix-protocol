import { CompiledArtifact } from '@temix/types';

export interface ArtifactMetadata {
  compilerVersion: string;
  optimized: boolean;
  timestamp: number;
}

export class TactArtifacts {
  /**
   * Helper to validate if a CompiledArtifact is complete.
   */
  static isValid(artifact: CompiledArtifact): boolean {
    return !!(artifact.bytecode && artifact.abi && artifact.boc);
  }

  /**
   * Formats compilation metadata into a standardized structure.
   */
  static createMetadata(version: string, optimized: boolean = true): ArtifactMetadata {
    return {
      compilerVersion: version,
      optimized,
      timestamp: Date.now(),
    };
  }
}
