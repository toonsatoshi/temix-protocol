import { CompiledArtifact, FileTree } from '@temix/types';
import { TactCompiler } from '@temix/tact-compiler';

export class ArtifactStore {
  /**
   * Compiles the file tree and stores the artifacts (FM-01).
   * In a real system, this would cache artifacts by source hash.
   */
  static async buildArtifacts(fileTree: FileTree): Promise<CompiledArtifact | null> {
    const result = await TactCompiler.compile(fileTree);
    
    if (result.status === 'success' && result.artifacts) {
      return result.artifacts;
    }
    
    return null;
  }
}
